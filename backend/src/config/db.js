const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4',
  decimalNumbers: true,
});

async function query(sql, params = [], conn = null) {
  const executor = conn && typeof conn.release === 'function' ? conn : pool;
  const [rows] = await executor.query(sql, params);
  return rows;
}

async function execute(sql, params = [], conn = null) {
  const executor = conn && typeof conn.release === 'function' ? conn : pool;
  const [rows] = await executor.execute(sql, params);
  return rows;
}

async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {
      // Ignore rollback failures so original error surfaces
    }
    throw err;
  } finally {
    conn.release();
  }
}

function classifyDbError(err) {
  if (!err) {
    return { code: 'UNKNOWN', hint: 'Unknown database error.' };
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.errno === 1045) {
    return {
      code: 'ER_ACCESS_DENIED_ERROR',
      errno: 1045,
      sqlState: err.sqlState || '28000',
      hint:
        'MySQL rejected authentication for the configured user. Set the valid DB_PASSWORD in backend/.env without hardcoding it in source files.',
    };
  }

  if (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049) {
    return {
      code: 'ER_BAD_DB_ERROR',
      errno: 1049,
      sqlState: err.sqlState || '42000',
      hint: `Database "${env.db.database}" was not found. Execute database/schema.sql first.`,
    };
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return {
      code: err.code,
      hint: `Cannot reach MySQL server at ${env.db.host}:${env.db.port}. Verify the MySQL service is running on port ${env.db.port}.`,
    };
  }

  return {
    code: err.code || 'DB_ERROR',
    errno: err.errno || null,
    sqlState: err.sqlState || null,
    hint: 'Database connection check failed. Verify backend/.env database settings and MySQL service health.',
  };
}

async function checkHealth() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.ping();

    const [[versionRow]] = await conn.query('SELECT VERSION() AS version, DATABASE() AS activeDatabase');
    const [tableRows] = await conn.query(
      `SELECT table_name AS tableName
       FROM information_schema.tables
       WHERE table_schema = ?
       ORDER BY table_name ASC`,
      [env.db.database]
    );

    const existingTables = tableRows.map((row) => row.tableName);
    const requiredTables = ['users', 'user_goals', 'food_catalog', 'food_logs'];
    const missingTables = requiredTables.filter((tbl) => !existingTables.includes(tbl));

    return {
      connected: true,
      host: env.db.host,
      port: env.db.port,
      database: versionRow.activeDatabase || env.db.database,
      user: env.db.user,
      version: versionRow.version,
      schemaReady: missingTables.length === 0,
      tables: existingTables,
      missingTables,
    };
  } catch (err) {
    const info = classifyDbError(err);
    return {
      connected: false,
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      schemaReady: false,
      error: info,
    };
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function initSchema() {
  const health = await checkHealth();
  if (health.connected && !health.schemaReady) {
    console.log(`Missing database tables: ${health.missingTables.join(', ')}. Initializing schema...`);
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const statements = sql
        .split(/;\s*[\r\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use ') && !s.toLowerCase().startsWith('create database'));

      const conn = await pool.getConnection();
      try {
        for (const stmt of statements) {
          if (stmt.trim()) {
            await conn.query(stmt);
          }
        }
        console.log('Database schema and catalog seed initialized successfully.');
      } catch (initErr) {
        console.warn('Auto-schema initialization encountered warning/error:', initErr.message);
      } finally {
        conn.release();
      }
    }
  }
}

module.exports = {
  pool,
  query,
  execute,
  withTransaction,
  checkHealth,
  initSchema,
  classifyDbError,
};
