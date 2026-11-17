const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function migrateTiDB() {
  const connStr = process.argv[2] || process.env.DATABASE_URL;
  if (!connStr) {
    console.error('Usage: node database/scripts/migrate_tidb.js "<TIDB_CONNECTION_URL>"');
    console.error('Example: node database/scripts/migrate_tidb.js "mysql://user:pass@gateway01.region.prod.aws.tidbcloud.com:4000/nutrition_tracker?ssl=true"');
    process.exit(1);
  }

  console.log('Connecting to TiDB Cloud instance...');
  const parsed = new URL(connStr);
  const pool = mysql.createPool({
    host: parsed.hostname,
    port: Number.parseInt(parsed.port || '4000', 10),
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database: (parsed.pathname || '').replace(/^\//, '') || 'nutrition_tracker',
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 5,
    decimalNumbers: true,
  });

  try {
    const conn = await pool.getConnection();
    console.log('Successfully connected to TiDB Cloud!');

    // Read schema.sql
    const schemaPath = path.resolve(__dirname, '../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    const statements = sql
      .split(/;\s*[\r\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use ') && !s.toLowerCase().startsWith('create database'));

    console.log(`Executing ${statements.length} schema migration statements...`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim()) {
        await conn.query(stmt);
      }
    }

    console.log('Verifying created tables in TiDB Cloud:');
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Existing tables:', tables);

    const [[catalogCount]] = await conn.query('SELECT COUNT(*) AS totalFoods FROM food_catalog');
    console.log(`Standard food catalog seeded: ${catalogCount.totalFoods} items ready.`);

    conn.release();
    await pool.end();
    console.log('TiDB Cloud migration completed successfully with 0 errors.');
  } catch (err) {
    console.error('TiDB Cloud migration error:', err.message);
    process.exit(1);
  }
}

migrateTiDB();
