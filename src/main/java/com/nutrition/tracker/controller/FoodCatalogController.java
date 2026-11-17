package com.nutrition.tracker.controller;

import com.nutrition.tracker.dto.FoodCatalogRequest;
import com.nutrition.tracker.dto.FoodCatalogResponse;
import com.nutrition.tracker.service.FoodCatalogService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodCatalogController {

    private final FoodCatalogService foodCatalogService;

    public FoodCatalogController(FoodCatalogService foodCatalogService) {
        this.foodCatalogService = foodCatalogService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<FoodCatalogResponse>> searchFoods(@RequestParam(name = "q", required = false) String keyword) {
        return ResponseEntity.ok(foodCatalogService.searchFoods(keyword));
    }

    @GetMapping
    public ResponseEntity<Page<FoodCatalogResponse>> getCatalog(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(foodCatalogService.getCatalogPaged(search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoodCatalogResponse> getFoodById(@PathVariable Long id) {
        return ResponseEntity.ok(foodCatalogService.getFoodById(id));
    }

    @PostMapping
    public ResponseEntity<FoodCatalogResponse> addFood(@Valid @RequestBody FoodCatalogRequest request) {
        FoodCatalogResponse response = foodCatalogService.addCustomFood(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
