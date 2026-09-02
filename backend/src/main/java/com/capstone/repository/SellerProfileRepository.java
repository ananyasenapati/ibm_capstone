package com.capstone.repository;

import com.capstone.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    Optional<SellerProfile> findByUserId(Long userId);
    List<SellerProfile> findByApprovalStatus(SellerProfile.ApprovalStatus status);
    boolean existsByUserId(Long userId);
}
