const migrate = require('./src/database/migrate');
const logger = require('./src/config/logger');
const { startWhatsApp, validateRuntime } = require('./src/services/whatsappService');
const { startRentalScheduler } = require('./src/services/schedulerService');

async function bootstrap() {
  try {
    validateRuntime();
    await migrate();
    startRentalScheduler();
    await startWhatsApp();
  } catch (error) {
    logger.error({ err: error }, 'fatal: gagal start bot');
    process.exit(1);
  }
}

bootstrap();
