package com.capstone.service;

import com.capstone.dto.OrderDTO;
import com.capstone.entity.*;
import com.capstone.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final GiftPointRepository giftPointRepository;
    private final PaymentRepository paymentRepository;
    private final AuditService auditService;

    private final Map<Long, List<OrderDTO.CartItemRequest>> cartStore = new HashMap<>();

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        AddressRepository addressRepository,
                        GiftPointRepository giftPointRepository,
                        PaymentRepository paymentRepository,
                        AuditService auditService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.giftPointRepository = giftPointRepository;
        this.paymentRepository = paymentRepository;
        this.auditService = auditService;
    }

    @Transactional
    public void addToCart(Long userId, OrderDTO.CartItemRequest request) {
        cartStore.computeIfAbsent(userId, k -> new ArrayList<>());
        List<OrderDTO.CartItemRequest> items = cartStore.get(userId);
        Optional<OrderDTO.CartItemRequest> existing = items.stream()
                .filter(i -> i.getProductId().equals(request.getProductId()))
                .findFirst();
        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + request.getQuantity());
        } else {
            items.add(request);
        }
    }

    @Transactional
    public void updateCartItem(Long userId, Long productId, Integer quantity) {
        List<OrderDTO.CartItemRequest> items = cartStore.getOrDefault(userId, new ArrayList<>());
        items.removeIf(i -> i.getProductId().equals(productId));
        if (quantity > 0) {
            OrderDTO.CartItemRequest item = new OrderDTO.CartItemRequest();
            item.setProductId(productId);
            item.setQuantity(quantity);
            items.add(item);
        }
        cartStore.put(userId, items);
    }

    @Transactional
    public void removeFromCart(Long userId, Long productId) {
        List<OrderDTO.CartItemRequest> items = cartStore.getOrDefault(userId, new ArrayList<>());
        items.removeIf(i -> i.getProductId().equals(productId));
        cartStore.put(userId, items);
    }

    public OrderDTO.CartResponse getCart(Long userId) {
        List<OrderDTO.CartItemRequest> items = cartStore.getOrDefault(userId, new ArrayList<>());
        List<OrderDTO.CartItemResponse> cartItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderDTO.CartItemRequest req : items) {
            Product product = productRepository.findById(req.getProductId()).orElse(null);
            if (product != null && product.getIsActive()) {
                OrderDTO.CartItemResponse item = new OrderDTO.CartItemResponse();
                item.setProductId(product.getId());
                item.setProductName(product.getName());
                item.setProductImage(product.getImageUrls());
                item.setUnitPrice(product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice());
                item.setQuantity(req.getQuantity());
                item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(req.getQuantity())));
                item.setStockQuantity(product.getStockQuantity());
                cartItems.add(item);
                subtotal = subtotal.add(item.getTotalPrice());
            }
        }

        OrderDTO.CartResponse resp = new OrderDTO.CartResponse();
        resp.setItems(cartItems);
        resp.setSubtotal(subtotal);
        resp.setDiscount(BigDecimal.ZERO);
        resp.setGiftPointDiscount(BigDecimal.ZERO);
        resp.setTotal(subtotal);
        resp.setAvailableGiftPoints(giftPointRepository.getBalance(userId));
        return resp;
    }

    @Transactional
    public OrderDTO.Response placeOrder(Long userId, OrderDTO.PlaceRequest request) {
        User user = new User();
        user.setId(userId);

        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));

        List<OrderDTO.CartItemRequest> cartItems = cartStore.getOrDefault(userId, new ArrayList<>());
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        String orderNumber = "ORD" + System.currentTimeMillis() +
                ThreadLocalRandom.current().nextInt(1000, 9999);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderDTO.CartItemRequest req : cartItems) {
            Product product = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + req.getProductId()));

            if (product.getStockQuantity() < req.getQuantity()) {
                throw new RuntimeException("Insufficient stock for: " + product.getName());
            }

            BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(req.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .seller(product.getSeller())
                    .quantity(req.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .build();
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(itemTotal);

            product.setStockQuantity(product.getStockQuantity() - req.getQuantity());
            productRepository.save(product);
        }

        BigDecimal giftPointDiscount = BigDecimal.ZERO;
        if (request.getGiftPointsToUse() != null && request.getGiftPointsToUse() > 0) {
            Integer balance = giftPointRepository.getBalance(userId);
            if (balance < request.getGiftPointsToUse()) {
                throw new RuntimeException("Insufficient gift points");
            }
            giftPointDiscount = BigDecimal.valueOf(request.getGiftPointsToUse());
            GiftPoint redeem = GiftPoint.builder()
                    .user(user)
                    .points(request.getGiftPointsToUse())
                    .type(GiftPoint.PointType.REDEEMED)
                    .description("Redeemed at checkout")
                    .build();
            giftPointRepository.save(redeem);
        }

        BigDecimal finalAmount = totalAmount.subtract(giftPointDiscount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .address(address)
                .totalAmount(totalAmount)
                .discountAmount(BigDecimal.ZERO)
                .giftPointsUsed(request.getGiftPointsToUse() != null ? request.getGiftPointsToUse() : 0)
                .finalAmount(finalAmount)
                .status(Order.OrderStatus.PLACED)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .build();
        order = orderRepository.save(order);

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);
        }

        // Mock payment
        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD")
                .amount(finalAmount)
                .currency("INR")
                .transactionId("TXN" + System.currentTimeMillis())
                .status(Payment.PaymentStatus.COMPLETED)
                .gatewayResponse("{\"status\":\"success\",\"message\":\"Mock payment completed\"}")
                .build();
        paymentRepository.save(payment);

        order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Award gift points (1 point per 100 spent)
        int pointsEarned = finalAmount.divideToIntegralValue(BigDecimal.valueOf(100)).intValue();
        if (pointsEarned > 0) {
            GiftPoint earned = GiftPoint.builder()
                    .user(user)
                    .points(pointsEarned)
                    .type(GiftPoint.PointType.EARNED)
                    .description("Earned from order " + orderNumber)
                    .order(order)
                    .build();
            giftPointRepository.save(earned);
        }

        auditService.log(user, "PLACE_ORDER", "ORDER", order.getId(),
                null, orderNumber, null);

        cartStore.remove(userId);
        return mapToResponse(order);
    }

    public Page<OrderDTO.Response> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public void cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Order already cancelled");
        }
        if (LocalDateTime.now().isAfter(order.getCanCancelUntil())) {
            throw new RuntimeException("48-hour cancellation window has passed");
        }

        // Restore stock
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        orderRepository.save(order);
        auditService.log("CANCEL_ORDER", "ORDER", orderId, "CONFIRMED", "CANCELLED");
    }

    private OrderDTO.Response mapToResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        OrderDTO.Response resp = new OrderDTO.Response();
        resp.setId(order.getId());
        resp.setOrderNumber(order.getOrderNumber());
        resp.setTotalAmount(order.getTotalAmount());
        resp.setDiscountAmount(order.getDiscountAmount());
        resp.setGiftPointsUsed(order.getGiftPointsUsed());
        resp.setFinalAmount(order.getFinalAmount());
        resp.setStatus(order.getStatus().name());
        resp.setPaymentStatus(order.getPaymentStatus().name());
        resp.setCanCancelUntil(order.getCanCancelUntil());
        resp.setCreatedAt(order.getCreatedAt());
        resp.setAddress(order.getAddress() != null ?
                order.getAddress().getAddressLine1() + ", " + order.getAddress().getCity() : null);

        resp.setItems(items.stream().map(item -> {
            OrderDTO.OrderItemResponse ir = new OrderDTO.OrderItemResponse();
            ir.setId(item.getId());
            ir.setProductId(item.getProduct().getId());
            ir.setProductName(item.getProduct().getName());
            ir.setProductImage(item.getProduct().getImageUrls());
            ir.setQuantity(item.getQuantity());
            ir.setUnitPrice(item.getUnitPrice());
            ir.setTotalPrice(item.getTotalPrice());
            ir.setSellerName(item.getSeller().getBusinessName());
            return ir;
        }).collect(Collectors.toList()));

        return resp;
    }
}
