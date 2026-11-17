const { AppError } = require('../utils/errors');
const { classifyDbError } = require('../config/db');
const env = require('../config/env');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} was not found.`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Malformed JSON request body.',
    });
  }

  if (err && (err.sqlState || err.errno || ['ECONNREFUSED', 'ETIMEDOUT', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(err.code))) {
    const dbInfo = classifyDbError(err);
    console.error('[DB Error]', dbInfo.code, dbInfo.errno || '');
    return res.status(503).json({
      error: dbInfo.code,
      message: dbInfo.hint,
    });
  }

  console.error('[Unhandled Error]', env.nodeEnv === 'development' ? err : err?.message);

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected server error occurred.',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
