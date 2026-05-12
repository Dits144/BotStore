const logger = require('../config/logger');
const { normalizeJid, getBotJids } = require('./jid');

async function getBotGroupAdminDiagnostics(sock, groupId) {
  const botJids = getBotJids(sock);
  const diagnostics = {
    botJid: sock?.user?.id || sock?.user?.jid || sock?.authState?.creds?.me?.id || '',
    normalizedBotJid: botJids.join(', '),
    groupId,
    error: null,
    participantCount: 0,
    meInParticipants: false,
    meAdminStatus: null,
    isAdmin: false,
    sampleParticipants: []
  };

  try {
    if (!groupId || !groupId.endsWith('@g.us')) {
      diagnostics.error = 'Invalid group JID';
      return diagnostics;
    }
    const meta = await sock.groupMetadata(groupId);
    const participants = meta.participants || [];
    diagnostics.participantCount = participants.length;
    
    const me = participants.find((p) => botJids.includes(normalizeJid(p.id)));
    if (me) {
      diagnostics.meInParticipants = true;
      diagnostics.meAdminStatus = me.admin;
      diagnostics.isAdmin = me.admin === 'admin' || me.admin === 'superadmin';
    } else {
      diagnostics.sampleParticipants = participants.slice(0, 3).map(p => p.id);
    }
  } catch (err) {
    diagnostics.error = err.message || String(err);
  }

  return diagnostics;
}

async function isBotGroupAdmin(sock, groupId) {
  const diag = await getBotGroupAdminDiagnostics(sock, groupId);
  return diag.isAdmin;
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

module.exports = { 
  isBotGroupAdmin, 
  getBotGroupAdminDiagnostics, 
  deleteMessageForEveryone, 
  deleteCommandMessage: deleteMessageForEveryone 
};
