const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

function parseDatabaseUrl(urlStr) {
  if (!urlStr) return null;
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname,
      port: Number.parseInt(parsed.port || '3306', 10),
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: (parsed.pathname || '').replace(/^\//, ''),
      ssl: parsed.searchParams.get('ssl') === 'true' || parsed.searchParams.get('sslmode') === 'require',
    };
  } catch {
    return null;
  }
}

const parsedDb = parseDatabaseUrl(process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.CLEARDB_DATABASE_URL);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '5000', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  openFoodFactsBaseUrl:
    process.env.OPEN_FOOD_FACTS_BASE_URL || 'https://world.openfoodfacts.org/api/v2/product/',
  db: {
    host: parsedDb?.host || process.env.DB_HOST || '127.0.0.1',
    port: parsedDb?.port || Number.parseInt(process.env.DB_PORT || '3307', 10),
    user: parsedDb?.user || process.env.DB_USER || 'root',
    password: parsedDb?.password ?? process.env.DB_PASSWORD ?? '',
    database: parsedDb?.database || process.env.DB_NAME || 'nutrition_tracker',
    ssl:
      process.env.DB_SSL === 'true' ||
      process.env.DB_SSL === '1' ||
      parsedDb?.ssl ||
      false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};

module.exports = env;
