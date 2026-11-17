package com.nutrition.tracker.repository;

import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodCatalogRepository extends JpaRepository<FoodCatalog, Long> {

    Optional<FoodCatalog> findByBarcode(String barcode);

    @Query("SELECT f FROM FoodCatalog f WHERE (f.createdBy IS NULL OR f.createdBy.id = :userId) " +
           "AND LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY f.name ASC")
    List<FoodCatalog> searchByNameAndUser(@Param("keyword") String keyword, @Param("userId") Long userId);

    @Query("SELECT f FROM FoodCatalog f WHERE f.createdBy IS NULL OR f.createdBy.id = :userId ORDER BY f.name ASC")
    Page<FoodCatalog> findAllVisibleToUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f FROM FoodCatalog f WHERE (f.createdBy IS NULL OR f.createdBy.id = :userId) " +
           "AND (LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')) OR f.barcode = :search) ORDER BY f.name ASC")
    Page<FoodCatalog> searchCatalog(@Param("search") String search, @Param("userId") Long userId, Pageable pageable);
}
