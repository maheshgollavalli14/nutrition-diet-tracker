package com.nutrition.tracker.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class GoalResponse {

    private Long id;
    private BigDecimal dailyCalories;
    private BigDecimal dailyCarbs;
    private BigDecimal dailyProtein;
    private BigDecimal dailyFat;
    private Instant updatedAt;
    private String disclaimer = "Calorie and macronutrient goals are user-configured tracking targets, not medical or nutritional advice.";

    public GoalResponse() {
    }

    public GoalResponse(Long id, BigDecimal dailyCalories, BigDecimal dailyCarbs, BigDecimal dailyProtein, BigDecimal dailyFat, Instant updatedAt) {
        this.id = id;
        this.dailyCalories = dailyCalories;
        this.dailyCarbs = dailyCarbs;
        this.dailyProtein = dailyProtein;
        this.dailyFat = dailyFat;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}
