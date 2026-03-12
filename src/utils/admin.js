const logger = require('../config/logger');
const { normalizeJid } = require('./jid');

async function isBotGroupAdmin(sock, groupId) {
  try {
    if (!groupId.endsWith('@g.us')) return false;
    const meta = await sock.groupMetadata(groupId);
    const myJid = normalizeJid(sock.user?.id || '');
    const me = (meta.participants || []).find((p) => normalizeJid(p.id) === myJid);
    return Boolean(me && (me.admin === 'admin' || me.admin === 'superadmin'));
  } catch {
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

    const key = { ...msg.key };
    await sock.sendMessage(groupId, { delete: key });
    logger.info({ groupId, messageId: key.id, participant: key.participant || '' }, 'delete as admin success');
    return true;
  } catch (error) {
    logger.warn({ err: error, groupId: String(msg?.key?.remoteJid || ''), messageId: msg?.key?.id || '' }, 'delete as admin failed');
    return false;
  }
}

module.exports = { isBotGroupAdmin, deleteMessageForEveryone, deleteCommandMessage: deleteMessageForEveryone };
