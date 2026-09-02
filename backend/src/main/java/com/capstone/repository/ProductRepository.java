package com.capstone.repository;

import com.capstone.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByIsActiveTrue(Pageable pageable);
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);
    List<Product> findBySellerIdAndIsActiveTrue(Long sellerId);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%',:query,'%')) OR " +
           "LOWER(p.author) LIKE LOWER(CONCAT('%',:query,'%')))")
    Page<Product> search(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId")
    Page<Product> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    long countBySellerId(Long sellerId);
}
