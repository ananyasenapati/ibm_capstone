package com.capstone.dto;

import java.math.BigDecimal;

public class SellerDTO {
    public static class DashboardResponse {
        private Long totalProducts;
        private Long totalOrders;
        private Long pendingOrders;
        private Long deliveredOrders;
        private BigDecimal totalRevenue;
        private Double averageRating;

        public DashboardResponse() {}

        public Long getTotalProducts() { return totalProducts; }
        public void setTotalProducts(Long totalProducts) { this.totalProducts = totalProducts; }
        public Long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
        public Long getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(Long pendingOrders) { this.pendingOrders = pendingOrders; }
        public Long getDeliveredOrders() { return deliveredOrders; }
        public void setDeliveredOrders(Long deliveredOrders) { this.deliveredOrders = deliveredOrders; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
        public Double getAverageRating() { return averageRating; }
        public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    }

    public static class ProfileResponse {
        private Long id;
        private String businessName;
        private String businessAddress;
        private String gstNumber;
        private String description;
        private String logoUrl;
        private String approvalStatus;

        public ProfileResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public String getBusinessAddress() { return businessAddress; }
        public void setBusinessAddress(String businessAddress) { this.businessAddress = businessAddress; }
        public String getGstNumber() { return gstNumber; }
        public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getLogoUrl() { return logoUrl; }
        public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
        public String getApprovalStatus() { return approvalStatus; }
        public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    }

    public static class ProfileUpdateRequest {
        private String businessName;
        private String businessAddress;
        private String gstNumber;
        private String description;
        private String logoUrl;

        public ProfileUpdateRequest() {}

        public String getBusinessName() { return businessName; }
        public void setBusinessName(String businessName) { this.businessName = businessName; }
        public String getBusinessAddress() { return businessAddress; }
        public void setBusinessAddress(String businessAddress) { this.businessAddress = businessAddress; }
        public String getGstNumber() { return gstNumber; }
        public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getLogoUrl() { return logoUrl; }
        public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    }

    public static class OrderStatusUpdateRequest {
        private String status;

        public OrderStatusUpdateRequest() {}

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
