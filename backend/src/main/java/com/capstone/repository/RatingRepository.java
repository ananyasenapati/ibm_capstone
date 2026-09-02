package com.capstone.repository;

import com.capstone.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByProductId(Long productId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
