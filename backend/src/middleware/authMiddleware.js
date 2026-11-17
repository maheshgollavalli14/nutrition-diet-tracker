const authService = require('../services/authService');
const { UnauthorizedError } = require('../utils/errors');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header.');
    }

    const token = authHeader.slice(7).trim();
    const user = await authService.verifyTokenAndLoadUser(token);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth,
};
