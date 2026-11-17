package com.nutrition.tracker.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "food_catalog", indexes = {
    @Index(name = "idx_food_catalog_name", columnList = "name"),
    @Index(name = "idx_food_catalog_barcode", columnList = "barcode")
})
public class FoodCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String barcode;

    @NotBlank
    @Column(name = "serving_unit", nullable = false, length = 50)
    private String servingUnit = "g";

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "nutrition_basis", nullable = false, length = 20)
    private NutritionBasis nutritionBasis = NutritionBasis.PER_100G;

    @NotNull
    @Column(name = "serving_size", nullable = false, precision = 10, scale = 2)
    private BigDecimal servingSize = new BigDecimal("100.00");

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal calories = BigDecimal.ZERO;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal carbohydrates = BigDecimal.ZERO;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal protein = BigDecimal.ZERO;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fat = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal fiber = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal sugar = BigDecimal.ZERO;

    @Column(name = "is_custom", nullable = false)
    private boolean isCustom = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public FoodCatalog() {
    }

    public FoodCatalog(String name, String barcode, String servingUnit, NutritionBasis nutritionBasis,
                       BigDecimal servingSize, BigDecimal calories, BigDecimal carbohydrates,
                       BigDecimal protein, BigDecimal fat, BigDecimal fiber, BigDecimal sugar,
                       boolean isCustom, User createdBy) {
        this.name = name;
        this.barcode = barcode;
        this.servingUnit = servingUnit != null ? servingUnit : "g";
        this.nutritionBasis = nutritionBasis != null ? nutritionBasis : NutritionBasis.PER_100G;
        this.servingSize = servingSize != null ? servingSize : new BigDecimal("100.00");
        this.calories = calories != null ? calories : BigDecimal.ZERO;
        this.carbohydrates = carbohydrates != null ? carbohydrates : BigDecimal.ZERO;
        this.protein = protein != null ? protein : BigDecimal.ZERO;
        this.fat = fat != null ? fat : BigDecimal.ZERO;
        this.fiber = fiber != null ? fiber : BigDecimal.ZERO;
        this.sugar = sugar != null ? sugar : BigDecimal.ZERO;
        this.isCustom = isCustom;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
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

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
