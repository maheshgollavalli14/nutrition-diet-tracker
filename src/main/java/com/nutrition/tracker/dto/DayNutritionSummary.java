package com.nutrition.tracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DayNutritionSummary {

    private LocalDate date;
    private String dayOfWeek;
    private BigDecimal calories;
    private BigDecimal carbohydrates;
    private BigDecimal protein;
    private BigDecimal fat;
    private BigDecimal goalCalories;

    public DayNutritionSummary() {
    }

    public DayNutritionSummary(LocalDate date, String dayOfWeek, BigDecimal calories,
                               BigDecimal carbohydrates, BigDecimal protein, BigDecimal fat,
                               BigDecimal goalCalories) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.calories = calories;
        this.carbohydrates = carbohydrates;
        this.protein = protein;
        this.fat = fat;
        this.goalCalories = goalCalories;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public BigDecimal getCalories() {
        return calories;
    }

    public void setCalories(BigDecimal calories) {
        this.calories = calories;
    }

    public BigDecimal getCarbohydrates() {
        return carbohydrates;
    }

    public void setCarbohydrates(BigDecimal carbohydrates) {
        this.carbohydrates = carbohydrates;
    }

    public BigDecimal getProtein() {
        return protein;
    }

    public void setProtein(BigDecimal protein) {
        this.protein = protein;
    }

    public BigDecimal getFat() {
        return fat;
    }

    public void setFat(BigDecimal fat) {
        this.fat = fat;
    }

    public BigDecimal getGoalCalories() {
        return goalCalories;
    }

    public void setGoalCalories(BigDecimal goalCalories) {
        this.goalCalories = goalCalories;
    }
}
