package com.nutrition.tracker.service;

import com.nutrition.tracker.dto.LoginRequest;
import com.nutrition.tracker.dto.RegisterRequest;
import com.nutrition.tracker.dto.UpdateProfileRequest;
import com.nutrition.tracker.dto.UserResponse;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.entity.UserGoal;
import com.nutrition.tracker.exception.ResourceNotFoundException;
import com.nutrition.tracker.exception.ValidationException;
import com.nutrition.tracker.repository.UserGoalRepository;
import com.nutrition.tracker.repository.UserRepository;
import com.nutrition.tracker.security.CustomUserDetails;
import com.nutrition.tracker.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneId;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserGoalRepository userGoalRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       UserGoalRepository userGoalRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.userGoalRepository = userGoalRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (request.getConfirmPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Passwords do not match. Please verify your password confirmation.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ValidationException("An account with email '" + normalizedEmail + "' already exists.");
        }

        String timezone = request.getTimezone();
        if (timezone == null || timezone.isBlank()) {
            timezone = "UTC";
        } else {
            try {
                ZoneId.of(timezone);
            } catch (Exception e) {
                timezone = "UTC";
            }
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = new User(normalizedEmail, passwordHash, request.getFullName().trim(), timezone);
        User savedUser = userRepository.save(user);

        // Seed default user goals (2000 kcal, 250g carbs, 150g protein, 65g fat)
        UserGoal defaultGoal = new UserGoal(savedUser, new BigDecimal("2000.00"), new BigDecimal("250.00"),
                new BigDecimal("150.00"), new BigDecimal("65.00"));
        userGoalRepository.save(defaultGoal);

        return mapToResponse(savedUser);
    }

    public UserResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return mapToResponse(userDetails.getUser());
    }

    public UserResponse getCurrentUserProfile() {
        User currentUser = SecurityUtils.getCurrentUser();
        // Refresh from DB
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            try {
                ZoneId.of(request.getTimezone().trim());
                user.setTimezone(request.getTimezone().trim());
            } catch (Exception e) {
                throw new ValidationException("Invalid timezone identifier: " + request.getTimezone());
            }
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    public UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getTimezone(),
                user.getCreatedAt()
        );
    }
}
