package com.capstone.controller;

import com.capstone.dto.OrderDTO;
import com.capstone.entity.User;
import com.capstone.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderDTO.Response> placeOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody OrderDTO.PlaceRequest request) {
        return ResponseEntity.ok(orderService.placeOrder(user.getId(), request));
    }

    @GetMapping
    public ResponseEntity<Page<OrderDTO.Response>> getOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(orderService.getUserOrders(user.getId(), PageRequest.of(page, size)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        orderService.cancelOrder(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
