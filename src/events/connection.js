const { DisconnectReason } = require('@whiskeysockets/baileys');
const logger = require('../config/logger');

function bindConnectionEvents(sock, onReconnectDecision) {
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    logger.debug({ connection, hasQR: Boolean(qr) }, 'connection update');

    if (connection === 'open') {
      logger.info('connected');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || 'unknown';
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, reason }, 'disconnected');
      onReconnectDecision({ shouldReconnect, statusCode });
    }
  });
}

module.exports = { bindConnectionEvents };
