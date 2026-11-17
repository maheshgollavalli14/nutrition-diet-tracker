const test = require('node:test');
const assert = require('node:assert/strict');
const {
  round2,
  calculateFromFood,
  calculateGoalProgress,
  sumLogs,
} = require('../src/utils/nutritionCalculator');

test('calculateFromFood scales PER_100G accurately', () => {
  const chicken = {
    nutritionBasis: 'PER_100G',
    servingSize: 100,
    calories: 165,
    carbohydrates: 0,
    protein: 31,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
  };

  const result = calculateFromFood(chicken, 150);
  assert.deepEqual(result, {
    calories: 247.5,
    carbohydrates: 0,
    protein: 46.5,
    fat: 5.4,
    fiber: 0,
    sugar: 0,
  });
});

test('calculateFromFood scales PER_SERVING accurately', () => {
  const bar = {
    nutritionBasis: 'PER_SERVING',
    servingSize: 40,
    calories: 180,
    carbohydrates: 22,
    protein: 10,
    fat: 6,
    fiber: 4,
    sugar: 8,
  };

  const result = calculateFromFood(bar, 60);
  assert.deepEqual(result, {
    calories: 270,
    carbohydrates: 33,
    protein: 15,
    fat: 9,
    fiber: 6,
    sugar: 12,
  });
});

test('calculateFromFood rejects zero or negative consumedQuantity', () => {
  const food = { nutritionBasis: 'PER_100G', servingSize: 100, calories: 100 };
  assert.throws(() => calculateFromFood(food, 0), /greater than zero/i);
  assert.throws(() => calculateFromFood(food, -15), /greater than zero/i);
});

test('calculateGoalProgress detects under-goal and over-goal states accurately', () => {
  const goal = { dailyCalories: 2000, dailyCarbs: 250, dailyProtein: 150, dailyFat: 65 };
  const under = calculateGoalProgress(goal, { calories: 1250, carbohydrates: 140, protein: 100, fat: 40 });
  assert.equal(under.remainingCalories, 750);
  assert.equal(under.caloriePercentage, 62.5);
  assert.equal(under.isOverCalories, false);
  assert.equal(under.exceededCaloriesBy, 0);

  const over = calculateGoalProgress(goal, { calories: 2345.67, carbohydrates: 280, protein: 160, fat: 80 });
  assert.equal(over.remainingCalories, -345.67);
  assert.equal(over.isOverCalories, true);
  assert.equal(over.exceededCaloriesBy, 345.67);
  assert.equal(round2(over.caloriePercentage), 117.28);
});

test('sumLogs totals array of logs with 2-decimal precision', () => {
  const totals = sumLogs([
    { calories: 100.12, carbohydrates: 10.11, protein: 5.55, fat: 2.34, fiber: 1.1, sugar: 0.5 },
    { calories: 200.25, carbohydrates: 20.22, protein: 10.1, fat: 4.56, fiber: 2.2, sugar: 1.5 },
  ]);
  assert.deepEqual(totals, {
    calories: 300.37,
    carbohydrates: 30.33,
    protein: 15.65,
    fat: 6.9,
    fiber: 3.3,
    sugar: 2,
  });
});
