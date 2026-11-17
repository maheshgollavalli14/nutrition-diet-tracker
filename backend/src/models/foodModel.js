const db = require('../config/db');
const { toIsoUtcString } = require('../utils/dateUtils');

function mapFood(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    barcode: row.barcode || null,
    servingUnit: row.serving_unit,
    nutritionBasis: row.nutrition_basis,
    servingSize: Number(row.serving_size),
    calories: Number(row.calories),
    carbohydrates: Number(row.carbohydrates),
    protein: Number(row.protein),
    fat: Number(row.fat),
    fiber: Number(row.fiber),
    sugar: Number(row.sugar),
    isCustom: Boolean(row.is_custom),
    createdByUserId: row.created_by_user_id ? Number(row.created_by_user_id) : null,
    createdAt: toIsoUtcString(row.created_at),
    updatedAt: toIsoUtcString(row.updated_at),
  };
}

async function findAllVisible(userId, { q = '', filter = 'all', limit = 200 } = {}) {
  const conditions = ['(is_custom = 0 OR created_by_user_id = ?)'];
  const params = [userId];

  if (filter === 'custom') {
    conditions.push('is_custom = 1 AND created_by_user_id = ?');
    params.push(userId);
  } else if (filter === 'reference' || filter === 'catalog') {
    conditions.push('is_custom = 0');
  }

  const trimmed = typeof q === 'string' ? q.trim() : '';
  if (trimmed) {
    conditions.push('(LOWER(name) LIKE LOWER(?) OR barcode = ?)');
    params.push(`%${trimmed}%`, trimmed);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
  params.push(safeLimit);

  const rows = await db.query(
    `SELECT id, name, barcode, serving_unit, nutrition_basis, serving_size,
            calories, carbohydrates, protein, fat, fiber, sugar,
            is_custom, created_by_user_id, created_at, updated_at
     FROM food_catalog
     WHERE ${conditions.join(' AND ')}
     ORDER BY is_custom DESC, name ASC
     LIMIT ?`,
    params
  );

  return rows.map(mapFood);
}

async function findByIdVisible(id, userId, conn = null) {
  const rows = await db.query(
    `SELECT id, name, barcode, serving_unit, nutrition_basis, serving_size,
            calories, carbohydrates, protein, fat, fiber, sugar,
            is_custom, created_by_user_id, created_at, updated_at
     FROM food_catalog
     WHERE id = ? AND (is_custom = 0 OR created_by_user_id = ?)
     LIMIT 1`,
    [id, userId],
    conn
  );
  return mapFood(rows[0]);
}

async function findByBarcodeVisible(barcode, userId) {
  const rows = await db.query(
    `SELECT id, name, barcode, serving_unit, nutrition_basis, serving_size,
            calories, carbohydrates, protein, fat, fiber, sugar,
            is_custom, created_by_user_id, created_at, updated_at
     FROM food_catalog
     WHERE barcode = ? AND (is_custom = 0 OR created_by_user_id = ?)
     ORDER BY is_custom ASC, id ASC
     LIMIT 1`,
    [barcode, userId]
  );
  return mapFood(rows[0]);
}

async function createCustom(userId, data, conn = null) {
  const result = await db.query(
    `INSERT INTO food_catalog (
       name, barcode, serving_unit, nutrition_basis, serving_size,
       calories, carbohydrates, protein, fat, fiber, sugar,
       is_custom, created_by_user_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      data.name,
      data.barcode || null,
      data.servingUnit || 'g',
      data.nutritionBasis || 'PER_100G',
      data.servingSize ?? 100,
      data.calories,
      data.carbohydrates ?? 0,
      data.protein ?? 0,
      data.fat ?? 0,
      data.fiber ?? 0,
      data.sugar ?? 0,
      userId,
    ],
    conn
  );
  return findByIdVisible(result.insertId, userId, conn);
}

module.exports = {
  mapFood,
  findAllVisible,
  findByIdVisible,
  findByBarcodeVisible,
  createCustom,
};
