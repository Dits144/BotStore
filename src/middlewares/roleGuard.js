const { isBotOwner, isGroupAdmin } = require('../services/roleService');

async function canManageCatalogue(sock, groupId, senderJid) {
  if (isBotOwner(senderJid)) return true;
  return isGroupAdmin(sock, groupId, senderJid);
}

module.exports = { canManageCatalogue };
