const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/config/db');
const foodModel = require('../src/models/foodModel');
const foodLogModel = require('../src/models/foodLogModel');
const foodService = require('../src/services/foodService');
const foodLogService = require('../src/services/foodLogService');
const {
  NotFoundError,
  DailyLimitExceededError,
  ConflictError,
  ValidationError,
} = require('../src/utils/errors');

test('foodService enforces user isolation for custom food items', async (t) => {
  t.mock.method(foodModel, 'findByIdVisible', async (id, userId) => {
    if (id === 42 && userId === 1) {
      return { id: 42, name: 'User 1 Custom Smoothie', isCustom: true, createdByUserId: 1 };
    }
    return null;
  });

  const ownerFood = await foodService.getFoodById(1, 42);
  assert.equal(ownerFood.id, 42);

  await assert.rejects(() => foodService.getFoodById(2, 42), NotFoundError);
});

test('foodLogService isolates food log read/update/delete strictly by userId', async (t) => {
  const user2 = { id: 2, timezone: 'UTC' };
  t.mock.method(foodLogModel, 'findByIdAndUserId', async (logId, userId) => {
    if (logId === 99 && userId === 1) {
      return { id: 99, userId: 1, foodId: 5, foodName: 'Rolled Oats', consumedQuantity: 50, loggedAt: '2026-04-10T08:00:00.000Z' };
    }
    return null;
  });
  t.mock.method(foodLogModel, 'deleteByIdAndUserId', async (logId, userId) => logId === 99 && userId === 1);
  t.mock.method(db, 'withTransaction', async (fn) => fn({ release() {} }));

  await assert.rejects(() => foodLogService.getFoodLogById(2, 99), NotFoundError);
  await assert.rejects(
    () => foodLogService.updateFoodLog(user2, 99, { consumedQuantity: 100 }),
    NotFoundError
  );
  await assert.rejects(() => foodLogService.deleteFoodLog(2, 99), NotFoundError);
});

test('foodLogService enforces max 3 logs per food per day and unique timestamp', async (t) => {
  const user1 = { id: 1, timezone: 'Asia/Kolkata' };
  t.mock.method(db, 'withTransaction', async (fn) => fn({ release() {} }));
  t.mock.method(foodLogModel, 'lockUserForLogging', async () => {});
  t.mock.method(foodModel, 'findByIdVisible', async () => ({
    id: 1,
    name: 'Chicken Breast (Raw)',
    servingUnit: 'g',
    nutritionBasis: 'PER_100G',
    servingSize: 100,
    calories: 165,
    carbohydrates: 0,
    protein: 31,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
  }));

  t.mock.method(foodLogModel, 'countByUserAndFoodInRange', async () => 3);
  t.mock.method(foodLogModel, 'existsByUserAndLoggedAt', async () => false);

  await assert.rejects(
    () =>
      foodLogService.createFoodLog(user1, {
        foodId: 1,
        consumedQuantity: 100,
        loggedAt: '2026-04-10T10:00:00Z',
      }),
    DailyLimitExceededError
  );

  t.mock.method(foodLogModel, 'countByUserAndFoodInRange', async () => 1);
  t.mock.method(foodLogModel, 'existsByUserAndLoggedAt', async () => true);

  await assert.rejects(
    () =>
      foodLogService.createFoodLog(user1, {
        foodId: 1,
        consumedQuantity: 100,
        loggedAt: '2026-04-10T10:00:00Z',
      }),
    ConflictError
  );
});

test('foodLogService rejects invalid or >365-day history windows', async () => {
  const user = { id: 1, timezone: 'UTC' };
  await assert.rejects(
    () => foodLogService.getHistory(user, { startDate: '2026-05-01', endDate: '2026-04-01' }),
    ValidationError
  );
  await assert.rejects(
    () => foodLogService.getHistory(user, { startDate: '2025-01-01', endDate: '2026-01-02' }),
    ValidationError
  );
});
