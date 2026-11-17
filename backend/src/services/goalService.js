const goalModel = require('../models/goalModel');
const { ValidationError } = require('../utils/errors');
const { round2 } = require('../utils/nutritionCalculator');

async function getGoals(userId) {
  let goal = await goalModel.findByUserId(userId);
  if (!goal) {
    goal = await goalModel.createDefault(userId);
  }
  return goal;
}

async function updateGoals(userId, payload) {
  const dailyCalories = Number(payload.dailyCalories);
  const dailyCarbs = Number(payload.dailyCarbs);
  const dailyProtein = Number(payload.dailyProtein);
  const dailyFat = Number(payload.dailyFat);

  if (!Number.isFinite(dailyCalories) || dailyCalories < 200 || dailyCalories > 10000) {
    throw new ValidationError('Daily calorie goal must be between 200 and 10,000 kcal.');
  }
  if (!Number.isFinite(dailyCarbs) || dailyCarbs < 0 || dailyCarbs > 2000) {
    throw new ValidationError('Daily carbohydrate goal must be between 0 and 2,000 g.');
  }
  if (!Number.isFinite(dailyProtein) || dailyProtein < 0 || dailyProtein > 1000) {
    throw new ValidationError('Daily protein goal must be between 0 and 1,000 g.');
  }
  if (!Number.isFinite(dailyFat) || dailyFat < 0 || dailyFat > 500) {
    throw new ValidationError('Daily fat goal must be between 0 and 500 g.');
  }

  return goalModel.upsertByUserId(userId, {
    dailyCalories: round2(dailyCalories),
    dailyCarbs: round2(dailyCarbs),
    dailyProtein: round2(dailyProtein),
    dailyFat: round2(dailyFat),
  });
}

module.exports = {
  getGoals,
  updateGoals,
};
