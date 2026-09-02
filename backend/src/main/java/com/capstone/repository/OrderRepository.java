package com.capstone.repository;

import com.capstone.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT o FROM Order o WHERE o.id IN (SELECT oi.order.id FROM OrderItem oi WHERE oi.seller.id = :sellerId) ORDER BY o.createdAt DESC")
    Page<Order> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    long countByStatus(Order.OrderStatus status);
}
