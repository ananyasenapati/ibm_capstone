package com.capstone.controller;

import com.capstone.dto.AdminDTO;
import com.capstone.dto.CategoryDTO;
import com.capstone.entity.User;
import com.capstone.service.AdminService;
import com.capstone.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final CategoryService categoryService;

    public AdminController(AdminService adminService, CategoryService categoryService) {
        this.adminService = adminService;
        this.categoryService = categoryService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDTO.DashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    @GetMapping("/sellers")
    public ResponseEntity<Page<AdminDTO.SellerResponse>> listSellers(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.listSellers(status, PageRequest.of(page, size)));
    }

    @PutMapping("/sellers/{id}/approve")
    public ResponseEntity<AdminDTO.SellerResponse> approveSeller(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(adminService.approveSeller(id, user.getId()));
    }

    @PutMapping("/sellers/{id}/reject")
    public ResponseEntity<AdminDTO.SellerResponse> rejectSeller(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(adminService.rejectSeller(id, user.getId()));
    }

    @DeleteMapping("/sellers/{id}")
    public ResponseEntity<Void> removeSeller(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        adminService.removeSeller(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminDTO.UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.listUsers(PageRequest.of(page, size)));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable Long id,
            @RequestBody AdminDTO.UserStatusRequest request,
            @AuthenticationPrincipal User user) {
        adminService.updateUserStatus(id, request.getStatus(), user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO.Response>> listCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryDTO.Response> createCategory(@Valid @RequestBody CategoryDTO.CreateRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryDTO.Response> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryDTO.UpdateRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
