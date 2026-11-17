const db = require('../config/db');
const { toIsoUtcString } = require('../utils/dateUtils');

function mapUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    timezone: row.timezone || 'UTC',
    createdAt: toIsoUtcString(row.created_at),
    updatedAt: toIsoUtcString(row.updated_at),
  };
}

function toSafeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findByEmail(email, conn = null) {
  const rows = await db.query(
    `SELECT id, email, password_hash, full_name, timezone, created_at, updated_at
     FROM users
     WHERE LOWER(email) = LOWER(?)
     LIMIT 1`,
    [email],
    conn
  );
  return mapUser(rows[0]);
}

async function findById(id, conn = null) {
  const rows = await db.query(
    `SELECT id, email, password_hash, full_name, timezone, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
    conn
  );
  return mapUser(rows[0]);
}

async function create({ email, passwordHash, fullName, timezone = 'UTC' }, conn = null) {
  const result = await db.query(
    `INSERT INTO users (email, password_hash, full_name, timezone)
     VALUES (?, ?, ?, ?)`,
    [email, passwordHash, fullName, timezone],
    conn
  );
  return findById(result.insertId, conn);
}

async function updateProfile(userId, { fullName, timezone }) {
  await db.query(
    `UPDATE users
     SET full_name = ?, timezone = ?
     WHERE id = ?`,
    [fullName, timezone, userId]
  );
  return findById(userId);
}

module.exports = {
  mapUser,
  toSafeUser,
  findByEmail,
  findById,
  create,
  updateProfile,
};
