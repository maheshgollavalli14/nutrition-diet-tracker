const { ValidationError } = require('./errors');

function round2(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function calculateMultiplier(nutritionBasis, servingSize, consumedQuantity) {
  const qty = Number(consumedQuantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ValidationError('Consumed quantity must be greater than zero.');
  }

  if (nutritionBasis === 'PER_100G') {
    return qty / 100;
  }

  if (nutritionBasis === 'PER_SERVING') {
    const size = Number(servingSize);
    if (!Number.isFinite(size) || size <= 0) {
      throw new ValidationError('Food item must have a positive serving size for per-serving calculations.');
    }
    return qty / size;
  }

  throw new ValidationError(`Unsupported nutrition basis: ${nutritionBasis}`);
}

/**
 * Computes exact nutrition totals for a food item and consumed quantity.
 */
function calculateFromFood(food, consumedQuantity) {
  const basis = food.nutritionBasis || food.nutrition_basis || 'PER_100G';
  const servingSize = food.servingSize ?? food.serving_size ?? 100;
  const multiplier = calculateMultiplier(basis, servingSize, consumedQuantity);

  return {
    calories: round2((food.calories || 0) * multiplier),
    carbohydrates: round2((food.carbohydrates || 0) * multiplier),
    protein: round2((food.protein || 0) * multiplier),
    fat: round2((food.fat || 0) * multiplier),
    fiber: round2((food.fiber || 0) * multiplier),
    sugar: round2((food.sugar || 0) * multiplier),
  };
}

/**
 * Computes goal progress, remaining macros, and over-goal indicators.
 */
function calculateGoalProgress(goal, totals) {
  const dailyCalories = Number(goal.dailyCalories || 0);
  const dailyCarbs = Number(goal.dailyCarbs || 0);
  const dailyProtein = Number(goal.dailyProtein || 0);
  const dailyFat = Number(goal.dailyFat || 0);

  const consumedCalories = round2(totals.calories);
  const consumedCarbs = round2(totals.carbohydrates);
  const consumedProtein = round2(totals.protein);
  const consumedFat = round2(totals.fat);

  const remainingCalories = round2(dailyCalories - consumedCalories);
  const remainingCarbs = round2(dailyCarbs - consumedCarbs);
  const remainingProtein = round2(dailyProtein - consumedProtein);
  const remainingFat = round2(dailyFat - consumedFat);

  const caloriePercentage =
    dailyCalories > 0 ? round2((consumedCalories / dailyCalories) * 100) : 0;

  return {
    remainingCalories,
    remainingCarbs,
    remainingProtein,
    remainingFat,
    caloriePercentage,
    isOverCalories: dailyCalories > 0 && consumedCalories > dailyCalories,
    exceededCaloriesBy:
      dailyCalories > 0 && consumedCalories > dailyCalories
        ? round2(consumedCalories - dailyCalories)
        : 0,
  };
}

/**
 * Sums nutrition fields across an array of food logs.
 */
function sumLogs(logs) {
  const totals = {
    calories: 0,
    carbohydrates: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
  };

  for (const log of logs) {
    totals.calories += Number(log.calories || 0);
    totals.carbohydrates += Number(log.carbohydrates || 0);
    totals.protein += Number(log.protein || 0);
    totals.fat += Number(log.fat || 0);
    totals.fiber += Number(log.fiber || 0);
    totals.sugar += Number(log.sugar || 0);
  }

  return {
    calories: round2(totals.calories),
    carbohydrates: round2(totals.carbohydrates),
    protein: round2(totals.protein),
    fat: round2(totals.fat),
    fiber: round2(totals.fiber),
    sugar: round2(totals.sugar),
  };
}

module.exports = {
  round2,
  calculateMultiplier,
  calculateFromFood,
  calculateGoalProgress,
  sumLogs,
};
