package com.nutrition.tracker.controller;

import com.nutrition.tracker.dto.DailySummaryResponse;
import com.nutrition.tracker.dto.DateRangeHistoryResponse;
import com.nutrition.tracker.dto.WeeklySummaryResponse;
import com.nutrition.tracker.service.SummaryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping("/daily")
    public ResponseEntity<DailySummaryResponse> getDailySummary(
            @RequestParam(name = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ResponseEntity.ok(summaryService.getDailySummary(date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<WeeklySummaryResponse> getWeeklySummary(
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(summaryService.getWeeklySummary(endDate));
    }

    @GetMapping("/history")
    public ResponseEntity<DateRangeHistoryResponse> getHistory(
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(summaryService.getHistory(startDate, endDate, page, size));
    }
}
