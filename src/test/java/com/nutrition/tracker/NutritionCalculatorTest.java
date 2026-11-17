package com.nutrition.tracker;

import com.nutrition.tracker.entity.NutritionBasis;
import com.nutrition.tracker.service.NutritionCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class NutritionCalculatorTest {

    private NutritionCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new NutritionCalculator();
    }

    @Test
    @DisplayName("Should correctly calculate nutrition for PER_100G basis: 150g of Chicken Breast (165 kcal / 100g)")
    void testCalculatePer100g() {
        // Chicken breast per 100g: 165 kcal, 0g C, 31g P, 3.6g F, 0g fiber, 0g sugar
        NutritionCalculator.CalculatedNutrients result = calculator.calculate(
                NutritionBasis.PER_100G,
                new BigDecimal("100.00"),
                new BigDecimal("150.00"), // consumed 150 grams
                new BigDecimal("165.00"),
                new BigDecimal("0.00"),
                new BigDecimal("31.00"),
                new BigDecimal("3.60"),
                new BigDecimal("0.00"),
                new BigDecimal("0.00")
        );

        // 165 * 150 / 100 = 247.50
        assertEquals(new BigDecimal("247.50"), result.calories());
        // 0 * 1.5 = 0.00
        assertEquals(new BigDecimal("0.00"), result.carbohydrates());
        // 31 * 1.5 = 46.50
        assertEquals(new BigDecimal("46.50"), result.protein());
        // 3.6 * 1.5 = 5.40
        assertEquals(new BigDecimal("5.40"), result.fat());
    }

    @Test
    @DisplayName("Should correctly calculate nutrition for PER_SERVING basis: 2 large eggs (72 kcal / egg)")
    void testCalculatePerServing() {
        // Large egg per 1 serving: 72 kcal, 0.4g C, 6.3g P, 4.8g F
        NutritionCalculator.CalculatedNutrients result = calculator.calculate(
                NutritionBasis.PER_SERVING,
                new BigDecimal("1.00"),
                new BigDecimal("2.00"), // consumed 2 eggs
                new BigDecimal("72.00"),
                new BigDecimal("0.40"),
                new BigDecimal("6.30"),
                new BigDecimal("4.80"),
                new BigDecimal("0.00"),
                new BigDecimal("0.20")
        );

        // 72 * 2 = 144.00
        assertEquals(new BigDecimal("144.00"), result.calories());
        // 0.4 * 2 = 0.80
        assertEquals(new BigDecimal("0.80"), result.carbohydrates());
        // 6.3 * 2 = 12.60
        assertEquals(new BigDecimal("12.60"), result.protein());
        // 4.8 * 2 = 9.60
        assertEquals(new BigDecimal("9.60"), result.fat());
        assertEquals(new BigDecimal("0.40"), result.sugar());
    }

    @Test
    @DisplayName("Should return zeros when consumed quantity is zero or null")
    void testZeroQuantity() {
        NutritionCalculator.CalculatedNutrients result = calculator.calculate(
                NutritionBasis.PER_100G,
                new BigDecimal("100.00"),
                BigDecimal.ZERO,
                new BigDecimal("200.00"),
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("5.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        assertEquals(BigDecimal.ZERO, result.calories());
        assertEquals(BigDecimal.ZERO, result.carbohydrates());
        assertEquals(BigDecimal.ZERO, result.protein());
        assertEquals(BigDecimal.ZERO, result.fat());
    }
}
