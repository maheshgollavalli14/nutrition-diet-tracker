package com.nutrition.tracker.dto;

import com.nutrition.tracker.entity.NutritionBasis;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class FoodCatalogRequest {

    @NotBlank(message = "Food name is required")
    private String name;

    private String barcode;

    @NotBlank(message = "Serving unit is required (e.g. g, ml, serving, slice)")
    private String servingUnit = "g";

    @NotNull(message = "Nutrition basis is required")
    private NutritionBasis nutritionBasis = NutritionBasis.PER_100G;

    @NotNull(message = "Serving size is required")
    @DecimalMin(value = "0.01", message = "Serving size must be greater than zero")
    private BigDecimal servingSize = new BigDecimal("100.00");

    @NotNull(message = "Calories value is required")
    @DecimalMin(value = "0.00", message = "Calories must be non-negative")
    private BigDecimal calories;

    @NotNull(message = "Carbohydrates value is required")
    @DecimalMin(value = "0.00", message = "Carbs must be non-negative")
    private BigDecimal carbohydrates;

    @NotNull(message = "Protein value is required")
    @DecimalMin(value = "0.00", message = "Protein must be non-negative")
    private BigDecimal protein;

    @NotNull(message = "Fat value is required")
    @DecimalMin(value = "0.00", message = "Fat must be non-negative")
    private BigDecimal fat;

    private BigDecimal fiber = BigDecimal.ZERO;
    private BigDecimal sugar = BigDecimal.ZERO;

    public FoodCatalogRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getServingUnit() {
        return servingUnit;
    }

    public void setServingUnit(String servingUnit) {
        this.servingUnit = servingUnit;
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
