const ownerRepository = require('../repositories/ownerRepository');

async function isBotOwner(jid) {
  return ownerRepository.isOwner(jid);
}

async function isGroupAdmin(sock, groupId, userJid) {
  try {
    const meta = await sock.groupMetadata(groupId);
    const participant = (meta.participants || []).find((p) => p.id === userJid);
    return Boolean(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));
  } catch (error) {
    return false;
  }
}

module.exports = { isBotOwner, isGroupAdmin };
