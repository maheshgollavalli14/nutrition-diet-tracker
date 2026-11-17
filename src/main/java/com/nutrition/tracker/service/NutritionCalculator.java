package com.nutrition.tracker.service;

import com.nutrition.tracker.entity.NutritionBasis;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calculates nutrition values based on food serving basis and consumed quantity.
 *
 * For a food stored per 100 g:
 *   consumed nutrient = nutrient per 100 g * consumed grams / 100
 *
 * For a food stored per serving:
 *   consumed nutrient = nutrient per serving * consumed servings
 */
@Component
public class NutritionCalculator {

    private static final BigDecimal HUNDRED = new BigDecimal("100.00");

    public CalculatedNutrients calculate(NutritionBasis basis, BigDecimal servingSize, BigDecimal consumedQuantity,
                                         BigDecimal baseCalories, BigDecimal baseCarbs, BigDecimal baseProtein,
                                         BigDecimal baseFat, BigDecimal baseFiber, BigDecimal baseSugar) {
        if (consumedQuantity == null || consumedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return new CalculatedNutrients(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        BigDecimal factor;
        if (basis == NutritionBasis.PER_100G) {
            // Factor = consumedQuantity / 100
            factor = consumedQuantity.divide(HUNDRED, 6, RoundingMode.HALF_UP);
        } else {
            // PER_SERVING: if servingSize > 0, servings = consumedQuantity / servingSize, else factor = consumedQuantity
            if (servingSize != null && servingSize.compareTo(BigDecimal.ZERO) > 0) {
                factor = consumedQuantity.divide(servingSize, 6, RoundingMode.HALF_UP);
            } else {
                factor = consumedQuantity;
            }
        }

        BigDecimal calories = scale(multiply(baseCalories, factor));
        BigDecimal carbs = scale(multiply(baseCarbs, factor));
        BigDecimal protein = scale(multiply(baseProtein, factor));
        BigDecimal fat = scale(multiply(baseFat, factor));
        BigDecimal fiber = scale(multiply(baseFiber, factor));
        BigDecimal sugar = scale(multiply(baseSugar, factor));

        return new CalculatedNutrients(calories, carbs, protein, fat, fiber, sugar);
    }

    private BigDecimal multiply(BigDecimal base, BigDecimal factor) {
        if (base == null) {
            return BigDecimal.ZERO;
        }
        return base.multiply(factor);
    }

    private BigDecimal scale(BigDecimal val) {
        return val.setScale(2, RoundingMode.HALF_UP);
    }

    public record CalculatedNutrients(
            BigDecimal calories,
            BigDecimal carbohydrates,
            BigDecimal protein,
            BigDecimal fat,
            BigDecimal fiber,
            BigDecimal sugar
    ) {}
}
