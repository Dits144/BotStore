const { isAllowedCatalogueManager } = require('../services/roleService');

async function canManageCatalogue(sock, groupId, senderJid) {
  return isAllowedCatalogueManager(sock, groupId, senderJid);
}

module.exports = { canManageCatalogue };
