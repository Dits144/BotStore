require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('baileys');
const { ensureDataFile } = require('./src/database/db');
const { handleMessage, getCommandRegistryInfo } = require('./src/handlers/messageHandler');
const { SESSION_DIR, ALLOWED_GROUP_ID } = require('./src/utils/constants');
const { startDailyReminder, getReminderScheduleInfo } = require('./src/scheduler/dailyReminder');
const { getAIConfig } = require('./src/services/aiService');
const { getDataStats } = require('./src/services/lessonService');
const { getQuizStats } = require('./src/services/quizService');
const { getOwnerNumber, normalizePhone } = require('./src/services/ownerService');

let reminderJob;
const botRuntime = { connected: false, schedulerStarted: false };

function validateEnv(ai) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️ .env runtime file tidak ditemukan. Bot akan pakai default/env sistem.');
  }

  if (!ALLOWED_GROUP_ID) {
    console.warn('⚠️ ALLOWED_GROUP_ID kosong. Bot akan berisiko memproses pesan di grup lain.');
  }

  if (process.env.AI_PROVIDER === 'openrouter' && !process.env.AI_API_KEY) {
    console.warn('⚠️ AI_PROVIDER=openrouter tapi AI_API_KEY kosong. AI dinonaktifkan.');
  }

  if (!process.env.AI_MODEL) {
    console.warn('⚠️ AI_MODEL kosong. Menggunakan default openai/gpt-4o-mini.');
  }

  if (process.env.OWNER_NUMBER && !normalizePhone(process.env.OWNER_NUMBER)) {
    console.warn('⚠️ OWNER_NUMBER tidak valid, owner env akan diabaikan.');
  }

  return ai;
}

function printStartupSanity() {
  const cmdInfo = getCommandRegistryInfo();
  const reminderInfo = getReminderScheduleInfo();
  const ai = validateEnv(getAIConfig());
  const dataStats = getDataStats();
  const quizStats = getQuizStats();

  console.log('=== Bot Startup Sanity Check ===');
  console.log('Session Path:', SESSION_DIR);
  console.log('Allowed Group ID:', ALLOWED_GROUP_ID || '-');
  console.log('Owner Number Loaded:', getOwnerNumber() ? 'yes' : 'no');
  console.log('AI Enabled:', ai.enabled ? 'yes' : 'no');
  console.log('AI Provider:', ai.provider);
  console.log('AI Model:', ai.model);
  console.log('Vocab Data Loaded:', dataStats.vocabCount);
  console.log('Quizzes Loaded:', quizStats.quizCount);
  console.log('Grammar Topics Loaded:', dataStats.grammarTopicCount);
  console.log('Total Commands Loaded:', cmdInfo.totalCommands);
  console.log('Reminder Time:', reminderInfo.time);
  console.log('Timezone:', reminderInfo.timezone);
  console.log('Reminder Cron:', reminderInfo.cronExp);
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
    browser: ['EnglishBot', 'Chrome', '2.3.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Scan QR berikut di WhatsApp Linked Devices:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      botRuntime.connected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. code=', statusCode, 'reconnect=', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    if (connection === 'open') {
      botRuntime.connected = true;
      console.log('Bot connected ✅');
      if (!reminderJob) {
        reminderJob = startDailyReminder(sock);
        botRuntime.schedulerStarted = true;
        console.log('Daily reminder scheduler started ✅');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages?.[0];
    if (!msg || msg?.key?.remoteJid === 'status@broadcast') return;
    await handleMessage(sock, msg, { ...botRuntime });
  });
}

startBot().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
