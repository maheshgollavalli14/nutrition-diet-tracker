const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const userModel = require('../models/userModel');
const goalModel = require('../models/goalModel');
const { normalizeTimeZone } = require('../utils/dateUtils');
const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} = require('../utils/errors');

const BCRYPT_ROUNDS = 10;

function ensureJwtSecret() {
  if (!env.jwt.secret || env.jwt.secret.trim().length < 16) {
    throw new AppError(
      'JWT_SECRET is not properly configured on the server.',
      500,
      'CONFIG_ERROR'
    );
  }
  return env.jwt.secret;
}

function signToken(user) {
  const secret = ensureJwtSecret();
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
    },
    secret,
    {
      expiresIn: env.jwt.expiresIn || '24h',
    }
  );
}

async function register({ fullName, email, password, confirmPassword, timezone = 'UTC' }) {
  if (password !== confirmPassword) {
    throw new ValidationError('Password and confirm password do not match.');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedName = String(fullName || '').trim();
  const validTimezone = normalizeTimeZone(timezone || 'UTC');

  if (!normalizedName) {
    throw new ValidationError('Full name is required.');
  }
  if (!normalizedEmail) {
    throw new ValidationError('Email address is required.');
  }

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    throw new ConflictError('An account with this email address already exists.', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await db.withTransaction(async (conn) => {
      const created = await userModel.create(
        {
          email: normalizedEmail,
          passwordHash,
          fullName: normalizedName,
          timezone: validTimezone,
        },
        conn
      );
      await goalModel.createDefault(created.id, conn);
      return created;
    });

    const token = signToken(user);
    return {
      token,
      user: userModel.toSafeUser(user),
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      throw new ConflictError('An account with this email address already exists.', 'EMAIL_EXISTS');
    }
    throw err;
  }
}

async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new ValidationError('Email and password are required.');
  }

  const user = await userModel.findByEmail(normalizedEmail);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  await goalModel.createDefault(user.id);
  const token = signToken(user);

  return {
    token,
    user: userModel.toSafeUser(user),
  };
}

async function verifyTokenAndLoadUser(token) {
  if (!token) {
    throw new UnauthorizedError('Authentication token is required.');
  }

  const secret = ensureJwtSecret();
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token.');
  }

  const userId = Number(decoded.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedError('Invalid authentication token subject.');
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new UnauthorizedError('Authenticated user no longer exists.');
  }

  return userModel.toSafeUser(user);
}

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User profile not found.');
  }
  return userModel.toSafeUser(user);
}

async function updateProfile(userId, { fullName, timezone }) {
  const existing = await userModel.findById(userId);
  if (!existing) {
    throw new NotFoundError('User profile not found.');
  }

  const nextName = typeof fullName === 'string' && fullName.trim() ? fullName.trim() : existing.fullName;
  const nextTz = timezone !== undefined ? normalizeTimeZone(timezone) : existing.timezone;

  const updated = await userModel.updateProfile(userId, {
    fullName: nextName,
    timezone: nextTz,
  });
  return userModel.toSafeUser(updated);
}

module.exports = {
  BCRYPT_ROUNDS,
  signToken,
  register,
  login,
  verifyTokenAndLoadUser,
  getProfile,
  updateProfile,
};
