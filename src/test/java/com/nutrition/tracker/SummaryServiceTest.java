package com.nutrition.tracker;

import com.nutrition.tracker.dto.DailySummaryResponse;
import com.nutrition.tracker.dto.DateRangeHistoryResponse;
import com.nutrition.tracker.dto.FoodLogRequest;
import com.nutrition.tracker.dto.WeeklySummaryResponse;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.entity.UserGoal;
import com.nutrition.tracker.exception.ValidationException;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import com.nutrition.tracker.repository.FoodLogRepository;
import com.nutrition.tracker.repository.UserGoalRepository;
import com.nutrition.tracker.repository.UserRepository;
import com.nutrition.tracker.security.CustomUserDetails;
import com.nutrition.tracker.service.FoodLogService;
import com.nutrition.tracker.service.SummaryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class SummaryServiceTest {

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private FoodLogService foodLogService;

    @Autowired
    private FoodLogRepository foodLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserGoalRepository userGoalRepository;

    @Autowired
    private FoodCatalogRepository foodCatalogRepository;

    private User summaryUser;
    private FoodCatalog foodItem;

    @BeforeEach
    void setUp() {
        foodLogRepository.deleteAll();

        summaryUser = userRepository.findByEmail("summary_test_user@example.com").orElseGet(() -> {
            User u = new User("summary_test_user@example.com", "hash123", "Summary User", "UTC");
            return userRepository.save(u);
        });

        // Set 2000 calorie goal
        userGoalRepository.findByUserId(summaryUser.getId()).ifPresent(userGoalRepository::delete);
        UserGoal goal = new UserGoal(summaryUser, new BigDecimal("2000.00"), new BigDecimal("250.00"),
                new BigDecimal("150.00"), new BigDecimal("65.00"));
        userGoalRepository.save(goal);

        foodItem = foodCatalogRepository.searchByNameAndUser("Chicken", summaryUser.getId())
                .stream().findFirst().orElseGet(() -> {
                    FoodCatalog fc = new FoodCatalog("Summary Chicken", null, "g", NutritionBasis.PER_100G,
                            new BigDecimal("100.00"), new BigDecimal("165.00"), BigDecimal.ZERO,
                            new BigDecimal("31.00"), new BigDecimal("3.60"), BigDecimal.ZERO,
                            BigDecimal.ZERO, false, null);
                    return foodCatalogRepository.save(fc);
                });

        CustomUserDetails userDetails = new CustomUserDetails(summaryUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should correctly calculate daily calories, remaining calories, and percentage of goal")
    void testDailySummary() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant t1 = today.atTime(8, 0).toInstant(ZoneOffset.UTC);
        Instant t2 = today.atTime(12, 30).toInstant(ZoneOffset.UTC);

        // 200g chicken -> 330 kcal
        FoodLogRequest req1 = new FoodLogRequest();
        req1.setFoodId(foodItem.getId());
        req1.setFoodName(foodItem.getName());
        req1.setConsumedQuantity(new BigDecimal("200.00"));
        req1.setServingUnit("g");
        req1.setLoggedAt(t1);
        foodLogService.createFoodLog(req1);

        // 100g chicken -> 165 kcal
        FoodLogRequest req2 = new FoodLogRequest();
        req2.setFoodId(foodItem.getId());
        req2.setFoodName(foodItem.getName());
        req2.setConsumedQuantity(new BigDecimal("100.00"));
        req2.setServingUnit("g");
        req2.setLoggedAt(t2);
        foodLogService.createFoodLog(req2);

        DailySummaryResponse summary = summaryService.getDailySummary(today);

        // Total calories = 330.00 + 165.00 = 495.00
        assertEquals(new BigDecimal("495.00"), summary.getTotalCalories());
        // Remaining = 2000.00 - 495.00 = 1505.00
        assertEquals(new BigDecimal("1505.00"), summary.getRemainingCalories());
        // Percent = 495 * 100 / 2000 = 24.8%
        assertEquals(new BigDecimal("24.8"), summary.getPercentOfGoal());
        assertFalse(summary.isExceeded());
        assertEquals(2, summary.getItemsCount());
    }

    @Test
    @DisplayName("Should return 7 days of weekly summary with daily comparisons and averages")
    void testWeeklySummary() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        WeeklySummaryResponse weekly = summaryService.getWeeklySummary(today);

        assertNotNull(weekly);
        assertEquals(7, weekly.getDays().size());
        assertEquals(today.minusDays(6), weekly.getStartDate());
        assertEquals(today, weekly.getEndDate());
        assertNotNull(weekly.getAverageDailyCalories());
    }

    @Test
    @DisplayName("Should support up to 365 days history and reject requests exceeding 365 days")
    void testHistoryQueriesAndLimit() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate validStart = today.minusDays(360);

        DateRangeHistoryResponse history = summaryService.getHistory(validStart, today, 0, 10);
        assertNotNull(history);

        // Range exceeding 365 days must throw ValidationException
        LocalDate invalidStart = today.minusDays(370);
        assertThrows(ValidationException.class, () -> {
            summaryService.getHistory(invalidStart, today, 0, 10);
        });
    }
}
