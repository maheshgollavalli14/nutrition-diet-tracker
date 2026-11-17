package com.nutrition.tracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class WeeklySummaryResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalCalories;
    private BigDecimal averageDailyCalories;
    private BigDecimal totalCarbs;
    private BigDecimal averageDailyCarbs;
    private BigDecimal totalProtein;
    private BigDecimal averageDailyProtein;
    private BigDecimal totalFat;
    private BigDecimal averageDailyFat;
    private BigDecimal goalCalories;
    private List<DayNutritionSummary> days;

    public WeeklySummaryResponse() {
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(BigDecimal totalCalories) {
        this.totalCalories = totalCalories;
    }

    public BigDecimal getAverageDailyCalories() {
        return averageDailyCalories;
    }

    public void setAverageDailyCalories(BigDecimal averageDailyCalories) {
        this.averageDailyCalories = averageDailyCalories;
    }

    public BigDecimal getTotalCarbs() {
        return totalCarbs;
    }

    public void setTotalCarbs(BigDecimal totalCarbs) {
        this.totalCarbs = totalCarbs;
    }

    public BigDecimal getAverageDailyCarbs() {
        return averageDailyCarbs;
    }

    public void setAverageDailyCarbs(BigDecimal averageDailyCarbs) {
        this.averageDailyCarbs = averageDailyCarbs;
    }

    public BigDecimal getTotalProtein() {
        return totalProtein;
    }

    public void setTotalProtein(BigDecimal totalProtein) {
        this.totalProtein = totalProtein;
    }

    public BigDecimal getAverageDailyProtein() {
        return averageDailyProtein;
    }

    public void setAverageDailyProtein(BigDecimal averageDailyProtein) {
        this.averageDailyProtein = averageDailyProtein;
    }

    public BigDecimal getTotalFat() {
        return totalFat;
    }

    public void setTotalFat(BigDecimal totalFat) {
        this.totalFat = totalFat;
    }

    public BigDecimal getAverageDailyFat() {
        return averageDailyFat;
    }

    public void setAverageDailyFat(BigDecimal averageDailyFat) {
        this.averageDailyFat = averageDailyFat;
    }

    public BigDecimal getGoalCalories() {
        return goalCalories;
    }

    public void setGoalCalories(BigDecimal goalCalories) {
        this.goalCalories = goalCalories;
    }

    public List<DayNutritionSummary> getDays() {
        return days;
    }

    public void setDays(List<DayNutritionSummary> days) {
        this.days = days;
    }
}
