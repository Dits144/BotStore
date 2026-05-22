const migrate = require('./src/database/migrate');
const logger = require('./src/config/logger');
const { startWhatsApp, validateRuntime, getSock } = require('./src/services/whatsappService');
const { startRentalScheduler } = require('./src/services/schedulerService');

async function bootstrap() {
  try {
    validateRuntime();
    await migrate();
    await startWhatsApp();
    
    // Start Web Dashboard API Server
    const { startServer } = require('./src/api/server');
    startServer(3010);

    // Start rental scheduler with getSock function for sending warnings
    startRentalScheduler(getSock);
  } catch (error) {
    logger.error({ err: error }, 'fatal: gagal start bot');
    process.exit(1);
  }
}

bootstrap();
