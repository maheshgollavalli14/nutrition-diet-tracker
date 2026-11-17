const app = require('./src/app');
const env = require('./src/config/env');
const db = require('./src/config/db');

const server = app.listen(env.port, async () => {
  console.log(`Nutrition & Diet Tracker API listening on http://localhost:${env.port}`);
  const dbStatus = await db.checkHealth();
  if (dbStatus.connected) {
    console.log(
      `MySQL connected (${dbStatus.host}:${dbStatus.port}/${dbStatus.database}, MySQL ${dbStatus.version}, schemaReady=${dbStatus.schemaReady})`
    );
  } else {
    console.warn(
      `MySQL check failed at startup (${dbStatus.host}:${dbStatus.port}/${dbStatus.database}): ${dbStatus.error?.code || 'UNKNOWN'} - ${dbStatus.error?.hint || ''}`
    );
  }
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down API server...`);
  server.close(async () => {
    try {
      await db.pool.end();
    } catch (_) {
      // Ignore pool shutdown error
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
