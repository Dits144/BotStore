const logger = require('../config/logger');
const {
  reactLoading,
  reactSuccess,
  reactError,
  deleteForEveryone
} = require('./messageActions');

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
  deleteMessageForEveryone: deleteForEveryone,
  deleteForEveryone,
  sendMinimalSuccess,
  sendMinimalError
};
