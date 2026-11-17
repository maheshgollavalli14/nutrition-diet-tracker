const { body } = require('express-validator');

const updateGoalsRules = [
  body('dailyCalories')
    .notEmpty()
    .withMessage('Daily calorie goal is required.')
    .isFloat({ min: 200, max: 10000 })
    .withMessage('Daily calories must be between 200 and 10,000 kcal.'),
  body('dailyCarbs')
    .notEmpty()
    .withMessage('Daily carbohydrates goal is required.')
    .isFloat({ min: 0, max: 2000 })
    .withMessage('Daily carbohydrates must be between 0 and 2,000 g.'),
  body('dailyProtein')
    .notEmpty()
    .withMessage('Daily protein goal is required.')
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Daily protein must be between 0 and 1,000 g.'),
  body('dailyFat')
    .notEmpty()
    .withMessage('Daily fat goal is required.')
    .isFloat({ min: 0, max: 500 })
    .withMessage('Daily fat must be between 0 and 500 g.'),
];

module.exports = {
  updateGoalsRules,
};
