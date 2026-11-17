package com.nutrition.tracker.dto;

import com.nutrition.tracker.entity.NutritionBasis;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public class FoodLogRequest {

    private Long foodId;

    @NotBlank(message = "Food name is required")
    private String foodName;

    @NotNull(message = "Consumed quantity is required")
    @DecimalMin(value = "0.01", message = "Consumed quantity must be greater than zero")
    private BigDecimal consumedQuantity;

    @NotBlank(message = "Serving unit is required")
    private String servingUnit;

    private Instant loggedAt;

    private NutritionBasis nutritionBasis;
    private BigDecimal servingSize;

    // For manual entry nutrition values (optional if foodId is supplied)
    private BigDecimal calories;
    private BigDecimal carbohydrates;
    private BigDecimal protein;
    private BigDecimal fat;
    private BigDecimal fiber;
    private BigDecimal sugar;

    public FoodLogRequest() {
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

    public Instant getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(Instant loggedAt) {
        this.loggedAt = loggedAt;
    }

    public NutritionBasis getNutritionBasis() {
        return nutritionBasis;
    }

    public void setNutritionBasis(NutritionBasis nutritionBasis) {
        this.nutritionBasis = nutritionBasis;
    }

    public BigDecimal getServingSize() {
        return servingSize;
    }

    public void setServingSize(BigDecimal servingSize) {
        this.servingSize = servingSize;
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
}
