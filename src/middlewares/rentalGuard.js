const { isGroupRentalActive } = require('../services/rentalService');

async function canRunGroupCommand({ isGroup, isOwner, groupId }) {
  if (!isGroup) return true;
  if (isOwner) return true;
  return isGroupRentalActive(groupId);
}

module.exports = { canRunGroupCommand };
