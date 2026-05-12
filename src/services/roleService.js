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
  const normalizedGroup = normalizeGroupJid(groupId);
  const normalizedUser = normalizeUserJid(userJid);
  const botJid = sock?.user?.id || '';
  const normalizedBotJid = normalizeUserJid(botJid);

  try {
    const meta = metadata || await sock.groupMetadata(normalizedGroup);
    const participants = meta.participants || [];

    const participant = participants.find((p) => normalizeUserJid(p.id) === normalizedUser);
    const detectedSenderAdmin = Boolean(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));

    const meParticipant = participants.find((p) => normalizeUserJid(p.id) === normalizedBotJid);
    const detectedBotAdmin = Boolean(meParticipant && (meParticipant.admin === 'admin' || meParticipant.admin === 'superadmin'));

    const adminList = participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => ({ id: p.id, normalized: normalizeUserJid(p.id), role: p.admin }));

    logger.info({
      botJid,
      normalizedBotJid,
      groupId,
      normalizedGroup,
      userJid,
      normalizedUser,
      participantCount: participants.length,
      participantAdminList: adminList,
      detectedBotAdmin,
      detectedSenderAdmin,
      senderParticipant: participant ? { id: participant.id, normalized: normalizeUserJid(participant.id), role: participant.admin } : null,
      meParticipant: meParticipant ? { id: meParticipant.id, normalized: normalizeUserJid(meParticipant.id), role: meParticipant.admin } : null
    }, '[isGroupAdmin] sender and bot admin check result');

    return detectedSenderAdmin;
  } catch (error) {
    logger.error({
      err: error,
      botJid,
      normalizedBotJid,
      groupId,
      normalizedGroup,
      userJid,
      normalizedUser
    }, '[isGroupAdmin] check failed');
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
