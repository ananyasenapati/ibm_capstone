package com.capstone.repository;

import com.capstone.entity.GiftPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface GiftPointRepository extends JpaRepository<GiftPoint, Long> {
    List<GiftPoint> findByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(CASE WHEN gp.type='EARNED' THEN gp.points ELSE -gp.points END), 0) FROM GiftPoint gp WHERE gp.user.id = :userId")
    Integer getBalance(@Param("userId") Long userId);
}
