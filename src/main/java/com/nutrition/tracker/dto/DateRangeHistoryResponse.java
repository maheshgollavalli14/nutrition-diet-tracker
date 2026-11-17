package com.nutrition.tracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DateRangeHistoryResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private long totalEntries;
    private BigDecimal totalCalories;
    private BigDecimal totalCarbs;
    private BigDecimal totalProtein;
    private BigDecimal totalFat;
    private int page;
    private int totalPages;
    private List<FoodLogResponse> entries;

    public DateRangeHistoryResponse() {
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

    public long getTotalEntries() {
        return totalEntries;
    }

    public void setTotalEntries(long totalEntries) {
        this.totalEntries = totalEntries;
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

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public List<FoodLogResponse> getEntries() {
        return entries;
    }

    public void setEntries(List<FoodLogResponse> entries) {
        this.entries = entries;
    }
}
