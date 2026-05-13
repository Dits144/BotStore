const { isGroupRentalActive } = require('../services/rentalService');
const logger = require('../config/logger');

async function canRunGroupCommand({ isGroup, isOwner, groupId }) {
  if (!isGroup) return true;
  const active = await isGroupRentalActive(groupId);
  if (!active) {
    logger.info({ groupId, isOwner }, '[rentalGuard] command blocked: rental expired or not found');
  }
  return active;
}

module.exports = { canRunGroupCommand };
