package com.capstone.controller;

import com.capstone.dto.OrderDTO;
import com.capstone.entity.User;
import com.capstone.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final OrderService orderService;

    public CartController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<OrderDTO.CartResponse> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(orderService.getCart(user.getId()));
    }

    @PostMapping("/items")
    public ResponseEntity<Void> addToCart(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody OrderDTO.CartItemRequest request) {
        orderService.addToCart(user.getId(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<Void> updateCartItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        orderService.updateCartItem(user.getId(), productId, quantity);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Void> removeFromCart(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId) {
        orderService.removeFromCart(user.getId(), productId);
        return ResponseEntity.ok().build();
    }
}
