const { body } = require('express-validator');

const createFoodRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Food name is required.')
    .isLength({ max: 200 })
    .withMessage('Food name cannot exceed 200 characters.'),
  body('barcode')
    .optional({ nullable: true, values: 'falsy' })
    .trim()
    .matches(/^[A-Za-z0-9_-]{3,100}$/)
    .withMessage('Barcode must be 3 to 100 alphanumeric characters.'),
  body('nutritionBasis')
    .optional()
    .isIn(['PER_100G', 'PER_SERVING'])
    .withMessage('Nutrition basis must be PER_100G or PER_SERVING.'),
  body('servingSize')
    .optional()
    .isFloat({ gt: 0, max: 10000 })
    .withMessage('Serving size must be greater than 0.'),
  body('servingUnit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Serving unit must be 1 to 50 characters.'),
  body('calories')
    .notEmpty()
    .withMessage('Calories are required.')
    .isFloat({ min: 0, max: 20000 })
    .withMessage('Calories must be zero or positive.'),
  body('carbohydrates').optional().isFloat({ min: 0, max: 5000 }).withMessage('Carbohydrates cannot be negative.'),
  body('protein').optional().isFloat({ min: 0, max: 5000 }).withMessage('Protein cannot be negative.'),
  body('fat').optional().isFloat({ min: 0, max: 5000 }).withMessage('Fat cannot be negative.'),
  body('fiber').optional().isFloat({ min: 0, max: 5000 }).withMessage('Fiber cannot be negative.'),
  body('sugar').optional().isFloat({ min: 0, max: 5000 }).withMessage('Sugar cannot be negative.'),
];

module.exports = {
  createFoodRules,
};
