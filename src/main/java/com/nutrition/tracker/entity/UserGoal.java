package com.nutrition.tracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_goals")
public class UserGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "daily_calories", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyCalories = new BigDecimal("2000.00");

    @Column(name = "daily_carbs", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyCarbs = new BigDecimal("250.00");

    @Column(name = "daily_protein", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyProtein = new BigDecimal("150.00");

    @Column(name = "daily_fat", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyFat = new BigDecimal("65.00");

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserGoal() {
    }

    public UserGoal(User user, BigDecimal dailyCalories, BigDecimal dailyCarbs, BigDecimal dailyProtein, BigDecimal dailyFat) {
        this.user = user;
        this.dailyCalories = dailyCalories != null ? dailyCalories : new BigDecimal("2000.00");
        this.dailyCarbs = dailyCarbs != null ? dailyCarbs : new BigDecimal("250.00");
        this.dailyProtein = dailyProtein != null ? dailyProtein : new BigDecimal("150.00");
        this.dailyFat = dailyFat != null ? dailyFat : new BigDecimal("65.00");
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
