const ownerRepository = require('../repositories/ownerRepository');
const config = require('../config/env');
const logger = require('../config/logger');
const { normalizeUserJid, normalizeGroupJid } = require('../utils/jid');

function isPrimaryOwner(jid) {
  const normalized = normalizeUserJid(jid);
  const mainOwner = normalizeUserJid(config.mainOwnerJid);
  return Boolean(normalized && normalized === mainOwner);
}

async function isBotOwner(jid) {
  const normalized = normalizeUserJid(jid);
  if (!normalized) return false;
  if (isPrimaryOwner(normalized)) return true;
  return ownerRepository.isOwner(normalized);
}

async function isGroupAdmin(sock, groupId, userJid, metadata = null) {
  try {
    const normalizedGroup = normalizeGroupJid(groupId);
    const normalizedUser = normalizeUserJid(userJid);
    const meta = metadata || await sock.groupMetadata(normalizedGroup);

    const participant = (meta.participants || []).find((p) => normalizeUserJid(p.id) === normalizedUser);
    return Boolean(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));
  } catch (error) {
    logger.debug({ err: error, groupId, userJid }, 'isGroupAdmin check failed');
    return false;
  }
}

async function isAllowedCatalogueManager(sock, groupId, userJid, metadata = null) {
  if (await isBotOwner(userJid)) return true;
  return isGroupAdmin(sock, groupId, userJid, metadata);
}

async function getUserRole({ sock, chatJid, groupId, senderJid, isGroup, metadata = null }) {
  const owner = await isBotOwner(senderJid);
  if (owner) return 'bot_owner';

  const gid = groupId || chatJid;
  if (isGroup && await isGroupAdmin(sock, gid, senderJid, metadata)) return 'group_admin';
  return 'user';
}

module.exports = { isPrimaryOwner, isBotOwner, isGroupAdmin, isAllowedCatalogueManager, getUserRole };
