package com.nutrition.tracker.service;

import com.nutrition.tracker.dto.*;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.FoodLog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.exception.DailyLimitExceededException;
import com.nutrition.tracker.exception.DuplicateLogTimestampException;
import com.nutrition.tracker.exception.ResourceNotFoundException;
import com.nutrition.tracker.exception.ValidationException;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import com.nutrition.tracker.repository.FoodLogRepository;
import com.nutrition.tracker.repository.UserRepository;
import com.nutrition.tracker.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FoodLogService {

    private final FoodLogRepository foodLogRepository;
    private final FoodCatalogRepository foodCatalogRepository;
    private final UserRepository userRepository;
    private final NutritionCalculator nutritionCalculator;

    public FoodLogService(FoodLogRepository foodLogRepository,
                          FoodCatalogRepository foodCatalogRepository,
                          UserRepository userRepository,
                          NutritionCalculator nutritionCalculator) {
        this.foodLogRepository = foodLogRepository;
        this.foodCatalogRepository = foodCatalogRepository;
        this.userRepository = userRepository;
        this.nutritionCalculator = nutritionCalculator;
    }

    /**
     * Preview calculated nutrition without saving.
     */
    public NutritionPreviewResponse previewNutrition(NutritionPreviewRequest request) {
        if (request.getConsumedQuantity() == null || request.getConsumedQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Quantity must be greater than zero.");
        }

        NutritionBasis basis = request.getNutritionBasis() != null ? request.getNutritionBasis() : NutritionBasis.PER_100G;
        BigDecimal servingSize = request.getServingSize() != null ? request.getServingSize() : new BigDecimal("100.00");
        String unit = request.getServingUnit() != null ? request.getServingUnit() : "g";

        BigDecimal baseCal = request.getCalories() != null ? request.getCalories() : BigDecimal.ZERO;
        BigDecimal baseCarb = request.getCarbohydrates() != null ? request.getCarbohydrates() : BigDecimal.ZERO;
        BigDecimal baseProt = request.getProtein() != null ? request.getProtein() : BigDecimal.ZERO;
        BigDecimal baseFat = request.getFat() != null ? request.getFat() : BigDecimal.ZERO;
        BigDecimal baseFib = request.getFiber() != null ? request.getFiber() : BigDecimal.ZERO;
        BigDecimal baseSug = request.getSugar() != null ? request.getSugar() : BigDecimal.ZERO;

        if (request.getFoodId() != null) {
            FoodCatalog food = foodCatalogRepository.findById(request.getFoodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Food catalog item not found with ID: " + request.getFoodId()));
            basis = food.getNutritionBasis();
            servingSize = food.getServingSize();
            unit = food.getServingUnit();
            baseCal = food.getCalories();
            baseCarb = food.getCarbohydrates();
            baseProt = food.getProtein();
            baseFat = food.getFat();
            baseFib = food.getFiber();
            baseSug = food.getSugar();
        }

        NutritionCalculator.CalculatedNutrients calc = nutritionCalculator.calculate(
                basis, servingSize, request.getConsumedQuantity(),
                baseCal, baseCarb, baseProt, baseFat, baseFib, baseSug
        );

        return new NutritionPreviewResponse(
                request.getConsumedQuantity(),
                unit,
                calc.calories(),
                calc.carbohydrates(),
                calc.protein(),
                calc.fat(),
                calc.fiber(),
                calc.sugar()
        );
    }

    /**
     * Creates a food log entry enforcing:
     * - Rule A: At most 3 logs of the same food item on the same local calendar day.
     * - Rule B: Unique database timestamp constraint per user.
     * - Rule C: Transaction-safe concurrency locking on user record.
     * - Rule D: Timestamps converted to and stored in UTC based on user timezone.
     * - Rule E: Snapshot of nutrition values stored in the food log row.
     */
    @Transactional
    public FoodLogResponse createFoodLog(FoodLogRequest request) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Rule C: Acquire pessimistic write lock on User to serialize log creations per user and prevent race conditions
        User user = userRepository.findByIdWithLock(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        // Rule D: Determine timestamp in UTC and user's local day range
        Instant loggedAt = request.getLoggedAt() != null ? request.getLoggedAt() : Instant.now();
        ZoneId userZone = getUserZoneId(user);
        ZonedDateTime userZonedTime = loggedAt.atZone(userZone);
        LocalDate localDay = userZonedTime.toLocalDate();

        Instant startOfDayUtc = localDay.atStartOfDay(userZone).toInstant();
        Instant endOfDayUtc = localDay.plusDays(1).atStartOfDay(userZone).toInstant().minusNanos(1_000_000);

        // Rule B: Prevent duplicate timestamps for the same user
        if (foodLogRepository.existsByUserIdAndLoggedAt(user.getId(), loggedAt)) {
            throw new DuplicateLogTimestampException(
                    "A food log entry already exists at this exact timestamp (" + loggedAt + ") for your account. " +
                    "Please adjust the time by a minute to record this entry."
            );
        }

        FoodCatalog food = null;
        String foodName = request.getFoodName().trim();
        String servingUnit = request.getServingUnit().trim();
        BigDecimal consumedQuantity = request.getConsumedQuantity();

        NutritionBasis basis;
        BigDecimal servingSize;
        BigDecimal baseCal;
        BigDecimal baseCarb;
        BigDecimal baseProt;
        BigDecimal baseFat;
        BigDecimal baseFib;
        BigDecimal baseSug;

        if (request.getFoodId() != null) {
            food = foodCatalogRepository.findById(request.getFoodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Food catalog item not found with ID: " + request.getFoodId()));

            // Rule A: Check 3-logs limit for catalog food on this local calendar day
            long existingCount = foodLogRepository.countByUserIdAndFoodIdAndLoggedAtBetween(
                    user.getId(), food.getId(), startOfDayUtc, endOfDayUtc
            );
            if (existingCount >= 3) {
                throw new DailyLimitExceededException(
                        "You cannot log the same food item ('" + food.getName() + "') more than 3 times on the same calendar day (" + localDay + "). Limit reached."
                );
            }

            foodName = food.getName();
            servingUnit = food.getServingUnit();
            basis = food.getNutritionBasis();
            servingSize = food.getServingSize();
            baseCal = food.getCalories();
            baseCarb = food.getCarbohydrates();
            baseProt = food.getProtein();
            baseFat = food.getFat();
            baseFib = food.getFiber();
            baseSug = food.getSugar();
        } else {
            // Manual entry
            long existingCount = foodLogRepository.countByUserIdAndFoodNameIgnoreCaseAndLoggedAtBetween(
                    user.getId(), foodName, startOfDayUtc, endOfDayUtc
            );
            if (existingCount >= 3) {
                throw new DailyLimitExceededException(
                        "You cannot log the same food item ('" + foodName + "') more than 3 times on the same calendar day (" + localDay + "). Limit reached."
                );
            }

            if (request.getNutritionBasis() != null) {
                basis = request.getNutritionBasis();
            } else if ("g".equalsIgnoreCase(servingUnit) || "ml".equalsIgnoreCase(servingUnit)) {
                basis = NutritionBasis.PER_100G;
            } else {
                basis = NutritionBasis.PER_SERVING;
            }

            if (request.getServingSize() != null && request.getServingSize().compareTo(BigDecimal.ZERO) > 0) {
                servingSize = request.getServingSize();
            } else {
                servingSize = (basis == NutritionBasis.PER_100G) ? new BigDecimal("100.00") : BigDecimal.ONE;
            }

            baseCal = request.getCalories() != null ? request.getCalories() : BigDecimal.ZERO;
            baseCarb = request.getCarbohydrates() != null ? request.getCarbohydrates() : BigDecimal.ZERO;
            baseProt = request.getProtein() != null ? request.getProtein() : BigDecimal.ZERO;
            baseFat = request.getFat() != null ? request.getFat() : BigDecimal.ZERO;
            baseFib = request.getFiber() != null ? request.getFiber() : BigDecimal.ZERO;
            baseSug = request.getSugar() != null ? request.getSugar() : BigDecimal.ZERO;
        }

        // Calculate consumed nutrients
        NutritionCalculator.CalculatedNutrients calc = nutritionCalculator.calculate(
                basis, servingSize, consumedQuantity,
                baseCal, baseCarb, baseProt, baseFat, baseFib, baseSug
        );

        // Rule E: Persist immutable nutrition snapshot in food_logs
        FoodLog foodLog = new FoodLog(
                user,
                food,
                foodName,
                consumedQuantity,
                servingUnit,
                calc.calories(),
                calc.carbohydrates(),
                calc.protein(),
                calc.fat(),
                calc.fiber(),
                calc.sugar(),
                loggedAt
        );

        FoodLog saved = foodLogRepository.save(foodLog);
        return mapToResponse(saved);
    }

    @Transactional
    public FoodLogResponse updateFoodLog(Long id, FoodLogUpdateRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        FoodLog logEntry = foodLogRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food log not found with ID: " + id + " or does not belong to you."));

        if (request.getLoggedAt() != null && !request.getLoggedAt().equals(logEntry.getLoggedAt())) {
            if (foodLogRepository.existsByUserIdAndLoggedAt(userId, request.getLoggedAt())) {
                throw new DuplicateLogTimestampException("Another log entry exists at this timestamp.");
            }
            logEntry.setLoggedAt(request.getLoggedAt());
        }

        if (request.getServingUnit() != null && !request.getServingUnit().isBlank()) {
            logEntry.setServingUnit(request.getServingUnit().trim());
        }

        // Recalculate nutrition snapshot if quantity changed
        if (request.getConsumedQuantity() != null && request.getConsumedQuantity().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal oldQuantity = logEntry.getConsumedQuantity();
            BigDecimal newQuantity = request.getConsumedQuantity();

            if (logEntry.getFood() != null) {
                FoodCatalog food = logEntry.getFood();
                NutritionCalculator.CalculatedNutrients calc = nutritionCalculator.calculate(
                        food.getNutritionBasis(), food.getServingSize(), newQuantity,
                        food.getCalories(), food.getCarbohydrates(), food.getProtein(),
                        food.getFat(), food.getFiber(), food.getSugar()
                );
                logEntry.setCalories(calc.calories());
                logEntry.setCarbohydrates(calc.carbohydrates());
                logEntry.setProtein(calc.protein());
                logEntry.setFat(calc.fat());
                logEntry.setFiber(calc.fiber());
                logEntry.setSugar(calc.sugar());
            } else if (oldQuantity.compareTo(BigDecimal.ZERO) > 0) {
                // Proportionally scale snapshot
                BigDecimal ratio = newQuantity.divide(oldQuantity, 6, java.math.RoundingMode.HALF_UP);
                logEntry.setCalories(logEntry.getCalories().multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP));
                logEntry.setCarbohydrates(logEntry.getCarbohydrates().multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP));
                logEntry.setProtein(logEntry.getProtein().multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP));
                logEntry.setFat(logEntry.getFat().multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP));
                logEntry.setFiber(logEntry.getFiber().multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP));
                logEntry.setSugar(logEntry.getSugar().multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP));
            }
            logEntry.setConsumedQuantity(newQuantity);
        }

        FoodLog updated = foodLogRepository.save(logEntry);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteFoodLog(Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        FoodLog logEntry = foodLogRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food log not found with ID: " + id + " or does not belong to you."));
        foodLogRepository.delete(logEntry);
    }

    @Transactional(readOnly = true)
    public FoodLogResponse getFoodLogById(Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        FoodLog logEntry = foodLogRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food log not found with ID: " + id));
        return mapToResponse(logEntry);
    }

    @Transactional(readOnly = true)
    public List<FoodLogResponse> getRecentLogs() {
        Long userId = SecurityUtils.getCurrentUserId();
        return foodLogRepository.findTop10ByUserIdOrderByLoggedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FoodLogResponse> getLogsForDate(LocalDate date) {
        User user = SecurityUtils.getCurrentUser();
        ZoneId zone = getUserZoneId(user);
        Instant startUtc = date.atStartOfDay(zone).toInstant();
        Instant endUtc = date.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1_000_000);

        return foodLogRepository.findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(user.getId(), startUtc, endUtc)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<FoodLogResponse> getLogsPaged(LocalDate startDate, LocalDate endDate, int page, int size) {
        User user = SecurityUtils.getCurrentUser();
        ZoneId zone = getUserZoneId(user);
        Instant startUtc = startDate.atStartOfDay(zone).toInstant();
        Instant endUtc = endDate.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1_000_000);

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return foodLogRepository.findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(user.getId(), startUtc, endUtc, pageable)
                .map(this::mapToResponse);
    }

    public ZoneId getUserZoneId(User user) {
        if (user.getTimezone() != null && !user.getTimezone().isBlank()) {
            try {
                return ZoneId.of(user.getTimezone());
            } catch (Exception e) {
                return ZoneOffset.UTC;
            }
        }
        return ZoneOffset.UTC;
    }

    public FoodLogResponse mapToResponse(FoodLog log) {
        return new FoodLogResponse(
                log.getId(),
                log.getFood() != null ? log.getFood().getId() : null,
                log.getFoodName(),
                log.getConsumedQuantity(),
                log.getServingUnit(),
                log.getCalories(),
                log.getCarbohydrates(),
                log.getProtein(),
                log.getFat(),
                log.getFiber(),
                log.getSugar(),
                log.getLoggedAt(),
                log.getCreatedAt()
        );
    }
}
