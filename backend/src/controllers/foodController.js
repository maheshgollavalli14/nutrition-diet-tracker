const foodService = require('../services/foodService');
const asyncHandler = require('../utils/asyncHandler');

const listFoods = asyncHandler(async (req, res) => {
  const items = await foodService.listFoods(req.user.id, {
    q: req.query.q || '',
    filter: req.query.filter || 'all',
    limit: req.query.limit ? Number(req.query.limit) : 200,
  });

  res.status(200).json({
    count: items.length,
    items,
  });
});

const getFoodById = asyncHandler(async (req, res) => {
  const food = await foodService.getFoodById(req.user.id, req.params.id);
  res.status(200).json({ food });
});

const createFood = asyncHandler(async (req, res) => {
  const food = await foodService.createCustomFood(req.user.id, req.body);
  res.status(201).json({
    message: 'Custom food added to your catalog.',
    food,
  });
});

module.exports = {
  listFoods,
  getFoodById,
  createFood,
};
