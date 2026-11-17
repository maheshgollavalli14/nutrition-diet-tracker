package com.nutrition.tracker.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class FoodLogResponse {

    private Long id;
    private Long foodId;
    private String foodName;
    private BigDecimal consumedQuantity;
    private String servingUnit;
    private BigDecimal calories;
    private BigDecimal carbohydrates;
    private BigDecimal protein;
    private BigDecimal fat;
    private BigDecimal fiber;
    private BigDecimal sugar;
    private Instant loggedAt;
    private Instant createdAt;

    public FoodLogResponse() {
    }

    public FoodLogResponse(Long id, Long foodId, String foodName, BigDecimal consumedQuantity,
                           String servingUnit, BigDecimal calories, BigDecimal carbohydrates,
                           BigDecimal protein, BigDecimal fat, BigDecimal fiber, BigDecimal sugar,
                           Instant loggedAt, Instant createdAt) {
        this.id = id;
        this.foodId = foodId;
        this.foodName = foodName;
        this.consumedQuantity = consumedQuantity;
        this.servingUnit = servingUnit;
        this.calories = calories;
        this.carbohydrates = carbohydrates;
        this.protein = protein;
        this.fat = fat;
        this.fiber = fiber;
        this.sugar = sugar;
        this.loggedAt = loggedAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFoodId() {
        return foodId;
    }

    public void setFoodId(Long foodId) {
        this.foodId = foodId;
    }

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public BigDecimal getConsumedQuantity() {
        return consumedQuantity;
    }

    public void setConsumedQuantity(BigDecimal consumedQuantity) {
        this.consumedQuantity = consumedQuantity;
    }

    public String getServingUnit() {
        return servingUnit;
    }

    public void setServingUnit(String servingUnit) {
        this.servingUnit = servingUnit;
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

    public BigDecimal getFiber() {
        return fiber;
    }

    public void setFiber(BigDecimal fiber) {
        this.fiber = fiber;
    }

    public BigDecimal getSugar() {
        return sugar;
    }

    public void setSugar(BigDecimal sugar) {
        this.sugar = sugar;
    }

    public Instant getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(Instant loggedAt) {
        this.loggedAt = loggedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
