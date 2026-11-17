const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true }).map((err) => ({
    field: err.path || err.param || 'body',
    message: err.msg,
  }));

  return next(new ValidationError(errors[0].message, errors));
}

module.exports = validateRequest;
