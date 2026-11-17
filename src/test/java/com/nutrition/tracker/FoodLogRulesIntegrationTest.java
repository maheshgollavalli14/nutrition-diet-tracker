package com.nutrition.tracker;

import com.nutrition.tracker.dto.FoodLogRequest;
import com.nutrition.tracker.dto.FoodLogResponse;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.exception.DailyLimitExceededException;
import com.nutrition.tracker.exception.DuplicateLogTimestampException;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import com.nutrition.tracker.repository.FoodLogRepository;
import com.nutrition.tracker.repository.UserRepository;
import com.nutrition.tracker.security.CustomUserDetails;
import com.nutrition.tracker.service.FoodLogService;
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
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class FoodLogRulesIntegrationTest {

    @Autowired
    private FoodLogService foodLogService;

    @Autowired
    private FoodLogRepository foodLogRepository;

    @Autowired
    private FoodCatalogRepository foodCatalogRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private FoodCatalog testFood;

    @BeforeEach
    void setUp() {
        foodLogRepository.deleteAll();

        testUser = userRepository.findByEmail("rules_test_user@example.com").orElseGet(() -> {
            User u = new User("rules_test_user@example.com", "hash123", "Rule Tester", "UTC");
            return userRepository.save(u);
        });

        testFood = foodCatalogRepository.searchByNameAndUser("Oats", testUser.getId())
                .stream().findFirst().orElseGet(() -> {
                    FoodCatalog fc = new FoodCatalog("Test Rolled Oats", null, "g", NutritionBasis.PER_100G,
                            new BigDecimal("100.00"), new BigDecimal("389.00"), new BigDecimal("66.00"),
                            new BigDecimal("17.00"), new BigDecimal("7.00"), new BigDecimal("10.00"),
                            BigDecimal.ONE, false, null);
                    return foodCatalogRepository.save(fc);
                });

        // Set security context for test user
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should successfully log food and store immutable nutrition snapshot")
    void testSuccessfulFoodLoggingAndSnapshot() {
        FoodLogRequest request = new FoodLogRequest();
        request.setFoodId(testFood.getId());
        request.setFoodName(testFood.getName());
        request.setConsumedQuantity(new BigDecimal("100.00"));
        request.setServingUnit("g");
        request.setLoggedAt(Instant.now());

        FoodLogResponse response = foodLogService.createFoodLog(request);

        assertNotNull(response.getId());
        assertEquals(testFood.getName(), response.getFoodName());
        assertEquals(new BigDecimal("389.00"), response.getCalories());
        assertEquals(new BigDecimal("66.00"), response.getCarbohydrates());
        assertEquals(new BigDecimal("17.00"), response.getProtein());
        assertEquals(new BigDecimal("7.00"), response.getFat());
    }

    @Test
    @DisplayName("Rule A: Should reject a fourth log of the same food item on the same calendar day")
    void testRuleARejectionOnFourthAttempt() {
        Instant baseTime = Instant.now().truncatedTo(ChronoUnit.DAYS).plus(8, ChronoUnit.HOURS);

        // 1st log -> Success
        FoodLogRequest req1 = new FoodLogRequest();
        req1.setFoodId(testFood.getId());
        req1.setFoodName(testFood.getName());
        req1.setConsumedQuantity(new BigDecimal("50.00"));
        req1.setServingUnit("g");
        req1.setLoggedAt(baseTime.plus(1, ChronoUnit.HOURS));
        foodLogService.createFoodLog(req1);

        // 2nd log -> Success
        FoodLogRequest req2 = new FoodLogRequest();
        req2.setFoodId(testFood.getId());
        req2.setFoodName(testFood.getName());
        req2.setConsumedQuantity(new BigDecimal("50.00"));
        req2.setServingUnit("g");
        req2.setLoggedAt(baseTime.plus(2, ChronoUnit.HOURS));
        foodLogService.createFoodLog(req2);

        // 3rd log -> Success
        FoodLogRequest req3 = new FoodLogRequest();
        req3.setFoodId(testFood.getId());
        req3.setFoodName(testFood.getName());
        req3.setConsumedQuantity(new BigDecimal("50.00"));
        req3.setServingUnit("g");
        req3.setLoggedAt(baseTime.plus(3, ChronoUnit.HOURS));
        foodLogService.createFoodLog(req3);

        // 4th log on same day -> Must be rejected with DailyLimitExceededException
        FoodLogRequest req4 = new FoodLogRequest();
        req4.setFoodId(testFood.getId());
        req4.setFoodName(testFood.getName());
        req4.setConsumedQuantity(new BigDecimal("50.00"));
        req4.setServingUnit("g");
        req4.setLoggedAt(baseTime.plus(4, ChronoUnit.HOURS));

        DailyLimitExceededException ex = assertThrows(DailyLimitExceededException.class, () -> {
            foodLogService.createFoodLog(req4);
        });

        assertTrue(ex.getMessage().contains("more than 3 times on the same calendar day"),
                "Exception message should clearly state the 3 times daily limit rule: " + ex.getMessage());
    }

    @Test
    @DisplayName("Rule B: Should reject duplicate timestamps for the same user")
    void testRuleBDuplicateTimestampRejection() {
        Instant exactTimestamp = Instant.now().truncatedTo(ChronoUnit.MINUTES);

        FoodLogRequest req1 = new FoodLogRequest();
        req1.setFoodId(testFood.getId());
        req1.setFoodName(testFood.getName());
        req1.setConsumedQuantity(new BigDecimal("50.00"));
        req1.setServingUnit("g");
        req1.setLoggedAt(exactTimestamp);
        foodLogService.createFoodLog(req1);

        // Try logging another entry at the EXACT same timestamp
        FoodLogRequest req2 = new FoodLogRequest();
        req2.setFoodId(testFood.getId());
        req2.setFoodName(testFood.getName());
        req2.setConsumedQuantity(new BigDecimal("60.00"));
        req2.setServingUnit("g");
        req2.setLoggedAt(exactTimestamp);

        assertThrows(DuplicateLogTimestampException.class, () -> {
            foodLogService.createFoodLog(req2);
        });
    }
}
