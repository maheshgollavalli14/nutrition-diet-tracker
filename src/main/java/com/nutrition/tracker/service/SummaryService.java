package com.nutrition.tracker.service;

import com.nutrition.tracker.dto.*;
import com.nutrition.tracker.entity.FoodLog;
import com.nutrition.tracker.entity.User;
import com.nutrition.tracker.entity.UserGoal;
import com.nutrition.tracker.exception.ValidationException;
import com.nutrition.tracker.repository.FoodLogRepository;
import com.nutrition.tracker.repository.UserGoalRepository;
import com.nutrition.tracker.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SummaryService {

    private final FoodLogRepository foodLogRepository;
    private final UserGoalRepository userGoalRepository;
    private final FoodLogService foodLogService;

    public SummaryService(FoodLogRepository foodLogRepository,
                          UserGoalRepository userGoalRepository,
                          FoodLogService foodLogService) {
        this.foodLogRepository = foodLogRepository;
        this.userGoalRepository = userGoalRepository;
        this.foodLogService = foodLogService;
    }

    /**
     * Computes the complete nutrition summary for a single local calendar date.
     */
    @Transactional(readOnly = true)
    public DailySummaryResponse getDailySummary(LocalDate date) {
        User user = SecurityUtils.getCurrentUser();
        ZoneId zone = foodLogService.getUserZoneId(user);
        Instant startUtc = date.atStartOfDay(zone).toInstant();
        Instant endUtc = date.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1_000_000);

        List<FoodLog> logs = foodLogRepository.findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(
                user.getId(), startUtc, endUtc
        );

        UserGoal goal = userGoalRepository.findByUserId(user.getId())
                .orElse(new UserGoal(user, new BigDecimal("2000.00"), new BigDecimal("250.00"),
                        new BigDecimal("150.00"), new BigDecimal("65.00")));

        BigDecimal totalCal = BigDecimal.ZERO;
        BigDecimal totalCarb = BigDecimal.ZERO;
        BigDecimal totalProt = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;
        BigDecimal totalFib = BigDecimal.ZERO;
        BigDecimal totalSug = BigDecimal.ZERO;

        for (FoodLog l : logs) {
            totalCal = totalCal.add(l.getCalories());
            totalCarb = totalCarb.add(l.getCarbohydrates());
            totalProt = totalProt.add(l.getProtein());
            totalFat = totalFat.add(l.getFat());
            totalFib = totalFib.add(l.getFiber() != null ? l.getFiber() : BigDecimal.ZERO);
            totalSug = totalSug.add(l.getSugar() != null ? l.getSugar() : BigDecimal.ZERO);
        }

        totalCal = totalCal.setScale(2, RoundingMode.HALF_UP);
        totalCarb = totalCarb.setScale(2, RoundingMode.HALF_UP);
        totalProt = totalProt.setScale(2, RoundingMode.HALF_UP);
        totalFat = totalFat.setScale(2, RoundingMode.HALF_UP);
        totalFib = totalFib.setScale(2, RoundingMode.HALF_UP);
        totalSug = totalSug.setScale(2, RoundingMode.HALF_UP);

        BigDecimal goalCal = goal.getDailyCalories();
        BigDecimal remainingCal = goalCal.subtract(totalCal).setScale(2, RoundingMode.HALF_UP);

        BigDecimal percent = BigDecimal.ZERO;
        if (goalCal.compareTo(BigDecimal.ZERO) > 0) {
            percent = totalCal.multiply(new BigDecimal("100.00")).divide(goalCal, 1, RoundingMode.HALF_UP);
        }

        boolean isExceeded = totalCal.compareTo(goalCal) > 0;
        BigDecimal exceededAmount = isExceeded ? totalCal.subtract(goalCal).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        DailySummaryResponse resp = new DailySummaryResponse();
        resp.setDate(date);
        resp.setTotalCalories(totalCal);
        resp.setTotalCarbs(totalCarb);
        resp.setTotalProtein(totalProt);
        resp.setTotalFat(totalFat);
        resp.setTotalFiber(totalFib);
        resp.setTotalSugar(totalSug);

        resp.setGoalCalories(goalCal);
        resp.setGoalCarbs(goal.getDailyCarbs());
        resp.setGoalProtein(goal.getDailyProtein());
        resp.setGoalFat(goal.getDailyFat());

        resp.setRemainingCalories(remainingCal);
        resp.setPercentOfGoal(percent);
        resp.setExceeded(isExceeded);
        resp.setExceededAmount(exceededAmount);
        resp.setItemsCount(logs.size());

        resp.setLogs(logs.stream().map(foodLogService::mapToResponse).collect(Collectors.toList()));
        return resp;
    }

    /**
     * Computes 7-day weekly summary ending on the provided date (defaults to today).
     */
    @Transactional(readOnly = true)
    public WeeklySummaryResponse getWeeklySummary(LocalDate endDate) {
        User user = SecurityUtils.getCurrentUser();
        ZoneId zone = foodLogService.getUserZoneId(user);

        if (endDate == null) {
            endDate = LocalDate.now(zone);
        }
        LocalDate startDate = endDate.minusDays(6);

        Instant startUtc = startDate.atStartOfDay(zone).toInstant();
        Instant endUtc = endDate.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1_000_000);

        List<FoodLog> logs = foodLogRepository.findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(
                user.getId(), startUtc, endUtc
        );

        UserGoal goal = userGoalRepository.findByUserId(user.getId())
                .orElse(new UserGoal(user, new BigDecimal("2000.00"), new BigDecimal("250.00"),
                        new BigDecimal("150.00"), new BigDecimal("65.00")));

        // Group logs by local date
        Map<LocalDate, List<FoodLog>> logsByDate = new HashMap<>();
        for (FoodLog l : logs) {
            LocalDate logDate = l.getLoggedAt().atZone(zone).toLocalDate();
            logsByDate.computeIfAbsent(logDate, k -> new ArrayList<>()).add(l);
        }

        List<DayNutritionSummary> days = new ArrayList<>();
        BigDecimal totalCal = BigDecimal.ZERO;
        BigDecimal totalCarb = BigDecimal.ZERO;
        BigDecimal totalProt = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;

        for (int i = 0; i < 7; i++) {
            LocalDate currentDay = startDate.plusDays(i);
            List<FoodLog> dayLogs = logsByDate.getOrDefault(currentDay, Collections.emptyList());

            BigDecimal dCal = BigDecimal.ZERO;
            BigDecimal dCarb = BigDecimal.ZERO;
            BigDecimal dProt = BigDecimal.ZERO;
            BigDecimal dFat = BigDecimal.ZERO;

            for (FoodLog l : dayLogs) {
                dCal = dCal.add(l.getCalories());
                dCarb = dCarb.add(l.getCarbohydrates());
                dProt = dProt.add(l.getProtein());
                dFat = dFat.add(l.getFat());
            }

            dCal = dCal.setScale(2, RoundingMode.HALF_UP);
            dCarb = dCarb.setScale(2, RoundingMode.HALF_UP);
            dProt = dProt.setScale(2, RoundingMode.HALF_UP);
            dFat = dFat.setScale(2, RoundingMode.HALF_UP);

            totalCal = totalCal.add(dCal);
            totalCarb = totalCarb.add(dCarb);
            totalProt = totalProt.add(dProt);
            totalFat = totalFat.add(dFat);

            String dayName = currentDay.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            days.add(new DayNutritionSummary(currentDay, dayName, dCal, dCarb, dProt, dFat, goal.getDailyCalories()));
        }

        BigDecimal seven = new BigDecimal("7");
        WeeklySummaryResponse resp = new WeeklySummaryResponse();
        resp.setStartDate(startDate);
        resp.setEndDate(endDate);
        resp.setTotalCalories(totalCal.setScale(2, RoundingMode.HALF_UP));
        resp.setAverageDailyCalories(totalCal.divide(seven, 2, RoundingMode.HALF_UP));
        resp.setTotalCarbs(totalCarb.setScale(2, RoundingMode.HALF_UP));
        resp.setAverageDailyCarbs(totalCarb.divide(seven, 2, RoundingMode.HALF_UP));
        resp.setTotalProtein(totalProt.setScale(2, RoundingMode.HALF_UP));
        resp.setAverageDailyProtein(totalProt.divide(seven, 2, RoundingMode.HALF_UP));
        resp.setTotalFat(totalFat.setScale(2, RoundingMode.HALF_UP));
        resp.setAverageDailyFat(totalFat.divide(seven, 2, RoundingMode.HALF_UP));
        resp.setGoalCalories(goal.getDailyCalories());
        resp.setDays(days);

        return resp;
    }

    /**
     * Retrieves food logs and aggregated totals for an arbitrary date range up to 365 days (one year).
     */
    @Transactional(readOnly = true)
    public DateRangeHistoryResponse getHistory(LocalDate startDate, LocalDate endDate, int page, int size) {
        User user = SecurityUtils.getCurrentUser();
        ZoneId zone = foodLogService.getUserZoneId(user);

        if (startDate == null) {
            startDate = LocalDate.now(zone).minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now(zone);
        }

        if (startDate.isAfter(endDate)) {
            throw new ValidationException("Start date cannot be after end date.");
        }

        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween > 365) {
            throw new ValidationException("Historical query range cannot exceed 365 days (1 year).");
        }

        Instant startUtc = startDate.atStartOfDay(zone).toInstant();
        Instant endUtc = endDate.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1_000_000);

        // Fetch totals across the whole range
        List<FoodLog> allRangeLogs = foodLogRepository.findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(
                user.getId(), startUtc, endUtc
        );

        BigDecimal totalCal = BigDecimal.ZERO;
        BigDecimal totalCarb = BigDecimal.ZERO;
        BigDecimal totalProt = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;

        for (FoodLog l : allRangeLogs) {
            totalCal = totalCal.add(l.getCalories());
            totalCarb = totalCarb.add(l.getCarbohydrates());
            totalProt = totalProt.add(l.getProtein());
            totalFat = totalFat.add(l.getFat());
        }

        // Fetch paged page slice
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<FoodLog> pagedResult = foodLogRepository.findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(
                user.getId(), startUtc, endUtc, pageable
        );

        DateRangeHistoryResponse resp = new DateRangeHistoryResponse();
        resp.setStartDate(startDate);
        resp.setEndDate(endDate);
        resp.setTotalEntries(pagedResult.getTotalElements());
        resp.setTotalCalories(totalCal.setScale(2, RoundingMode.HALF_UP));
        resp.setTotalCarbs(totalCarb.setScale(2, RoundingMode.HALF_UP));
        resp.setTotalProtein(totalProt.setScale(2, RoundingMode.HALF_UP));
        resp.setTotalFat(totalFat.setScale(2, RoundingMode.HALF_UP));
        resp.setPage(pagedResult.getNumber());
        resp.setTotalPages(pagedResult.getTotalPages());
        resp.setEntries(pagedResult.getContent().stream().map(foodLogService::mapToResponse).collect(Collectors.toList()));

        return resp;
    }
}
