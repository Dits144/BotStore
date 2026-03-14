require('dotenv').config();

const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('baileys');
const { ensureDataFile } = require('./src/database/db');
const { handleMessage, getCommandRegistryInfo } = require('./src/handlers/messageHandler');
const { SESSION_DIR, ALLOWED_GROUP_ID } = require('./src/utils/constants');
const { startDailyReminder, getReminderScheduleInfo } = require('./src/scheduler/dailyReminder');
const { isAIEnabled } = require('./src/services/aiService');
const { getDataStats } = require('./src/services/lessonService');
const { getQuizStats } = require('./src/services/quizService');
const { getOwnerNumber } = require('./src/services/ownerService');

let reminderJob;

function printStartupSanity() {
  const cmdInfo = getCommandRegistryInfo();
  const reminderInfo = getReminderScheduleInfo();

  console.log('=== Bot Startup Sanity Check ===');
  console.log('Allowed Group ID:', ALLOWED_GROUP_ID);
  console.log('Owner Number Loaded:', getOwnerNumber() ? 'yes' : 'no');
  const dataStats = getDataStats();
  const quizStats = getQuizStats();
  console.log('AI Enabled:', isAIEnabled() ? 'yes' : 'no');
  console.log('Vocab Data Loaded:', dataStats.vocabCount);
  console.log('Quiz Data Loaded:', quizStats.quizCount);
  console.log('Total Commands Loaded:', cmdInfo.totalCommands);
  console.log('Reminder Schedule:', `${reminderInfo.time} (${reminderInfo.timezone}) -> ${reminderInfo.cronExp}`);
  console.log('Session Path:', SESSION_DIR);
  console.log('===============================');
}

async function startBot() {
  ensureDataFile();
  printStartupSanity();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
    browser: ['EnglishBot', 'Chrome', '2.1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Scan QR berikut di WhatsApp Linked Devices:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. code=', statusCode, 'reconnect=', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === 'open') {
      console.log('Bot connected ✅');
      if (!reminderJob) {
        reminderJob = startDailyReminder(sock);
        console.log('Daily reminder scheduler started ✅');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages?.[0];
    if (!msg || msg?.key?.remoteJid === 'status@broadcast') return;
    await handleMessage(sock, msg, { schedulerStarted: Boolean(reminderJob) });
  });
}

startBot().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
