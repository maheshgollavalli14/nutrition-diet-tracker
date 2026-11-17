const db = require('../config/db');
const { toIsoUtcString } = require('../utils/dateUtils');

function mapFoodLog(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    foodId: row.food_id ? Number(row.food_id) : null,
    foodName: row.food_name,
    consumedQuantity: Number(row.consumed_quantity),
    servingUnit: row.serving_unit,
    calories: Number(row.calories),
    carbohydrates: Number(row.carbohydrates),
    protein: Number(row.protein),
    fat: Number(row.fat),
    fiber: Number(row.fiber),
    sugar: Number(row.sugar),
    loggedAt: toIsoUtcString(row.logged_at),
    createdAt: toIsoUtcString(row.created_at),
  };
}

async function lockUserForLogging(userId, conn) {
  await db.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId], conn);
}

async function countByUserAndFoodInRange(userId, foodId, startUtcMysql, endUtcMysql, excludeLogId = null, conn = null) {
  const sql = excludeLogId
    ? `SELECT COUNT(*) AS cnt
       FROM food_logs
       WHERE user_id = ? AND food_id = ? AND logged_at >= ? AND logged_at < ? AND id <> ?`
    : `SELECT COUNT(*) AS cnt
       FROM food_logs
       WHERE user_id = ? AND food_id = ? AND logged_at >= ? AND logged_at < ?`;
  const params = excludeLogId
    ? [userId, foodId, startUtcMysql, endUtcMysql, excludeLogId]
    : [userId, foodId, startUtcMysql, endUtcMysql];
  const rows = await db.query(sql, params, conn);
  return Number(rows[0].cnt || 0);
}

async function existsByUserAndLoggedAt(userId, loggedAtMysql, excludeLogId = null, conn = null) {
  const sql = excludeLogId
    ? `SELECT 1 AS found FROM food_logs WHERE user_id = ? AND logged_at = ? AND id <> ? LIMIT 1`
    : `SELECT 1 AS found FROM food_logs WHERE user_id = ? AND logged_at = ? LIMIT 1`;
  const params = excludeLogId ? [userId, loggedAtMysql, excludeLogId] : [userId, loggedAtMysql];
  const rows = await db.query(sql, params, conn);
  return rows.length > 0;
}

async function create(userId, log, conn = null) {
  const result = await db.query(
    `INSERT INTO food_logs (
       user_id, food_id, food_name, consumed_quantity, serving_unit,
       calories, carbohydrates, protein, fat, fiber, sugar, logged_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      log.foodId || null,
      log.foodName,
      log.consumedQuantity,
      log.servingUnit,
      log.calories,
      log.carbohydrates,
      log.protein,
      log.fat,
      log.fiber,
      log.sugar,
      log.loggedAtMysql,
    ],
    conn
  );
  return findByIdAndUserId(result.insertId, userId, conn);
}

async function findByIdAndUserId(logId, userId, conn = null) {
  const rows = await db.query(
    `SELECT id, user_id, food_id, food_name, consumed_quantity, serving_unit,
            calories, carbohydrates, protein, fat, fiber, sugar, logged_at, created_at
     FROM food_logs
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [logId, userId],
    conn
  );
  return mapFoodLog(rows[0]);
}

async function findByUserIdInRange(userId, startUtcMysql, endUtcMysql, options = {}) {
  const order = options.order === 'ASC' ? 'ASC' : 'DESC';
  const params = [userId, startUtcMysql, endUtcMysql];
  let limitClause = '';

  if (options.limit !== undefined && options.limit !== null) {
    const safeLimit = Math.min(Math.max(Number(options.limit) || 50, 1), 1000);
    const safeOffset = Math.max(Number(options.offset) || 0, 0);
    limitClause = ' LIMIT ? OFFSET ?';
    params.push(safeLimit, safeOffset);
  }

  const rows = await db.query(
    `SELECT id, user_id, food_id, food_name, consumed_quantity, serving_unit,
            calories, carbohydrates, protein, fat, fiber, sugar, logged_at, created_at
     FROM food_logs
     WHERE user_id = ? AND logged_at >= ? AND logged_at < ?
     ORDER BY logged_at ${order}${limitClause}`,
    params
  );

  return rows.map(mapFoodLog);
}

async function countByUserIdInRange(userId, startUtcMysql, endUtcMysql) {
  const rows = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM food_logs
     WHERE user_id = ? AND logged_at >= ? AND logged_at < ?`,
    [userId, startUtcMysql, endUtcMysql]
  );
  return Number(rows[0].cnt || 0);
}

async function getTotalsByUserIdInRange(userId, startUtcMysql, endUtcMysql) {
  const rows = await db.query(
    `SELECT
       COUNT(*) AS log_count,
       COALESCE(SUM(calories), 0) AS calories,
       COALESCE(SUM(carbohydrates), 0) AS carbohydrates,
       COALESCE(SUM(protein), 0) AS protein,
       COALESCE(SUM(fat), 0) AS fat,
       COALESCE(SUM(fiber), 0) AS fiber,
       COALESCE(SUM(sugar), 0) AS sugar
     FROM food_logs
     WHERE user_id = ? AND logged_at >= ? AND logged_at < ?`,
    [userId, startUtcMysql, endUtcMysql]
  );
  const row = rows[0] || {};
  return {
    logCount: Number(row.log_count || 0),
    calories: Number(row.calories || 0),
    carbohydrates: Number(row.carbohydrates || 0),
    protein: Number(row.protein || 0),
    fat: Number(row.fat || 0),
    fiber: Number(row.fiber || 0),
    sugar: Number(row.sugar || 0),
  };
}

async function updateByIdAndUserId(logId, userId, fields, conn = null) {
  await db.query(
    `UPDATE food_logs
     SET food_name = ?,
         consumed_quantity = ?,
         serving_unit = ?,
         calories = ?,
         carbohydrates = ?,
         protein = ?,
         fat = ?,
         fiber = ?,
         sugar = ?,
         logged_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      fields.foodName,
      fields.consumedQuantity,
      fields.servingUnit,
      fields.calories,
      fields.carbohydrates,
      fields.protein,
      fields.fat,
      fields.fiber,
      fields.sugar,
      fields.loggedAtMysql,
      logId,
      userId,
    ],
    conn
  );
  return findByIdAndUserId(logId, userId, conn);
}

async function deleteByIdAndUserId(logId, userId) {
  const result = await db.query(
    `DELETE FROM food_logs
     WHERE id = ? AND user_id = ?`,
    [logId, userId]
  );
  return Number(result.affectedRows || 0) > 0;
}

module.exports = {
  mapFoodLog,
  lockUserForLogging,
  countByUserAndFoodInRange,
  existsByUserAndLoggedAt,
  create,
  findByIdAndUserId,
  findByUserIdInRange,
  countByUserIdInRange,
  getTotalsByUserIdInRange,
  updateByIdAndUserId,
  deleteByIdAndUserId,
};
