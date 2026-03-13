const logger = require('../config/logger');
const { getChatJid } = require('./jid');
const { isBotGroupAdmin } = require('./admin');

async function sendText(sock, chatJid, text, options = {}) {
  return sock.sendMessage(chatJid, { text, ...options });
}

async function replyText(sock, chatJid, msg, text, options = {}) {
  return sock.sendMessage(chatJid, { text, ...options }, { quoted: msg });
}

async function sendMentionText(sock, chatJid, text, mentionJids = [], options = {}) {
  const mentions = [...new Set((mentionJids || []).filter(Boolean))];
  return sock.sendMessage(chatJid, { text, mentions, ...options });
}

async function reactLoading(sock, msg) {
  return react(sock, msg, '⏳');
}

async function reactSuccess(sock, msg) {
  return react(sock, msg, '✅');
}

async function reactError(sock, msg) {
  return react(sock, msg, '❌');
}

async function react(sock, msg, emoji) {
  try {
    const chatJid = getChatJid(msg);
    if (!chatJid) return false;
    await sock.sendMessage(chatJid, { react: { text: emoji, key: msg.key } });
    return true;
  } catch (err) {
    logger.debug({ err }, 'react failed');
    return false;
  }
}

async function deleteForEveryone(sock, msg) {
  try {
    const chatJid = getChatJid(msg);
    if (!chatJid.endsWith('@g.us')) return false;

    if (!(await isBotGroupAdmin(sock, chatJid))) {
      logger.warn({ chatJid }, 'deleteForEveryone skipped: bot is not group admin');
      return false;
    }

    await sock.sendMessage(chatJid, { delete: msg.key });
    logger.info({ chatJid, messageId: msg?.key?.id || '' }, 'deleteForEveryone success');
    return true;
  } catch (err) {
    logger.warn({ err, chatJid: msg?.key?.remoteJid || '' }, 'deleteForEveryone failed');
    return false;
  }
}

module.exports = {
  sendText,
  replyText,
  sendMentionText,
  reactLoading,
  reactSuccess,
  reactError,
  deleteForEveryone
};
