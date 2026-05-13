const logger = require('../config/logger');
const {
  reactLoading,
  reactSuccess,
  reactError,
  deleteForEveryone
} = require('./messageActions');
const { styled } = require('./styledText');

async function sendMinimalSuccess(sock, chatId, text = `✅ ${styled('Berhasil.')}`) {
  try {
    await sock.sendMessage(chatId, { text });
  } catch (error) {
    logger.warn({ err: error, chatId }, 'gagal kirim minimal success');
  }
}

async function sendMinimalError(sock, chatId, text = `❌ ${styled('Terjadi kesalahan.')}`) {
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
