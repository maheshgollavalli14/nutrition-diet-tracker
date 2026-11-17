package com.nutrition.tracker.controller;

import com.nutrition.tracker.dto.*;
import com.nutrition.tracker.service.FoodLogService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class FoodLogController {

    private final FoodLogService foodLogService;

    public FoodLogController(FoodLogService foodLogService) {
        this.foodLogService = foodLogService;
    }

    @PostMapping
    public ResponseEntity<FoodLogResponse> createFoodLog(@Valid @RequestBody FoodLogRequest request) {
        FoodLogResponse response = foodLogService.createFoodLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/preview")
    public ResponseEntity<NutritionPreviewResponse> previewNutrition(@Valid @RequestBody NutritionPreviewRequest request) {
        return ResponseEntity.ok(foodLogService.previewNutrition(request));
    }

    @GetMapping("/diary")
    public ResponseEntity<List<FoodLogResponse>> getDiary(
            @RequestParam(name = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ResponseEntity.ok(foodLogService.getLogsForDate(date));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<FoodLogResponse>> getRecentLogs() {
        return ResponseEntity.ok(foodLogService.getRecentLogs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoodLogResponse> getFoodLogById(@PathVariable Long id) {
        return ResponseEntity.ok(foodLogService.getFoodLogById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FoodLogResponse> updateFoodLog(@PathVariable Long id, @Valid @RequestBody FoodLogUpdateRequest request) {
        return ResponseEntity.ok(foodLogService.updateFoodLog(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFoodLog(@PathVariable Long id) {
        foodLogService.deleteFoodLog(id);
        return ResponseEntity.noContent().build();
    }
}
