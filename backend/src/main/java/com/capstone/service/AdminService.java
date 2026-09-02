package com.capstone.service;

import com.capstone.dto.AdminDTO;
import com.capstone.dto.CategoryDTO;
import com.capstone.entity.*;
import com.capstone.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    public AdminService(UserRepository userRepository,
                        SellerProfileRepository sellerProfileRepository,
                        ProductRepository productRepository,
                        OrderRepository orderRepository,
                        CategoryRepository categoryRepository,
                        AuditService auditService) {
        this.userRepository = userRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.categoryRepository = categoryRepository;
        this.auditService = auditService;
    }

    public AdminDTO.DashboardResponse getDashboard() {
        AdminDTO.DashboardResponse dash = new AdminDTO.DashboardResponse();
        dash.setTotalSellers(sellerProfileRepository.count());
        dash.setPendingApprovals((long) sellerProfileRepository.findByApprovalStatus(SellerProfile.ApprovalStatus.PENDING).size());
        dash.setTotalProducts(productRepository.count());
        dash.setTotalOrders(orderRepository.count());
        dash.setTotalCustomers(userRepository.count() - sellerProfileRepository.count() - 1);
        return dash;
    }

    public Page<AdminDTO.SellerResponse> listSellers(String status, Pageable pageable) {
        Page<SellerProfile> profiles;
        if (status != null && !status.isEmpty()) {
            SellerProfile.ApprovalStatus as = SellerProfile.ApprovalStatus.valueOf(status.toUpperCase());
            profiles = sellerProfileRepository.findByApprovalStatus(as).stream()
                    .collect(Collectors.collectingAndThen(Collectors.toList(), list ->
                            new org.springframework.data.domain.PageImpl<>(list, pageable, list.size())));
        } else {
            profiles = sellerProfileRepository.findAll(pageable);
        }
        return profiles.map(this::mapSellerResponse);
    }

    @Transactional
    public AdminDTO.SellerResponse approveSeller(Long sellerId, Long adminId) {
        SellerProfile profile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        User admin = userRepository.findById(adminId).orElseThrow();
        profile.setApprovalStatus(SellerProfile.ApprovalStatus.APPROVED);
        profile.setApprovedBy(admin);
        profile.setApprovedAt(LocalDateTime.now());
        profile.getUser().setStatus(User.UserStatus.ACTIVE);
        sellerProfileRepository.save(profile);
        auditService.log(admin, "APPROVE_SELLER", "SELLER_PROFILE", sellerId,
                "PENDING", "APPROVED", null);
        return mapSellerResponse(profile);
    }

    @Transactional
    public AdminDTO.SellerResponse rejectSeller(Long sellerId, Long adminId) {
        SellerProfile profile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        User admin = userRepository.findById(adminId).orElseThrow();
        profile.setApprovalStatus(SellerProfile.ApprovalStatus.REJECTED);
        profile.setRejectedAt(LocalDateTime.now());
        profile.getUser().setStatus(User.UserStatus.INACTIVE);
        sellerProfileRepository.save(profile);
        auditService.log(admin, "REJECT_SELLER", "SELLER_PROFILE", sellerId,
                "PENDING", "REJECTED", null);
        return mapSellerResponse(profile);
    }

    @Transactional
    public void removeSeller(Long sellerId, Long adminId) {
        SellerProfile profile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
        User admin = userRepository.findById(adminId).orElseThrow();
        profile.getUser().setStatus(User.UserStatus.INACTIVE);
        profile.setApprovalStatus(SellerProfile.ApprovalStatus.REJECTED);
        userRepository.save(profile.getUser());
        auditService.log(admin, "REMOVE_SELLER", "SELLER_PROFILE", sellerId,
                "ACTIVE", "INACTIVE", null);
    }

    public Page<AdminDTO.UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(user -> {
            AdminDTO.UserResponse resp = new AdminDTO.UserResponse();
            resp.setId(user.getId());
            resp.setName(user.getName());
            resp.setEmail(user.getEmail());
            resp.setPhone(user.getPhone());
            resp.setRole(user.getRole().name());
            resp.setStatus(user.getStatus().name());
            return resp;
        });
    }

    @Transactional
    public void updateUserStatus(Long userId, String status, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User admin = userRepository.findById(adminId).orElseThrow();
        String oldStatus = user.getStatus().name();
        user.setStatus(User.UserStatus.valueOf(status.toUpperCase()));
        userRepository.save(user);
        auditService.log(admin, "UPDATE_USER_STATUS", "USER", userId,
                oldStatus, status, null);
    }

    public List<CategoryDTO.Response> listCategories() {
        return categoryRepository.findAll().stream().map(this::mapCategory).collect(Collectors.toList());
    }

    private CategoryDTO.Response mapCategory(Category cat) {
        CategoryDTO.Response dto = new CategoryDTO.Response();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setDescription(cat.getDescription());
        dto.setImageUrl(cat.getImageUrl());
        dto.setParentId(cat.getParent() != null ? cat.getParent().getId() : null);
        dto.setIsActive(cat.getIsActive());
        return dto;
    }

    private AdminDTO.SellerResponse mapSellerResponse(SellerProfile profile) {
        AdminDTO.SellerResponse resp = new AdminDTO.SellerResponse();
        resp.setId(profile.getId());
        resp.setBusinessName(profile.getBusinessName());
        resp.setCustomerName(profile.getUser().getName());
        resp.setEmail(profile.getUser().getEmail());
        resp.setBusinessAddress(profile.getBusinessAddress());
        resp.setGstNumber(profile.getGstNumber());
        resp.setApprovalStatus(profile.getApprovalStatus().name());
        resp.setApprovedByName(profile.getApprovedBy() != null ? profile.getApprovedBy().getName() : null);
        resp.setProductCount(productRepository.countBySellerId(profile.getId()));
        return resp;
    }
}
