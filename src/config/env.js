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
  ownerClaimCode: process.env.OWNER_CLAIM_CODE || 'Ditsanalah144',
  mainOwnerJid: process.env.MAIN_OWNER_JID || '6282120196167@s.whatsapp.net',
  rentalRefreshSeconds: Number(process.env.RENTAL_REFRESH_SECONDS || 60)
};

module.exports = config;
