const { DisconnectReason } = require('@whiskeysockets/baileys');
const logger = require('../config/logger');

function logConnectionState(connection) {
  if (connection === 'connecting') {
    logger.info('connecting to WhatsApp');
  }

  if (connection === 'open') {
    logger.info('login success');
  }
}

function resolveDisconnect(lastDisconnect) {
  const statusCode = lastDisconnect?.error?.output?.statusCode;
  const reason = lastDisconnect?.error?.message || 'unknown';
  const isLoggedOut = statusCode === DisconnectReason.loggedOut;

  return {
    statusCode,
    reason,
    shouldReconnect: !isLoggedOut,
    isLoggedOut
  };
}

module.exports = { logConnectionState, resolveDisconnect };
