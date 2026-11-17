package com.nutrition.tracker.dto;

import com.nutrition.tracker.entity.NutritionBasis;
import java.math.BigDecimal;
import java.time.Instant;

public class FoodCatalogResponse {

    private Long id;
    private String name;
    private String barcode;
    private String servingUnit;
    private NutritionBasis nutritionBasis;
    private BigDecimal servingSize;
    private BigDecimal calories;
    private BigDecimal carbohydrates;
    private BigDecimal protein;
    private BigDecimal fat;
    private BigDecimal fiber;
    private BigDecimal sugar;
    private boolean isCustom;
    private Instant createdAt;

    public FoodCatalogResponse() {
    }

    public FoodCatalogResponse(Long id, String name, String barcode, String servingUnit,
                               NutritionBasis nutritionBasis, BigDecimal servingSize,
                               BigDecimal calories, BigDecimal carbohydrates, BigDecimal protein,
                               BigDecimal fat, BigDecimal fiber, BigDecimal sugar,
                               boolean isCustom, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.barcode = barcode;
        this.servingUnit = servingUnit;
        this.nutritionBasis = nutritionBasis;
        this.servingSize = servingSize;
        this.calories = calories;
        this.carbohydrates = carbohydrates;
        this.protein = protein;
        this.fat = fat;
        this.fiber = fiber;
        this.sugar = sugar;
        this.isCustom = isCustom;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public boolean isCustom() {
        return isCustom;
    }

    public void setCustom(boolean custom) {
        isCustom = custom;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
