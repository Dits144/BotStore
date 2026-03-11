const logger = require('../config/logger');
const { deleteMessageForEveryone } = require('./admin');

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
    const jid = String(msg?.key?.remoteJid || '');
    if (!jid) return false;
    await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
    return true;
  } catch (error) {
    logger.debug({ err: error }, 'gagal kirim reaction');
    return false;
  }
}

async function sendMinimalSuccess(sock, chatId, text = '✅ Berhasil.') {
  try {
    await sock.sendMessage(chatId, { text });
  } catch (error) {
    logger.warn({ err: error, chatId }, 'gagal kirim minimal success');
  }
}

async function sendMinimalError(sock, chatId, text = '❌ Terjadi kesalahan.') {
  try {
    await sock.sendMessage(chatId, { text });
  } catch (error) {
    logger.warn({ err: error, chatId }, 'gagal kirim minimal error');
  }
}

module.exports = {
  reactLoading,
  reactSuccess,
  reactError,
  deleteMessageForEveryone,
  sendMinimalSuccess,
  sendMinimalError
};
