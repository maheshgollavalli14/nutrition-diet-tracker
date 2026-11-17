package com.nutrition.tracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DailySummaryResponse {

    private LocalDate date;
    private BigDecimal totalCalories;
    private BigDecimal totalCarbs;
    private BigDecimal totalProtein;
    private BigDecimal totalFat;
    private BigDecimal totalFiber;
    private BigDecimal totalSugar;

    private BigDecimal goalCalories;
    private BigDecimal goalCarbs;
    private BigDecimal goalProtein;
    private BigDecimal goalFat;

    private BigDecimal remainingCalories;
    private BigDecimal percentOfGoal;
    private boolean isExceeded;
    private BigDecimal exceededAmount;
    private int itemsCount;

    private List<FoodLogResponse> logs;

    public DailySummaryResponse() {
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(BigDecimal totalCalories) {
        this.totalCalories = totalCalories;
    }

    public BigDecimal getTotalCarbs() {
        return totalCarbs;
    }

    public void setTotalCarbs(BigDecimal totalCarbs) {
        this.totalCarbs = totalCarbs;
    }

    public BigDecimal getTotalProtein() {
        return totalProtein;
    }

    public void setTotalProtein(BigDecimal totalProtein) {
        this.totalProtein = totalProtein;
    }

    public BigDecimal getTotalFat() {
        return totalFat;
    }

    public void setTotalFat(BigDecimal totalFat) {
        this.totalFat = totalFat;
    }

    public BigDecimal getTotalFiber() {
        return totalFiber;
    }

    public void setTotalFiber(BigDecimal totalFiber) {
        this.totalFiber = totalFiber;
    }

    public BigDecimal getTotalSugar() {
        return totalSugar;
    }

    public void setTotalSugar(BigDecimal totalSugar) {
        this.totalSugar = totalSugar;
    }

    public BigDecimal getGoalCalories() {
        return goalCalories;
    }

    public void setGoalCalories(BigDecimal goalCalories) {
        this.goalCalories = goalCalories;
    }

    public BigDecimal getGoalCarbs() {
        return goalCarbs;
    }

    public void setGoalCarbs(BigDecimal goalCarbs) {
        this.goalCarbs = goalCarbs;
    }

    public BigDecimal getGoalProtein() {
        return goalProtein;
    }

    public void setGoalProtein(BigDecimal goalProtein) {
        this.goalProtein = goalProtein;
    }

    public BigDecimal getGoalFat() {
        return goalFat;
    }

    public void setGoalFat(BigDecimal goalFat) {
        this.goalFat = goalFat;
    }

    public BigDecimal getRemainingCalories() {
        return remainingCalories;
    }

    public void setRemainingCalories(BigDecimal remainingCalories) {
        this.remainingCalories = remainingCalories;
    }

    public BigDecimal getPercentOfGoal() {
        return percentOfGoal;
    }

    public void setPercentOfGoal(BigDecimal percentOfGoal) {
        this.percentOfGoal = percentOfGoal;
    }

    public boolean isExceeded() {
        return isExceeded;
    }

    public void setExceeded(boolean exceeded) {
        isExceeded = exceeded;
    }

    public BigDecimal getExceededAmount() {
        return exceededAmount;
    }

    public void setExceededAmount(BigDecimal exceededAmount) {
        this.exceededAmount = exceededAmount;
    }

    public int getItemsCount() {
        return itemsCount;
    }

    public void setItemsCount(int itemsCount) {
        this.itemsCount = itemsCount;
    }

    public List<FoodLogResponse> getLogs() {
        return logs;
    }

    public void setLogs(List<FoodLogResponse> logs) {
        this.logs = logs;
    }
}
