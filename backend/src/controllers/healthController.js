const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getHealth = asyncHandler(async (req, res) => {
  const database = await db.checkHealth();
  const isHealthy = database.connected && database.schemaReady;
  const httpStatus = database.connected ? (database.schemaReady ? 200 : 503) : 503;

  res.status(httpStatus).json({
    status: isHealthy ? 'ok' : database.connected ? 'schema_incomplete' : 'error',
    service: 'nutrition-tracker-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database,
  });
});

module.exports = {
  getHealth,
};
