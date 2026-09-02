package com.capstone.controller;

import com.capstone.dto.ProductDTO;
import com.capstone.dto.RatingDTO;
import com.capstone.entity.User;
import com.capstone.service.ProductService;
import com.capstone.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final RatingService ratingService;

    public ProductController(ProductService productService, RatingService ratingService) {
        this.productService = productService;
        this.ratingService = ratingService;
    }

    @GetMapping
    public ResponseEntity<Page<ProductDTO.Response>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(productService.searchProducts(q, categoryId, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO.Response> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @GetMapping("/{id}/ratings")
    public ResponseEntity<List<RatingDTO.Response>> getProductRatings(@PathVariable Long id) {
        return ResponseEntity.ok(ratingService.getProductRatings(id));
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<RatingDTO.Response> createRating(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody RatingDTO.CreateRequest request) {
        return ResponseEntity.ok(ratingService.createRating(user.getId(), id, request));
    }
}
