const foodModel = require('../models/foodModel');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { round2 } = require('../utils/nutritionCalculator');

async function listFoods(userId, { q = '', filter = 'all', limit = 200 } = {}) {
  return foodModel.findAllVisible(userId, { q, filter, limit });
}

async function getFoodById(userId, foodId) {
  const id = Number(foodId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid food ID.');
  }

  const food = await foodModel.findByIdVisible(id, userId);
  if (!food) {
    throw new NotFoundError('Food item not found.');
  }
  return food;
}

async function createCustomFood(userId, payload) {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new ValidationError('Food name is required.');
  }

  const nutritionBasis = payload.nutritionBasis === 'PER_SERVING' ? 'PER_SERVING' : 'PER_100G';
  const servingUnit = String(payload.servingUnit || (nutritionBasis === 'PER_SERVING' ? 'serving' : 'g')).trim() || 'g';
  const servingSize = Number(payload.servingSize ?? (nutritionBasis === 'PER_SERVING' ? 1 : 100));

  if (!Number.isFinite(servingSize) || servingSize <= 0) {
    throw new ValidationError('Serving size must be greater than zero.');
  }

  return foodModel.createCustom(userId, {
    name,
    barcode: payload.barcode ? String(payload.barcode).trim() : null,
    servingUnit,
    nutritionBasis,
    servingSize: round2(servingSize),
    calories: round2(payload.calories),
    carbohydrates: round2(payload.carbohydrates ?? 0),
    protein: round2(payload.protein ?? 0),
    fat: round2(payload.fat ?? 0),
    fiber: round2(payload.fiber ?? 0),
    sugar: round2(payload.sugar ?? 0),
  });
}

module.exports = {
  listFoods,
  getFoodById,
  createCustomFood,
};
