package com.nutrition.tracker.repository;

import com.nutrition.tracker.entity.FoodLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {

    Optional<FoodLog> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndLoggedAt(Long userId, Instant loggedAt);

    long countByUserIdAndFoodIdAndLoggedAtBetween(Long userId, Long foodId, Instant start, Instant end);

    long countByUserIdAndFoodNameIgnoreCaseAndLoggedAtBetween(Long userId, String foodName, Instant start, Instant end);

    List<FoodLog> findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(Long userId, Instant start, Instant end);

    Page<FoodLog> findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(Long userId, Instant start, Instant end, Pageable pageable);

    List<FoodLog> findTop10ByUserIdOrderByLoggedAtDesc(Long userId);

    @Query("SELECT DISTINCT f.foodName FROM FoodLog f WHERE f.user.id = :userId ORDER BY f.foodName ASC")
    List<String> findRecentDistinctFoodNames(@Param("userId") Long userId);
}
