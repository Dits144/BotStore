const config = require('../config/env');
const { refreshRentalStatus } = require('./rentalService');
const logger = require('../config/logger');

function startRentalScheduler() {
  refreshRentalStatus();
  setInterval(() => {
    try {
      refreshRentalStatus();
    } catch (error) {
      logger.error({ err: error }, 'gagal refresh status sewa');
    }
  }, Math.max(10, config.rentalRefreshSeconds) * 1000);
}

module.exports = { startRentalScheduler };
