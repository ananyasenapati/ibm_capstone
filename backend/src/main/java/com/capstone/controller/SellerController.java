package com.capstone.controller;

import com.capstone.dto.OrderDTO;
import com.capstone.dto.ProductDTO;
import com.capstone.dto.RatingDTO;
import com.capstone.dto.SellerDTO;
import com.capstone.entity.SellerProfile;
import com.capstone.entity.User;
import com.capstone.repository.SellerProfileRepository;
import com.capstone.service.ProductService;
import com.capstone.service.SellerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller")
public class SellerController {

    private final SellerService sellerService;
    private final ProductService productService;
    private final SellerProfileRepository sellerProfileRepository;

    public SellerController(SellerService sellerService, ProductService productService, SellerProfileRepository sellerProfileRepository) {
        this.sellerService = sellerService;
        this.productService = productService;
        this.sellerProfileRepository = sellerProfileRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<SellerDTO.DashboardResponse> getDashboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sellerService.getDashboard(user.getId()));
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderDTO.SellerOrderResponse>> getOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(sellerService.getSellerOrders(user.getId(), PageRequest.of(page, size)));
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderDTO.SellerOrderResponse> updateOrderStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId,
            @RequestBody SellerDTO.OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(sellerService.updateOrderStatus(user.getId(), orderId, request.getStatus()));
    }

    @GetMapping("/profile")
    public ResponseEntity<SellerDTO.ProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sellerService.getProfile(user.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<SellerDTO.ProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody SellerDTO.ProfileUpdateRequest request) {
        return ResponseEntity.ok(sellerService.updateProfile(user.getId(), request));
    }

    @GetMapping("/products")
    public ResponseEntity<Page<ProductDTO.Response>> listProducts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        SellerProfile profile = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        return ResponseEntity.ok(productService.getSellerProducts(profile.getId(), PageRequest.of(page, size)));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductDTO.Response> createProduct(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProductDTO.CreateRequest request) {
        SellerProfile profile = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        return ResponseEntity.ok(productService.createProduct(request, profile.getId()));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductDTO.Response> updateProduct(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO.UpdateRequest request) {
        SellerProfile profile = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        return ResponseEntity.ok(productService.updateProduct(id, request, profile.getId()));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        SellerProfile profile = sellerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        productService.deleteProduct(id, profile.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ratings")
    public ResponseEntity<List<RatingDTO.SellerRatingResponse>> getRatings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sellerService.getSellerRatings(user.getId()));
    }
}
