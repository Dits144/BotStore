const fs = require('fs');
const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default;
const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason
} = baileys;
const qrcode = require('qrcode-terminal');
const config = require('../config/env');
const logger = require('../config/logger');
const { bindConnectionEvents } = require('../events/connection');
const { bindMessageEvents } = require('../events/message');

let reconnectTimer = null;
let currentSock = null;
let reconnectAttempt = 0;

async function startWhatsApp() {
  logger.info('starting');

  if (!fs.existsSync(config.sessionsPath)) {
    fs.mkdirSync(config.sessionsPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionsPath);
  const hasSession = Boolean(state?.creds?.registered);

  if (hasSession) {
    logger.info('session detected, mencoba reconnect tanpa QR');
  } else {
    logger.info('session belum ada, menunggu QR...');
  }

  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, 'baileys version sync');

  const sock = makeWASocket({
    auth: state,
    version,
    browser: Browsers.ubuntu('BotStore'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false,
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 20_000,
    retryRequestDelayMs: 2_000,
    logger
  });

  currentSock = sock;

  let qrShown = false;
  const qrTimeout = setTimeout(() => {
    if (!hasSession && !qrShown) {
      logger.warn('QR belum muncul. Cek jam server (NTP), koneksi internet VPS, dan pastikan tidak ada firewall memblokir websocket.');
    }
  }, 15_000);

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    if (update.qr) {
      qrShown = true;
      logger.info('qr generated');
      qrcode.generate(update.qr, { small: true });
    }

    if (update.connection === 'open') {
      reconnectAttempt = 0;
      clearTimeout(qrTimeout);
    }

    if (update.connection === 'close') {
      clearTimeout(qrTimeout);
    }
  });

  bindConnectionEvents(sock, ({ shouldReconnect, statusCode }) => {
    if (!shouldReconnect) {
      logger.error({ statusCode }, 'session logout / reconnect dihentikan');
      return;
    }

    if (reconnectTimer) return;

    reconnectAttempt += 1;
    const delay = Math.min(30_000, 3_000 * reconnectAttempt);
    logger.info({ reconnectAttempt, delayMs: delay }, 'reconnecting');

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;

      try {
        if (currentSock) {
          currentSock.end(new Error('restart socket'));
        }
      } catch (error) {
        logger.warn({ err: error }, 'gagal menutup socket lama');
      }

      await startWhatsApp();
    }, delay);
  });

  bindMessageEvents(sock);
}

function validateRuntime() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 23) {
    logger.warn(
      { node: process.versions.node },
      'Node.js terlalu baru untuk stabilitas Baileys. Disarankan pakai Node 20 LTS.'
    );
  }
}

module.exports = { startWhatsApp, validateRuntime, DisconnectReason };
