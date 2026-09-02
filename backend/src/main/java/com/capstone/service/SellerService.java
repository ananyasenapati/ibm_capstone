package com.capstone.service;

import com.capstone.dto.OrderDTO;
import com.capstone.dto.RatingDTO;
import com.capstone.dto.SellerDTO;
import com.capstone.entity.*;
import com.capstone.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SellerService(SellerProfileRepository sellerProfileRepository,
                         ProductRepository productRepository,
                         OrderRepository orderRepository,
                         OrderItemRepository orderItemRepository,
                         RatingRepository ratingRepository,
                         UserRepository userRepository,
                         AuditService auditService) {
        this.sellerProfileRepository = sellerProfileRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public SellerDTO.DashboardResponse getDashboard(Long userId) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));

        SellerDTO.DashboardResponse dash = new SellerDTO.DashboardResponse();
        dash.setTotalProducts(productRepository.countBySellerId(profile.getId()));

        List<OrderItem> allItems = orderItemRepository.findBySellerId(profile.getId());
        dash.setTotalOrders((long) allItems.size());

        long pending = allItems.stream()
                .filter(i -> i.getOrder().getStatus() != Order.OrderStatus.DELIVERED)
                .filter(i -> i.getOrder().getStatus() != Order.OrderStatus.CANCELLED)
                .count();
        dash.setPendingOrders(pending);

        long delivered = allItems.stream()
                .filter(i -> i.getOrder().getStatus() == Order.OrderStatus.DELIVERED)
                .count();
        dash.setDeliveredOrders(delivered);

        BigDecimal revenue = allItems.stream()
                .filter(i -> i.getOrder().getPaymentStatus() == Order.PaymentStatus.COMPLETED)
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dash.setTotalRevenue(revenue);

        List<Product> products = productRepository.findBySellerIdAndIsActiveTrue(profile.getId());
        double avgRating = products.stream()
                .mapToDouble(p -> p.getRatingAvg() != null ? p.getRatingAvg().doubleValue() : 0)
                .average().orElse(0);
        dash.setAverageRating(avgRating);

        return dash;
    }

    public Page<OrderDTO.SellerOrderResponse> getSellerOrders(Long userId, Pageable pageable) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        Page<Order> orders = orderRepository.findBySellerId(profile.getId(), pageable);

        List<OrderDTO.SellerOrderResponse> content = orders.getContent().stream()
                .map(order -> {
                    List<OrderItem> sellerItems = orderItemRepository.findByOrderId(order.getId()).stream()
                            .filter(i -> i.getSeller().getId().equals(profile.getId()))
                            .collect(Collectors.toList());
                    if (sellerItems.isEmpty()) return null;
                    OrderItem first = sellerItems.get(0);
                    OrderDTO.SellerOrderResponse resp = new OrderDTO.SellerOrderResponse();
                    resp.setOrderId(order.getId());
                    resp.setOrderNumber(order.getOrderNumber());
                    resp.setCustomerName(order.getUser().getName());
                    resp.setProductName(first.getProduct().getName());
                    resp.setQuantity(sellerItems.stream().mapToInt(OrderItem::getQuantity).sum());
                    resp.setTotalPrice(sellerItems.stream().map(OrderItem::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add));
                    resp.setStatus(order.getStatus().name());
                    resp.setCreatedAt(order.getCreatedAt());
                    return resp;
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(content, pageable, orders.getTotalElements());
    }

    @Transactional
    public OrderDTO.SellerOrderResponse updateOrderStatus(Long userId, Long orderId, String newStatusStr) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        boolean ownsItems = orderItemRepository.findByOrderId(order.getId()).stream()
                .anyMatch(i -> i.getSeller().getId().equals(profile.getId()));
        if (!ownsItems) {
            throw new RuntimeException("You do not have items in this order");
        }

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status");
        }

        Order.OrderStatus current = order.getStatus();
        boolean allowed =
                (current == Order.OrderStatus.PLACED || current == Order.OrderStatus.CONFIRMED
                        || current == Order.OrderStatus.PROCESSING)
                        && (newStatus == Order.OrderStatus.CONFIRMED || newStatus == Order.OrderStatus.SHIPPED
                        || newStatus == Order.OrderStatus.CANCELLED)
                || (current == Order.OrderStatus.SHIPPED && newStatus == Order.OrderStatus.DELIVERED);
        if (!allowed) {
            throw new RuntimeException("Cannot change order status from " + current + " to " + newStatus);
        }

        order.setStatus(newStatus);
        if (newStatus == Order.OrderStatus.DELIVERED && order.getPaymentStatus() == Order.PaymentStatus.PENDING) {
            order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
        }
        orderRepository.save(order);
        auditService.log("UPDATE_ORDER_STATUS", "ORDER", order.getId(), current.name(), newStatus.name());

        List<OrderItem> sellerItems = orderItemRepository.findByOrderId(order.getId()).stream()
                .filter(i -> i.getSeller().getId().equals(profile.getId()))
                .collect(Collectors.toList());
        OrderItem first = sellerItems.get(0);
        OrderDTO.SellerOrderResponse resp = new OrderDTO.SellerOrderResponse();
        resp.setOrderId(order.getId());
        resp.setOrderNumber(order.getOrderNumber());
        resp.setCustomerName(order.getUser().getName());
        resp.setProductName(first.getProduct().getName());
        resp.setQuantity(sellerItems.stream().mapToInt(OrderItem::getQuantity).sum());
        resp.setTotalPrice(sellerItems.stream().map(OrderItem::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add));
        resp.setStatus(order.getStatus().name());
        resp.setCreatedAt(order.getCreatedAt());
        return resp;
    }

    public SellerDTO.ProfileResponse getProfile(Long userId) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        return mapProfile(profile);
    }

    @Transactional
    public SellerDTO.ProfileResponse updateProfile(Long userId, SellerDTO.ProfileUpdateRequest request) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        if (request.getBusinessName() != null) profile.setBusinessName(request.getBusinessName());
        if (request.getBusinessAddress() != null) profile.setBusinessAddress(request.getBusinessAddress());
        if (request.getGstNumber() != null) profile.setGstNumber(request.getGstNumber());
        if (request.getDescription() != null) profile.setDescription(request.getDescription());
        if (request.getLogoUrl() != null) profile.setLogoUrl(request.getLogoUrl());
        sellerProfileRepository.save(profile);
        auditService.log("UPDATE_SELLER_PROFILE", "SELLER_PROFILE", profile.getId(),
                null, request.toString());
        return mapProfile(profile);
    }

    public List<RatingDTO.SellerRatingResponse> getSellerRatings(Long userId) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        List<Product> products = productRepository.findBySellerIdAndIsActiveTrue(profile.getId());
        return products.stream()
                .flatMap(p -> ratingRepository.findByProductId(p.getId()).stream())
                .map(r -> {
                    RatingDTO.SellerRatingResponse dto = new RatingDTO.SellerRatingResponse();
                    dto.setProductId(r.getProduct().getId());
                    dto.setProductName(r.getProduct().getName());
                    dto.setRating(r.getRating());
                    dto.setComment(r.getComment());
                    dto.setCustomerName(r.getUser().getName());
                    dto.setCreatedAt(r.getCreatedAt().toString());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private SellerDTO.ProfileResponse mapProfile(SellerProfile profile) {
        SellerDTO.ProfileResponse resp = new SellerDTO.ProfileResponse();
        resp.setId(profile.getId());
        resp.setBusinessName(profile.getBusinessName());
        resp.setBusinessAddress(profile.getBusinessAddress());
        resp.setGstNumber(profile.getGstNumber());
        resp.setDescription(profile.getDescription());
        resp.setLogoUrl(profile.getLogoUrl());
        resp.setApprovalStatus(profile.getApprovalStatus().name());
        return resp;
    }
}
