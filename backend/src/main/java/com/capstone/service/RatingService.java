package com.capstone.service;

import com.capstone.dto.RatingDTO;
import com.capstone.entity.Product;
import com.capstone.entity.Rating;
import com.capstone.entity.User;
import com.capstone.repository.ProductRepository;
import com.capstone.repository.RatingRepository;
import com.capstone.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatingService {

    private final RatingRepository ratingRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public RatingService(RatingRepository ratingRepository,
                         ProductRepository productRepository,
                         UserRepository userRepository) {
        this.ratingRepository = ratingRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public List<RatingDTO.Response> getProductRatings(Long productId) {
        return ratingRepository.findByProductId(productId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RatingDTO.Response createRating(Long userId, Long productId, RatingDTO.CreateRequest request) {
        if (ratingRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new RuntimeException("Already rated this product");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Rating rating = Rating.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .orderItemId(request.getOrderItemId())
                .build();
        rating = ratingRepository.save(rating);

        // Update product rating avg
        List<Rating> allRatings = ratingRepository.findByProductId(productId);
        BigDecimal avg = allRatings.stream()
                .map(r -> BigDecimal.valueOf(r.getRating()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(allRatings.size()), 2, RoundingMode.HALF_UP);
        product.setRatingAvg(avg);
        product.setRatingCount(allRatings.size());
        productRepository.save(product);

        return mapToResponse(rating);
    }

    private RatingDTO.Response mapToResponse(Rating rating) {
        RatingDTO.Response resp = new RatingDTO.Response();
        resp.setId(rating.getId());
        resp.setProductId(rating.getProduct().getId());
        resp.setProductName(rating.getProduct().getName());
        resp.setUserName(rating.getUser().getName());
        resp.setRating(rating.getRating());
        resp.setComment(rating.getComment());
        resp.setCreatedAt(rating.getCreatedAt().toString());
        return resp;
    }
}
