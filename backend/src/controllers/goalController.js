const goalService = require('../services/goalService');
const asyncHandler = require('../utils/asyncHandler');

const getGoals = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoals(req.user.id);
  res.status(200).json({ goal });
});

const updateGoals = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoals(req.user.id, req.body);
  res.status(200).json({
    message: 'Nutrition goals saved.',
    goal,
  });
});

module.exports = {
  getGoals,
  updateGoals,
};
