const ownerRepository = require('../repositories/ownerRepository');
const config = require('../config/env');
const logger = require('../config/logger');
const { normalizeJid } = require('../utils/jid');

function isPrimaryOwner(jid) {
  const normalized = normalizeJid(jid);
  return normalized && normalized === normalizeJid(config.mainOwnerJid);
}

async function isBotOwner(jid) {
  const normalized = normalizeJid(jid);
  if (!normalized) return false;
  if (isPrimaryOwner(normalized)) return true;
  return ownerRepository.isOwner(normalized);
}

async function isGroupAdmin(sock, groupId, userJid, metadata = null) {
  try {
    const meta = metadata || await sock.groupMetadata(groupId);
    const normalizedUser = normalizeJid(userJid);
    const participant = (meta.participants || []).find((p) => normalizeJid(p.id) === normalizedUser);
    return Boolean(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));
  } catch (error) {
    logger.debug({ err: error, groupId, userJid }, 'gagal mengecek admin grup');
    return false;
  }
}

async function isAllowedCatalogueManager(sock, groupId, userJid, metadata = null) {
  if (await isBotOwner(userJid)) return true;
  return isGroupAdmin(sock, groupId, userJid, metadata);
}

async function getUserRole({ sock, groupId, senderJid, isGroup, metadata = null }) {
  const owner = await isBotOwner(senderJid);
  if (owner) return 'bot_owner';
  if (isGroup && await isGroupAdmin(sock, groupId, senderJid, metadata)) return 'group_admin';
  return 'user';
}

module.exports = { isPrimaryOwner, isBotOwner, isGroupAdmin, isAllowedCatalogueManager, getUserRole };
