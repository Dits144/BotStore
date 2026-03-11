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

async function deleteCommandMessage(sock, msg) {
  try {
    const groupId = String(msg?.key?.remoteJid || '');
    if (!groupId.endsWith('@g.us')) return false;
    if (!(await isBotGroupAdmin(sock, groupId))) return false;

    await sock.sendMessage(groupId, { delete: msg.key });
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'gagal menghapus pesan command');
    return false;
  }
}

module.exports = { isBotGroupAdmin, deleteCommandMessage };
