package com.nutrition.tracker.controller;

import com.nutrition.tracker.dto.GoalRequest;
import com.nutrition.tracker.dto.GoalResponse;
import com.nutrition.tracker.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public ResponseEntity<GoalResponse> getCurrentGoal() {
        return ResponseEntity.ok(goalService.getCurrentUserGoal());
    }

    @PutMapping
    public ResponseEntity<GoalResponse> updateGoal(@Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(request));
    }
}
