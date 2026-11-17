package com.nutrition.tracker.service;

import com.nutrition.tracker.dto.FoodCatalogRequest;
import com.nutrition.tracker.dto.FoodCatalogResponse;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.exception.ResourceNotFoundException;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import com.nutrition.tracker.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FoodCatalogService {

    private final FoodCatalogRepository foodCatalogRepository;

    public FoodCatalogService(FoodCatalogRepository foodCatalogRepository) {
        this.foodCatalogRepository = foodCatalogRepository;
    }

    @Transactional(readOnly = true)
    public List<FoodCatalogResponse> searchFoods(String keyword) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (keyword == null || keyword.trim().isEmpty()) {
            return foodCatalogRepository.findAllVisibleToUser(userId, PageRequest.of(0, 30))
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return foodCatalogRepository.searchByNameAndUser(keyword.trim(), userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<FoodCatalogResponse> getCatalogPaged(String search, int page, int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<FoodCatalog> foodPage;
        if (search != null && !search.trim().isEmpty()) {
            foodPage = foodCatalogRepository.searchCatalog(search.trim(), userId, pageable);
        } else {
            foodPage = foodCatalogRepository.findAllVisibleToUser(userId, pageable);
        }
        return foodPage.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public FoodCatalogResponse getFoodById(Long id) {
        FoodCatalog food = foodCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found with ID: " + id));
        return mapToResponse(food);
    }

    @Transactional(readOnly = true)
    public Optional<FoodCatalog> findByBarcode(String barcode) {
        if (barcode == null || barcode.isBlank()) {
            return Optional.empty();
        }
        return foodCatalogRepository.findByBarcode(barcode.trim());
    }

    @Transactional
    public FoodCatalogResponse addCustomFood(FoodCatalogRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        FoodCatalog food = new FoodCatalog(
                request.getName().trim(),
                request.getBarcode() != null && !request.getBarcode().isBlank() ? request.getBarcode().trim() : null,
                request.getServingUnit().trim(),
                request.getNutritionBasis(),
                request.getServingSize(),
                request.getCalories(),
                request.getCarbohydrates(),
                request.getProtein(),
                request.getFat(),
                request.getFiber(),
                request.getSugar(),
                true,
                currentUser
        );

        FoodCatalog saved = foodCatalogRepository.save(food);
        return mapToResponse(saved);
    }

    public FoodCatalogResponse mapToResponse(FoodCatalog food) {
        return new FoodCatalogResponse(
                food.getId(),
                food.getName(),
                food.getBarcode(),
                food.getServingUnit(),
                food.getNutritionBasis(),
                food.getServingSize(),
                food.getCalories(),
                food.getCarbohydrates(),
                food.getProtein(),
                food.getFat(),
                food.getFiber(),
                food.getSugar(),
                food.isCustom(),
                food.getCreatedAt()
        );
    }
}
