const { DisconnectReason } = require('@whiskeysockets/baileys');
const logger = require('../config/logger');

function bindConnectionEvents(sock, reconnectFn) {
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) logger.info('qr generated');
    if (connection === 'open') logger.info('connected');

    if (connection === 'close') {
      logger.warn('disconnected');
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        logger.info('reconnecting');
        reconnectFn();
      } else {
        logger.error('session logout, silakan scan QR ulang.');
      }
    }
  });
}

module.exports = { bindConnectionEvents };
