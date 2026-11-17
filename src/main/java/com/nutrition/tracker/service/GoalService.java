package com.nutrition.tracker.service;

import com.nutrition.tracker.dto.GoalRequest;
import com.nutrition.tracker.dto.GoalResponse;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.entity.UserGoal;
import com.nutrition.tracker.repository.UserGoalRepository;
import com.nutrition.tracker.repository.UserRepository;
import com.nutrition.tracker.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class GoalService {

    private final UserGoalRepository userGoalRepository;
    private final UserRepository userRepository;

    public GoalService(UserGoalRepository userGoalRepository, UserRepository userRepository) {
        this.userGoalRepository = userGoalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public GoalResponse getCurrentUserGoal() {
        Long userId = SecurityUtils.getCurrentUserId();
        UserGoal goal = userGoalRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultGoalForUser(userId));
        return mapToResponse(goal);
    }

    @Transactional
    public GoalResponse updateGoal(GoalRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserGoal goal = userGoalRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.getReferenceById(userId);
                    return new UserGoal(user, request.getDailyCalories(), request.getDailyCarbs(),
                            request.getDailyProtein(), request.getDailyFat());
                });

        goal.setDailyCalories(request.getDailyCalories());
        goal.setDailyCarbs(request.getDailyCarbs());
        goal.setDailyProtein(request.getDailyProtein());
        goal.setDailyFat(request.getDailyFat());

        UserGoal saved = userGoalRepository.save(goal);
        return mapToResponse(saved);
    }

    private UserGoal createDefaultGoalForUser(Long userId) {
        User user = userRepository.getReferenceById(userId);
        UserGoal defaultGoal = new UserGoal(
                user,
                new BigDecimal("2000.00"),
                new BigDecimal("250.00"),
                new BigDecimal("150.00"),
                new BigDecimal("65.00")
        );
        return userGoalRepository.save(defaultGoal);
    }

    public GoalResponse mapToResponse(UserGoal goal) {
        return new GoalResponse(
                goal.getId(),
                goal.getDailyCalories(),
                goal.getDailyCarbs(),
                goal.getDailyProtein(),
                goal.getDailyFat(),
                goal.getUpdatedAt()
        );
    }
}
