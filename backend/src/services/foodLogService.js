const db = require('../config/db');
const foodModel = require('../models/foodModel');
const foodLogModel = require('../models/foodLogModel');
const { calculateFromFood, round2, sumLogs } = require('../utils/nutritionCalculator');
const {
  normalizeTimeZone,
  formatLocalDate,
  parseStrictDateString,
  addDaysToDateString,
  getUtcRangeForLocalDate,
  getUtcRangeForLocalDateSpan,
  daysBetweenInclusive,
  normalizeToSecondDate,
  toMysqlUtcDatetime,
} = require('../utils/dateUtils');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  DailyLimitExceededError,
} = require('../utils/errors');

const MAX_LOGS_PER_FOOD_PER_DAY = 3;
const MAX_HISTORY_DAYS = 365;

async function resolveNutritionSnapshot(userId, payload, conn = null) {
  const consumedQuantity = Number(payload.consumedQuantity);
  if (!Number.isFinite(consumedQuantity) || consumedQuantity <= 0) {
    throw new ValidationError('Consumed quantity must be greater than zero.');
  }

  if (payload.foodId !== undefined && payload.foodId !== null && payload.foodId !== '') {
    const foodId = Number(payload.foodId);
    if (!Number.isInteger(foodId) || foodId <= 0) {
      throw new ValidationError('Invalid foodId.');
    }

    const food = await foodModel.findByIdVisible(foodId, userId, conn);
    if (!food) {
      throw new NotFoundError('Referenced food item was not found.');
    }

    const computed = calculateFromFood(food, consumedQuantity);
    return {
      foodId: food.id,
      foodName: food.name,
      consumedQuantity: round2(consumedQuantity),
      servingUnit: String(payload.servingUnit || food.servingUnit || 'g').trim(),
      ...computed,
      foodMeta: {
        nutritionBasis: food.nutritionBasis,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
      },
    };
  }

  const foodName = String(payload.foodName || '').trim();
  if (!foodName) {
    throw new ValidationError('Food name is required for manual food entry.');
  }

  const calories = Number(payload.calories);
  if (!Number.isFinite(calories) || calories < 0) {
    throw new ValidationError('Calories must be zero or positive.');
  }

  return {
    foodId: null,
    foodName,
    consumedQuantity: round2(consumedQuantity),
    servingUnit: String(payload.servingUnit || 'g').trim() || 'g',
    calories: round2(calories),
    carbohydrates: round2(payload.carbohydrates ?? 0),
    protein: round2(payload.protein ?? 0),
    fat: round2(payload.fat ?? 0),
    fiber: round2(payload.fiber ?? 0),
    sugar: round2(payload.sugar ?? 0),
    foodMeta: null,
  };
}

async function assertDailyAndTimestampConstraints(
  conn,
  { userId, foodId, loggedAtDate, timeZone, excludeLogId = null }
) {
  await foodLogModel.lockUserForLogging(userId, conn);

  const tz = normalizeTimeZone(timeZone);
  const localDate = formatLocalDate(loggedAtDate, tz);
  const { startUtc, endUtc } = getUtcRangeForLocalDate(localDate, tz);
  const loggedAtMysql = toMysqlUtcDatetime(loggedAtDate);

  if (foodId) {
    const existingCount = await foodLogModel.countByUserAndFoodInRange(
      userId,
      foodId,
      toMysqlUtcDatetime(startUtc),
      toMysqlUtcDatetime(endUtc),
      excludeLogId,
      conn
    );
    if (existingCount >= MAX_LOGS_PER_FOOD_PER_DAY) {
      throw new DailyLimitExceededError(
        `You can log the same catalog food at most ${MAX_LOGS_PER_FOOD_PER_DAY} times per day (${localDate}).`
      );
    }
  }

  const duplicateTs = await foodLogModel.existsByUserAndLoggedAt(
    userId,
    loggedAtMysql,
    excludeLogId,
    conn
  );
  if (duplicateTs) {
    throw new ConflictError(
      'A food log already exists at this exact timestamp. Please adjust the time by at least 1 second.',
      'DUPLICATE_TIMESTAMP'
    );
  }

  return loggedAtMysql;
}

async function previewFoodLog(userId, payload) {
  return resolveNutritionSnapshot(userId, payload);
}

async function createFoodLog(user, payload) {
  const loggedAtDate = normalizeToSecondDate(payload.loggedAt);

  try {
    return await db.withTransaction(async (conn) => {
      const snapshot = await resolveNutritionSnapshot(user.id, payload, conn);
      const loggedAtMysql = await assertDailyAndTimestampConstraints(conn, {
        userId: user.id,
        foodId: snapshot.foodId,
        loggedAtDate,
        timeZone: user.timezone,
      });

      return foodLogModel.create(
        user.id,
        {
          foodId: snapshot.foodId,
          foodName: snapshot.foodName,
          consumedQuantity: snapshot.consumedQuantity,
          servingUnit: snapshot.servingUnit,
          calories: snapshot.calories,
          carbohydrates: snapshot.carbohydrates,
          protein: snapshot.protein,
          fat: snapshot.fat,
          fiber: snapshot.fiber,
          sugar: snapshot.sugar,
          loggedAtMysql,
        },
        conn
      );
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      throw new ConflictError(
        'A food log already exists at this exact timestamp.',
        'DUPLICATE_TIMESTAMP'
      );
    }
    throw err;
  }
}

async function getFoodLogById(userId, logId) {
  const id = Number(logId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid food log ID.');
  }

  const log = await foodLogModel.findByIdAndUserId(id, userId);
  if (!log) {
    throw new NotFoundError('Food log entry not found.');
  }
  return log;
}

async function updateFoodLog(user, logId, payload) {
  const id = Number(logId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid food log ID.');
  }

  try {
    return await db.withTransaction(async (conn) => {
      const existing = await foodLogModel.findByIdAndUserId(id, user.id, conn);
      if (!existing) {
        throw new NotFoundError('Food log entry not found.');
      }

      const nextQty =
        payload.consumedQuantity !== undefined
          ? Number(payload.consumedQuantity)
          : existing.consumedQuantity;
      if (!Number.isFinite(nextQty) || nextQty <= 0) {
        throw new ValidationError('Consumed quantity must be greater than zero.');
      }

      const nextLoggedAtDate = payload.loggedAt
        ? normalizeToSecondDate(payload.loggedAt)
        : normalizeToSecondDate(existing.loggedAt);

      const loggedAtMysql = await assertDailyAndTimestampConstraints(conn, {
        userId: user.id,
        foodId: existing.foodId,
        loggedAtDate: nextLoggedAtDate,
        timeZone: user.timezone,
        excludeLogId: id,
      });

      let computedFields;
      if (existing.foodId && payload.calories === undefined) {
        const food = await foodModel.findByIdVisible(existing.foodId, user.id, conn);
        if (food) {
          const calc = calculateFromFood(food, nextQty);
          computedFields = {
            foodName: existing.foodName,
            consumedQuantity: round2(nextQty),
            servingUnit: String(payload.servingUnit || existing.servingUnit).trim(),
            ...calc,
          };
        }
      }

      if (!computedFields) {
        const hasManualMacros =
          payload.calories !== undefined ||
          payload.carbohydrates !== undefined ||
          payload.protein !== undefined ||
          payload.fat !== undefined;

        if (hasManualMacros) {
          computedFields = {
            foodName:
              typeof payload.foodName === 'string' && payload.foodName.trim()
                ? payload.foodName.trim()
                : existing.foodName,
            consumedQuantity: round2(nextQty),
            servingUnit: String(payload.servingUnit || existing.servingUnit).trim(),
            calories: round2(payload.calories ?? existing.calories),
            carbohydrates: round2(payload.carbohydrates ?? existing.carbohydrates),
            protein: round2(payload.protein ?? existing.protein),
            fat: round2(payload.fat ?? existing.fat),
            fiber: round2(payload.fiber ?? existing.fiber),
            sugar: round2(payload.sugar ?? existing.sugar),
          };
        } else {
          // Proportional scaling from existing snapshot when food catalog row was removed or unchanged
          const ratio = existing.consumedQuantity > 0 ? nextQty / existing.consumedQuantity : 1;
          computedFields = {
            foodName:
              typeof payload.foodName === 'string' && payload.foodName.trim()
                ? payload.foodName.trim()
                : existing.foodName,
            consumedQuantity: round2(nextQty),
            servingUnit: String(payload.servingUnit || existing.servingUnit).trim(),
            calories: round2(existing.calories * ratio),
            carbohydrates: round2(existing.carbohydrates * ratio),
            protein: round2(existing.protein * ratio),
            fat: round2(existing.fat * ratio),
            fiber: round2(existing.fiber * ratio),
            sugar: round2(existing.sugar * ratio),
          };
        }
      }

      return foodLogModel.updateByIdAndUserId(
        id,
        user.id,
        {
          ...computedFields,
          loggedAtMysql,
        },
        conn
      );
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      throw new ConflictError(
        'A food log already exists at this exact timestamp.',
        'DUPLICATE_TIMESTAMP'
      );
    }
    throw err;
  }
}

async function deleteFoodLog(userId, logId) {
  const id = Number(logId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid food log ID.');
  }

  const deleted = await foodLogModel.deleteByIdAndUserId(id, userId);
  if (!deleted) {
    throw new NotFoundError('Food log entry not found.');
  }
}

async function getLogsForDate(user, dateStr) {
  const tz = normalizeTimeZone(user.timezone);
  const localDate = dateStr || formatLocalDate(new Date(), tz);
  parseStrictDateString(localDate);

  const { startUtc, endUtc } = getUtcRangeForLocalDate(localDate, tz);
  const logs = await foodLogModel.findByUserIdInRange(
    user.id,
    toMysqlUtcDatetime(startUtc),
    toMysqlUtcDatetime(endUtc),
    { order: 'DESC' }
  );

  return {
    date: localDate,
    timezone: tz,
    count: logs.length,
    totals: sumLogs(logs),
    logs,
  };
}

async function getHistory(user, { startDate, endDate, page = 1, limit = 50 } = {}) {
  const tz = normalizeTimeZone(user.timezone);
  const todayLocal = formatLocalDate(new Date(), tz);
  const resolvedEnd = endDate || todayLocal;
  const resolvedStart = startDate || addDaysToDateString(resolvedEnd, -29);

  parseStrictDateString(resolvedStart);
  parseStrictDateString(resolvedEnd);

  const daySpan = daysBetweenInclusive(resolvedStart, resolvedEnd);
  if (daySpan <= 0) {
    throw new ValidationError('Start date cannot be after end date.');
  }
  if (daySpan > MAX_HISTORY_DAYS) {
    throw new ValidationError(`Date range cannot exceed ${MAX_HISTORY_DAYS} days.`);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const { startUtc, endUtc } = getUtcRangeForLocalDateSpan(resolvedStart, resolvedEnd, tz);
  const startMysql = toMysqlUtcDatetime(startUtc);
  const endMysql = toMysqlUtcDatetime(endUtc);

  const [logs, summaryTotals] = await Promise.all([
    foodLogModel.findByUserIdInRange(user.id, startMysql, endMysql, {
      order: 'DESC',
      limit: safeLimit,
      offset,
    }),
    foodLogModel.getTotalsByUserIdInRange(user.id, startMysql, endMysql),
  ]);

  const totalItems = summaryTotals.logCount;
  const totalPages = Math.max(Math.ceil(totalItems / safeLimit), 1);

  return {
    startDate: resolvedStart,
    endDate: resolvedEnd,
    timezone: tz,
    daySpan,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
    },
    totals: {
      calories: round2(summaryTotals.calories),
      carbohydrates: round2(summaryTotals.carbohydrates),
      protein: round2(summaryTotals.protein),
      fat: round2(summaryTotals.fat),
      fiber: round2(summaryTotals.fiber),
      sugar: round2(summaryTotals.sugar),
    },
    logs,
  };
}

module.exports = {
  MAX_LOGS_PER_FOOD_PER_DAY,
  MAX_HISTORY_DAYS,
  previewFoodLog,
  createFoodLog,
  getFoodLogById,
  updateFoodLog,
  deleteFoodLog,
  getLogsForDate,
  getHistory,
};
