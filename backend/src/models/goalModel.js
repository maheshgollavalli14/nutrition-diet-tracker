const db = require('../config/db');
const { toIsoUtcString } = require('../utils/dateUtils');

function mapGoal(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    dailyCalories: Number(row.daily_calories),
    dailyCarbs: Number(row.daily_carbs),
    dailyProtein: Number(row.daily_protein),
    dailyFat: Number(row.daily_fat),
    createdAt: toIsoUtcString(row.created_at),
    updatedAt: toIsoUtcString(row.updated_at),
  };
}

async function findByUserId(userId, conn = null) {
  const rows = await db.query(
    `SELECT id, user_id, daily_calories, daily_carbs, daily_protein, daily_fat, created_at, updated_at
     FROM user_goals
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
    conn
  );
  return mapGoal(rows[0]);
}

async function createDefault(userId, conn = null) {
  await db.query(
    `INSERT IGNORE INTO user_goals (user_id, daily_calories, daily_carbs, daily_protein, daily_fat)
     VALUES (?, 2000.00, 250.00, 150.00, 65.00)`,
    [userId],
    conn
  );
  return findByUserId(userId, conn);
}

async function upsertByUserId(userId, { dailyCalories, dailyCarbs, dailyProtein, dailyFat }) {
  await db.query(
    `INSERT INTO user_goals (user_id, daily_calories, daily_carbs, daily_protein, daily_fat)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       daily_calories = VALUES(daily_calories),
       daily_carbs = VALUES(daily_carbs),
       daily_protein = VALUES(daily_protein),
       daily_fat = VALUES(daily_fat)`,
    [userId, dailyCalories, dailyCarbs, dailyProtein, dailyFat]
  );
  return findByUserId(userId);
}

module.exports = {
  mapGoal,
  findByUserId,
  createDefault,
  upsertByUserId,
};
