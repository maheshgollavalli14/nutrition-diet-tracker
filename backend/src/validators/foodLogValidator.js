const { body, param } = require('express-validator');

const logPayloadRules = [
  body('consumedQuantity')
    .notEmpty()
    .withMessage('Consumed quantity is required.')
    .isFloat({ gt: 0, max: 50000 })
    .withMessage('Consumed quantity must be greater than zero.'),
  body('foodId')
    .optional({ nullable: true, values: 'falsy' })
    .isInt({ gt: 0 })
    .withMessage('foodId must be a positive integer.'),
  body('foodName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Food name cannot exceed 200 characters.'),
  body('calories')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Calories cannot be negative.'),
  body('carbohydrates').optional().isFloat({ min: 0, max: 10000 }).withMessage('Carbohydrates cannot be negative.'),
  body('protein').optional().isFloat({ min: 0, max: 10000 }).withMessage('Protein cannot be negative.'),
  body('fat').optional().isFloat({ min: 0, max: 10000 }).withMessage('Fat cannot be negative.'),
  body('fiber').optional().isFloat({ min: 0, max: 10000 }).withMessage('Fiber cannot be negative.'),
  body('sugar').optional().isFloat({ min: 0, max: 10000 }).withMessage('Sugar cannot be negative.'),
  body('loggedAt')
    .optional({ nullable: true, values: 'falsy' })
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO-8601 timestamp.'),
  body().custom((payload) => {
    const hasFoodId = payload.foodId !== undefined && payload.foodId !== null && payload.foodId !== '';
    if (!hasFoodId) {
      if (!payload.foodName || !String(payload.foodName).trim()) {
        throw new Error('Food name is required for manual food entry.');
      }
      if (payload.calories === undefined || payload.calories === null || payload.calories === '') {
        throw new Error('Calories are required for manual food entry.');
      }
    }
    return true;
  }),
];

const updateLogRules = [
  param('id').isInt({ gt: 0 }).withMessage('Invalid food log ID.'),
  body('consumedQuantity')
    .optional()
    .isFloat({ gt: 0, max: 50000 })
    .withMessage('Consumed quantity must be greater than zero.'),
  body('foodName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Food name cannot be empty.')
    .isLength({ max: 200 }),
  body('calories').optional().isFloat({ min: 0, max: 50000 }).withMessage('Calories cannot be negative.'),
  body('carbohydrates').optional().isFloat({ min: 0, max: 10000 }),
  body('protein').optional().isFloat({ min: 0, max: 10000 }),
  body('fat').optional().isFloat({ min: 0, max: 10000 }),
  body('fiber').optional().isFloat({ min: 0, max: 10000 }),
  body('sugar').optional().isFloat({ min: 0, max: 10000 }),
  body('loggedAt')
    .optional({ nullable: true, values: 'falsy' })
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO-8601 timestamp.'),
];

module.exports = {
  logPayloadRules,
  updateLogRules,
};
