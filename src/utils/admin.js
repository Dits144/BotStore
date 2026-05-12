const logger = require('../config/logger');
const { normalizeJid } = require('./jid');

async function isBotGroupAdmin(sock, groupId) {
  const botJid = sock?.user?.id || '';
  const normalizedBotJid = normalizeJid(botJid);
  try {
    if (!groupId || !groupId.endsWith('@g.us')) {
      logger.debug({ groupId }, '[isBotGroupAdmin] invalid or non-group JID');
      return false;
    }
    const meta = await sock.groupMetadata(groupId);
    const participants = meta.participants || [];
    const me = participants.find((p) => normalizeJid(p.id) === normalizedBotJid);
    const detectedBotAdmin = Boolean(me && (me.admin === 'admin' || me.admin === 'superadmin'));

    const adminList = participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => ({ id: p.id, normalized: normalizeJid(p.id), role: p.admin }));

    logger.info({
      botJid,
      normalizedBotJid,
      groupId,
      participantCount: participants.length,
      participantAdminList: adminList,
      detectedBotAdmin,
      meParticipant: me ? { id: me.id, normalized: normalizeJid(me.id), role: me.admin } : null
    }, '[isBotGroupAdmin] bot group admin check result');

    return detectedBotAdmin;
  } catch (error) {
    logger.error({
      err: error,
      botJid,
      normalizedBotJid,
      groupId
    }, '[isBotGroupAdmin] check failed');
    return false;
  }
}

async function deleteMessageForEveryone(sock, msg) {
  try {
    const groupId = String(msg?.key?.remoteJid || '');
    if (!groupId.endsWith('@g.us')) return false;

    const isAdmin = await isBotGroupAdmin(sock, groupId);
    if (!isAdmin) {
      logger.warn({ groupId }, 'bot bukan admin grup, skip hapus command');
      return false;
    }

    await sock.sendMessage(groupId, { delete: msg.key });
    logger.info({ groupId, messageId: msg?.key?.id || '', participant: msg?.key?.participant || '' }, 'delete as admin success');
    return true;
  } catch (error) {
    logger.warn({ err: error, groupId: String(msg?.key?.remoteJid || ''), messageId: msg?.key?.id || '' }, 'delete as admin failed');
    return false;
  }
}

module.exports = { isBotGroupAdmin, deleteMessageForEveryone, deleteCommandMessage: deleteMessageForEveryone };
