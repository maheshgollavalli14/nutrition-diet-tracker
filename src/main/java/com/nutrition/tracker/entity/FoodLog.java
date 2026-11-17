package com.nutrition.tracker.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "food_logs",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_logged_at", columnNames = {"user_id", "logged_at"})
    },
    indexes = {
        @Index(name = "idx_user_logged_at", columnList = "user_id, logged_at"),
        @Index(name = "idx_food_logs_food_id", columnList = "food_id")
    }
)
public class FoodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id")
    private FoodCatalog food;

    @NotBlank
    @Column(name = "food_name", nullable = false, length = 200)
    private String foodName;

    @NotNull
    @Column(name = "consumed_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal consumedQuantity;

    @NotBlank
    @Column(name = "serving_unit", nullable = false, length = 50)
    private String servingUnit;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal calories;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal carbohydrates;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal protein;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fat;

    @Column(precision = 10, scale = 2)
    private BigDecimal fiber = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal sugar = BigDecimal.ZERO;

    @NotNull
    @Column(name = "logged_at", nullable = false)
    private Instant loggedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public FoodLog() {
    }

    public FoodLog(User user, FoodCatalog food, String foodName, BigDecimal consumedQuantity,
                   String servingUnit, BigDecimal calories, BigDecimal carbohydrates,
                   BigDecimal protein, BigDecimal fat, BigDecimal fiber, BigDecimal sugar,
                   Instant loggedAt) {
        this.user = user;
        this.food = food;
        this.foodName = foodName;
        this.consumedQuantity = consumedQuantity;
        this.servingUnit = servingUnit;
        this.calories = calories;
        this.carbohydrates = carbohydrates;
        this.protein = protein;
        this.fat = fat;
        this.fiber = fiber != null ? fiber : BigDecimal.ZERO;
        this.sugar = sugar != null ? sugar : BigDecimal.ZERO;
        this.loggedAt = loggedAt != null ? loggedAt : Instant.now();
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.loggedAt == null) {
            this.loggedAt = Instant.now();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public FoodCatalog getFood() {
        return food;
    }

    public void setFood(FoodCatalog food) {
        this.food = food;
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
