package com.capstone.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class ProductDTO {
    public static class CreateRequest {
        @NotBlank
        private String name;
        private String description;
        @NotNull @DecimalMin("0.01")
        private BigDecimal price;
        private BigDecimal discountPrice;
        private Long categoryId;
        @NotNull @Min(0)
        private Integer stockQuantity;
        private String imageUrls;
        private String isbn;
        private String author;
        private String publisher;
        private Integer publicationYear;

        public CreateRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public BigDecimal getDiscountPrice() { return discountPrice; }
        public void setDiscountPrice(BigDecimal discountPrice) { this.discountPrice = discountPrice; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public Integer getStockQuantity() { return stockQuantity; }
        public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
        public String getImageUrls() { return imageUrls; }
        public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
        public String getIsbn() { return isbn; }
        public void setIsbn(String isbn) { this.isbn = isbn; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getPublisher() { return publisher; }
        public void setPublisher(String publisher) { this.publisher = publisher; }
        public Integer getPublicationYear() { return publicationYear; }
        public void setPublicationYear(Integer publicationYear) { this.publicationYear = publicationYear; }
    }

    public static class UpdateRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private BigDecimal discountPrice;
        private Long categoryId;
        private Integer stockQuantity;
        private String imageUrls;
        private String isbn;
        private String author;
        private String publisher;
        private Integer publicationYear;
        private Boolean isActive;

        public UpdateRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public BigDecimal getDiscountPrice() { return discountPrice; }
        public void setDiscountPrice(BigDecimal discountPrice) { this.discountPrice = discountPrice; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public Integer getStockQuantity() { return stockQuantity; }
        public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
        public String getImageUrls() { return imageUrls; }
        public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
        public String getIsbn() { return isbn; }
        public void setIsbn(String isbn) { this.isbn = isbn; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getPublisher() { return publisher; }
        public void setPublisher(String publisher) { this.publisher = publisher; }
        public Integer getPublicationYear() { return publicationYear; }
        public void setPublicationYear(Integer publicationYear) { this.publicationYear = publicationYear; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }

    public static class Response {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private BigDecimal discountPrice;
        private String categoryName;
        private Long categoryId;
        private Long sellerId;
        private String sellerName;
        private Integer stockQuantity;
        private String imageUrls;
        private String isbn;
        private String author;
        private String publisher;
        private Integer publicationYear;
        private BigDecimal ratingAvg;
        private Integer ratingCount;
        private Boolean isActive;

        public Response() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public BigDecimal getDiscountPrice() { return discountPrice; }
        public void setDiscountPrice(BigDecimal discountPrice) { this.discountPrice = discountPrice; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public Long getSellerId() { return sellerId; }
        public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
        public String getSellerName() { return sellerName; }
        public void setSellerName(String sellerName) { this.sellerName = sellerName; }
        public Integer getStockQuantity() { return stockQuantity; }
        public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
        public String getImageUrls() { return imageUrls; }
        public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
        public String getIsbn() { return isbn; }
        public void setIsbn(String isbn) { this.isbn = isbn; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public String getPublisher() { return publisher; }
        public void setPublisher(String publisher) { this.publisher = publisher; }
        public Integer getPublicationYear() { return publicationYear; }
        public void setPublicationYear(Integer publicationYear) { this.publicationYear = publicationYear; }
        public BigDecimal getRatingAvg() { return ratingAvg; }
        public void setRatingAvg(BigDecimal ratingAvg) { this.ratingAvg = ratingAvg; }
        public Integer getRatingCount() { return ratingCount; }
        public void setRatingCount(Integer ratingCount) { this.ratingCount = ratingCount; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }
}
