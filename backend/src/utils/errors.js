class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'A conflicting record already exists.', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

class DailyLimitExceededError extends ConflictError {
  constructor(message = 'Daily logging limit reached for this food.') {
    super(message, 'DAILY_LIMIT_EXCEEDED');
  }
}

class BadGatewayError extends AppError {
  constructor(message = 'Upstream nutrition service request failed.') {
    super(message, 502, 'UPSTREAM_ERROR');
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable.', details = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DailyLimitExceededError,
  BadGatewayError,
  ServiceUnavailableError,
};
