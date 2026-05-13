const logger = require('../config/logger');
const {
  reactLoading,
  reactSuccess,
  reactError,
  deleteForEveryone
} = require('./messageActions');
const { sans } = require('./styledText');

async function sendMinimalSuccess(sock, chatId, text = `✅ ${sans('Berhasil.')}`) {
  try {
    await sock.sendMessage(chatId, { text });
  } catch (error) {
    logger.warn({ err: error, chatId }, 'gagal kirim minimal success');
  }
}

async function sendMinimalError(sock, chatId, text = `❌ ${sans('Terjadi kesalahan.')}`) {
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
