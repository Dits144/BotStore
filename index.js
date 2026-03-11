const migrate = require('./src/database/migrate');
const logger = require('./src/config/logger');
const { startWhatsApp } = require('./src/services/whatsappService');
const { startRentalScheduler } = require('./src/services/schedulerService');

async function bootstrap() {
  try {
    await migrate();
    startRentalScheduler();
    await startWhatsApp();
  } catch (error) {
    logger.error({ err: error }, 'fatal: gagal start bot');
    process.exit(1);
  }
}

bootstrap();
