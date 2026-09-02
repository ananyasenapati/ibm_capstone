package com.capstone.service;

import com.capstone.dto.ProductDTO;
import com.capstone.entity.Category;
import com.capstone.entity.Product;
import com.capstone.entity.SellerProfile;
import com.capstone.repository.CategoryRepository;
import com.capstone.repository.ProductRepository;
import com.capstone.repository.SellerProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          SellerProfileRepository sellerProfileRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.sellerProfileRepository = sellerProfileRepository;
    }

    public Page<ProductDTO.Response> searchProducts(String query, Long categoryId, Pageable pageable) {
        Page<Product> products;
        if (query != null && !query.isEmpty()) {
            products = productRepository.search(query, pageable);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
        } else {
            products = productRepository.findByIsActiveTrue(pageable);
        }
        return products.map(this::mapToResponse);
    }

    public ProductDTO.Response getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapToResponse(product);
    }

    @Transactional
    public ProductDTO.Response createProduct(ProductDTO.CreateRequest request, Long sellerId) {
        SellerProfile seller = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        if (seller.getApprovalStatus() != SellerProfile.ApprovalStatus.APPROVED) {
            throw new RuntimeException("Seller not approved");
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .seller(seller)
                .stockQuantity(request.getStockQuantity())
                .imageUrls(request.getImageUrls())
                .isbn(request.getIsbn())
                .author(request.getAuthor())
                .publisher(request.getPublisher())
                .publicationYear(request.getPublicationYear())
                .isActive(true)
                .build();

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    @Transactional
    public ProductDTO.Response updateProduct(Long productId, ProductDTO.UpdateRequest request, Long sellerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (!product.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("Not authorized");
        }

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getDiscountPrice() != null) product.setDiscountPrice(request.getDiscountPrice());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getImageUrls() != null) product.setImageUrls(request.getImageUrls());
        if (request.getIsbn() != null) product.setIsbn(request.getIsbn());
        if (request.getAuthor() != null) product.setAuthor(request.getAuthor());
        if (request.getPublisher() != null) product.setPublisher(request.getPublisher());
        if (request.getPublicationYear() != null) product.setPublicationYear(request.getPublicationYear());
        if (request.getIsActive() != null) product.setIsActive(request.getIsActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    @Transactional
    public void deleteProduct(Long productId, Long sellerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (!product.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("Not authorized");
        }
        product.setIsActive(false);
        productRepository.save(product);
    }

    public Page<ProductDTO.Response> getSellerProducts(Long sellerId, Pageable pageable) {
        return productRepository.findBySellerId(sellerId, pageable).map(this::mapToResponse);
    }

    private ProductDTO.Response mapToResponse(Product product) {
        ProductDTO.Response resp = new ProductDTO.Response();
        resp.setId(product.getId());
        resp.setName(product.getName());
        resp.setDescription(product.getDescription());
        resp.setPrice(product.getPrice());
        resp.setDiscountPrice(product.getDiscountPrice());
        resp.setCategoryName(product.getCategory() != null ? product.getCategory().getName() : null);
        resp.setCategoryId(product.getCategory() != null ? product.getCategory().getId() : null);
        resp.setSellerId(product.getSeller().getId());
        resp.setSellerName(product.getSeller().getBusinessName());
        resp.setStockQuantity(product.getStockQuantity());
        resp.setImageUrls(product.getImageUrls());
        resp.setIsbn(product.getIsbn());
        resp.setAuthor(product.getAuthor());
        resp.setPublisher(product.getPublisher());
        resp.setPublicationYear(product.getPublicationYear());
        resp.setRatingAvg(product.getRatingAvg());
        resp.setRatingCount(product.getRatingCount());
        resp.setIsActive(product.getIsActive());
        return resp;
    }
}
