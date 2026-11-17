package com.nutrition.tracker;

import com.nutrition.tracker.dto.FoodLogRequest;
import com.nutrition.tracker.dto.FoodLogResponse;
import com.nutrition.tracker.dto.RegisterRequest;
import com.nutrition.tracker.dto.UserResponse;
import com.nutrition.tracker.entity.FoodCatalog;
import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.exception.ResourceNotFoundException;
import com.nutrition.tracker.exception.ValidationException;
import com.nutrition.tracker.repository.FoodCatalogRepository;
import com.nutrition.tracker.repository.FoodLogRepository;
import com.nutrition.tracker.repository.UserRepository;
import com.nutrition.tracker.security.CustomUserDetails;
import com.nutrition.tracker.service.AuthService;
import com.nutrition.tracker.service.FoodLogService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class AuthenticationAndDataIsolationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private FoodLogService foodLogService;

    @Autowired
    private FoodLogRepository foodLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodCatalogRepository foodCatalogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should register new user and hash password with BCrypt")
    void testRegistrationAndPasswordHashing() {
        String email = "alice_" + System.currentTimeMillis() + "@example.com";
        RegisterRequest request = new RegisterRequest(email, "SecurePassword123!", "SecurePassword123!", "Alice Walker", "America/New_York");

        UserResponse userResponse = authService.register(request);
        assertNotNull(userResponse.getId());
        assertEquals(email, userResponse.getEmail());
        assertEquals("America/New_York", userResponse.getTimezone());

        User entity = userRepository.findById(userResponse.getId()).orElseThrow();
        assertNotEquals("SecurePassword123!", entity.getPasswordHash());
        assertTrue(passwordEncoder.matches("SecurePassword123!", entity.getPasswordHash()));
    }

    @Test
    @DisplayName("Should reject registration when password and confirmPassword do not match")
    void testRegistrationPasswordMismatch() {
        String email = "mismatch_" + System.currentTimeMillis() + "@example.com";
        RegisterRequest request = new RegisterRequest(email, "Password123!", "DifferentPassword!", "Bob Mismatch", "UTC");

        ValidationException ex = assertThrows(ValidationException.class, () -> {
            authService.register(request);
        });

        assertTrue(ex.getMessage().contains("Passwords do not match"),
                "Validation message should state passwords do not match: " + ex.getMessage());
    }

    @Test
    @DisplayName("Should reject registration when email address already exists")
    void testDuplicateEmailRegistration() {
        String email = "duplicate_" + System.currentTimeMillis() + "@example.com";
        RegisterRequest req1 = new RegisterRequest(email, "Password123!", "Password123!", "User One", "UTC");
        authService.register(req1);

        RegisterRequest req2 = new RegisterRequest(email, "Password999!", "Password999!", "User Two", "UTC");
        ValidationException ex = assertThrows(ValidationException.class, () -> {
            authService.register(req2);
        });

        assertTrue(ex.getMessage().contains("already exists"),
                "Validation message should indicate email is already registered: " + ex.getMessage());
    }

    @Test
    @DisplayName("User Data Isolation: User B cannot access or modify User A's food logs")
    void testUserDataIsolation() {
        // Create User A
        User userA = userRepository.save(new User("user_a_" + System.currentTimeMillis() + "@example.com", "hash", "User A", "UTC"));
        // Create User B
        User userB = userRepository.save(new User("user_b_" + System.currentTimeMillis() + "@example.com", "hash", "User B", "UTC"));

        FoodCatalog food = foodCatalogRepository.save(new FoodCatalog("Isolation Food", null, "g", NutritionBasis.PER_100G,
                new BigDecimal("100.00"), new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false, null));

        // Authenticate as User A and create a log
        CustomUserDetails userDetailsA = new CustomUserDetails(userA);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetailsA, null, userDetailsA.getAuthorities())
        );

        FoodLogRequest logReq = new FoodLogRequest();
        logReq.setFoodId(food.getId());
        logReq.setFoodName(food.getName());
        logReq.setConsumedQuantity(new BigDecimal("100.00"));
        logReq.setServingUnit("g");
        logReq.setLoggedAt(Instant.now());
        FoodLogResponse userALog = foodLogService.createFoodLog(logReq);

        // Switch security context to User B
        CustomUserDetails userDetailsB = new CustomUserDetails(userB);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetailsB, null, userDetailsB.getAuthorities())
        );

        // User B's recent logs should NOT contain User A's log
        List<FoodLogResponse> userBRecent = foodLogService.getRecentLogs();
        assertTrue(userBRecent.stream().noneMatch(l -> l.getId().equals(userALog.getId())));

        // User B attempting to fetch User A's log by ID must throw ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            foodLogService.getFoodLogById(userALog.getId());
        });

        // User B attempting to delete User A's log must throw ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            foodLogService.deleteFoodLog(userALog.getId());
        });
    }

    @Test
    @DisplayName("Direct Manual Food Entry: Should log food with custom nutrition facts without catalog item")
    void testDirectManualFoodLogging() {
        User user = userRepository.save(new User("manual_" + System.currentTimeMillis() + "@example.com", "hash", "Manual User", "UTC"));
        CustomUserDetails userDetails = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );

        FoodLogRequest request = new FoodLogRequest();
        request.setFoodName("Homemade Lentil Soup");
        request.setConsumedQuantity(new BigDecimal("200.00"));
        request.setServingUnit("g");
        request.setNutritionBasis(NutritionBasis.PER_100G);
        request.setServingSize(new BigDecimal("100.00"));
        request.setCalories(new BigDecimal("120.00"));
        request.setCarbohydrates(new BigDecimal("18.00"));
        request.setProtein(new BigDecimal("8.00"));
        request.setFat(new BigDecimal("2.50"));
        request.setLoggedAt(Instant.now());

        FoodLogResponse response = foodLogService.createFoodLog(request);

        assertNotNull(response.getId());
        assertEquals("Homemade Lentil Soup", response.getFoodName());
        // 200g with 120 kcal per 100g = 240 kcal
        assertEquals(new BigDecimal("240.00"), response.getCalories());
        assertEquals(new BigDecimal("36.00"), response.getCarbohydrates());
        assertEquals(new BigDecimal("16.00"), response.getProtein());
        assertEquals(new BigDecimal("5.00"), response.getFat());
    }
}
