require('dotenv').config();

const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('baileys');
const { ensureDataFile } = require('./src/database/db');
const { handleMessage } = require('./src/handlers/messageHandler');
const { SESSION_DIR } = require('./src/utils/constants');
const { startDailyReminder } = require('./src/scheduler/dailyReminder');

let reminderJob;

async function startBot() {
  ensureDataFile();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
    browser: ['EnglishBot', 'Chrome', '2.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Scan QR berikut di WhatsApp Linked Devices:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnect:', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === 'open') {
      console.log('Bot connected ✅');
      if (!reminderJob) reminderJob = startDailyReminder(sock);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg || msg.key?.remoteJid === 'status@broadcast') return;
    if (msg.key?.participant && msg.key.participant.endsWith('status')) return;

    await handleMessage(sock, msg);
  });
}

startBot().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
