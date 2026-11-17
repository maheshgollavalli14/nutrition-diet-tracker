package com.nutrition.tracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class GoalRequest {

    @NotNull(message = "Daily calories target is required")
    @DecimalMin(value = "500.00", message = "Daily calories target must be at least 500 kcal")
    private BigDecimal dailyCalories;

    @NotNull(message = "Daily carbohydrates target is required")
    @DecimalMin(value = "0.00", message = "Daily carbs must be non-negative")
    private BigDecimal dailyCarbs;

    @NotNull(message = "Daily protein target is required")
    @DecimalMin(value = "0.00", message = "Daily protein must be non-negative")
    private BigDecimal dailyProtein;

    @NotNull(message = "Daily fat target is required")
    @DecimalMin(value = "0.00", message = "Daily fat must be non-negative")
    private BigDecimal dailyFat;

    public GoalRequest() {
    }

    public GoalRequest(BigDecimal dailyCalories, BigDecimal dailyCarbs, BigDecimal dailyProtein, BigDecimal dailyFat) {
        this.dailyCalories = dailyCalories;
        this.dailyCarbs = dailyCarbs;
        this.dailyProtein = dailyProtein;
        this.dailyFat = dailyFat;
    }

    public BigDecimal getDailyCalories() {
        return dailyCalories;
    }

    public void setDailyCalories(BigDecimal dailyCalories) {
        this.dailyCalories = dailyCalories;
    }

    public BigDecimal getDailyCarbs() {
        return dailyCarbs;
    }

    public void setDailyCarbs(BigDecimal dailyCarbs) {
        this.dailyCarbs = dailyCarbs;
    }

    public BigDecimal getDailyProtein() {
        return dailyProtein;
    }

    public void setDailyProtein(BigDecimal dailyProtein) {
        this.dailyProtein = dailyProtein;
    }

    public BigDecimal getDailyFat() {
        return dailyFat;
    }

    public void setDailyFat(BigDecimal dailyFat) {
        this.dailyFat = dailyFat;
    }
}
