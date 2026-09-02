package com.capstone.dto;

import jakarta.validation.constraints.*;

public class AdminDTO {
    public static class DashboardResponse {
        private Long totalSellers;
        private Long pendingApprovals;
        private Long totalProducts;
        private Long totalOrders;
        private Long totalCustomers;

        public DashboardResponse() {}

        public Long getTotalSellers() { return totalSellers; }
        public void setTotalSellers(Long totalSellers) { this.totalSellers = totalSellers; }
        public Long getPendingApprovals() { return pendingApprovals; }
        public void setPendingApprovals(Long pendingApprovals) { this.pendingApprovals = pendingApprovals; }
        public Long getTotalProducts() { return totalProducts; }
        public void setTotalProducts(Long totalProducts) { this.totalProducts = totalProducts; }
        public Long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
        public Long getTotalCustomers() { return totalCustomers; }
        public void setTotalCustomers(Long totalCustomers) { this.totalCustomers = totalCustomers; }
    }

    public static class SellerResponse {
        private Long id;
        private String businessName;
        private String customerName;
        private String email;
        private String businessAddress;
        private String gstNumber;
        private String approvalStatus;
        private String approvedByName;
        private Long productCount;

        public SellerResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getBusinessAddress() { return businessAddress; }
        public void setBusinessAddress(String businessAddress) { this.businessAddress = businessAddress; }
        public String getGstNumber() { return gstNumber; }
        public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
        public String getApprovalStatus() { return approvalStatus; }
        public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
        public String getApprovedByName() { return approvedByName; }
        public void setApprovedByName(String approvedByName) { this.approvedByName = approvedByName; }
        public Long getProductCount() { return productCount; }
        public void setProductCount(Long productCount) { this.productCount = productCount; }
    }

    public static class UserResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String status;

        public UserResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class UserStatusRequest {
        @NotBlank
        private String status;

        public UserStatusRequest() {}

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
