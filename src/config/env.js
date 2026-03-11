const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  appName: process.env.APP_NAME || 'Bot WhatsApp Store',
  nodeEnv: process.env.NODE_ENV || 'production',
  logLevel: process.env.LOG_LEVEL || 'info',
  timezone: process.env.TZ || 'Asia/Jakarta',
  commandPrefix: process.env.COMMAND_PREFIX || '',
  databasePath: process.env.DB_PATH || path.join('data', 'botstore.sqlite'),
  sessionsPath: process.env.SESSIONS_PATH || path.join('sessions'),
  ownerClaimCode: process.env.OWNER_CLAIM_CODE || 'botstoreditsanalah144',
  mainOwnerJid: process.env.MAIN_OWNER_JID || '6282120196167@s.whatsapp.net',
  rentalRefreshSeconds: Number(process.env.RENTAL_REFRESH_SECONDS || 60),
  authMode: (process.env.AUTH_MODE || 'qr').toLowerCase(),
  pairingPhoneNumber: process.env.PAIRING_PHONE_NUMBER || '',
  reconnectBaseDelayMs: Number(process.env.RECONNECT_BASE_DELAY_MS || 5000),
  reconnectMaxDelayMs: Number(process.env.RECONNECT_MAX_DELAY_MS || 60000)
};

module.exports = config;
