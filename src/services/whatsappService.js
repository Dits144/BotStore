const fs = require('fs');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');
const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default;
const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} = baileys;
const qrcode = require('qrcode-terminal');
const config = require('../config/env');
const logger = require('../config/logger');
const { bindMessageEvents } = require('../events/message');
const { logConnectionState, resolveDisconnect } = require('../events/connection');

let currentSock = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let isStarting = false;
let hasLoggedQrHint = false;

async function startWhatsApp() {
  if (isStarting) {
    logger.warn('startWhatsApp dipanggil saat proses start masih berjalan, diabaikan');
    return;
  }

  isStarting = true;

  try {
    logger.info('starting bot');

    if (!fs.existsSync(config.sessionsPath)) {
      fs.mkdirSync(config.sessionsPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionsPath);
    const hasSession = Boolean(state?.creds?.registered);

    if (hasSession) {
      logger.info('session ditemukan, mencoba login ulang');
    } else {
      logger.info({ authMode: config.authMode }, 'session belum ada, menunggu autentikasi');
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

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      logger.info('session saved');
    });

    let qrShown = false;
    let pairingIssued = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      logConnectionState(connection);

      if (qr && config.authMode === 'qr') {
        renderQrToTerminal(qr, qrShown);
        qrShown = true;
      }

      if (connection === 'open') {
        reconnectAttempt = 0;
        clearReconnectTimer();
        hasLoggedQrHint = false;
        logger.info('berhasil terhubung');
      }

      if (connection === 'close') {
        const decision = resolveDisconnect(lastDisconnect);
        logger.warn({ reason: decision.reason, statusCode: decision.statusCode }, 'disconnected');

        if (decision.isLoggedOut) {
          logger.error('status loggedOut terdeteksi. Hapus folder sessions jika ingin login ulang.');
          return;
        }

        scheduleReconnect();
      }

      if (!hasSession && config.authMode === 'pairing' && !pairingIssued && connection === 'connecting') {
        pairingIssued = true;
        try {
          const phoneNumber = await resolvePairingNumber();
          const code = await sock.requestPairingCode(phoneNumber);
          logger.info({ phoneNumber }, 'pairing mode aktif');
          logger.info(`pairing code: ${code}`);
        } catch (error) {
          logger.error({ err: error }, 'gagal membuat pairing code');
          scheduleReconnect();
        }
      }
    });

    bindMessageEvents(sock);

    if (!hasSession && config.authMode === 'qr') {
      setTimeout(() => {
        if (!qrShown) {
          if (!hasLoggedQrHint) {
            logger.warn('QR belum muncul. Cek internet VPS, sinkronisasi waktu, dan firewall/security group.');
            hasLoggedQrHint = true;
          }
        }
      }, 15000);
    }
  } finally {
    isStarting = false;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectAttempt += 1;
  const delay = Math.min(
    config.reconnectMaxDelayMs,
    Math.max(config.reconnectBaseDelayMs, config.reconnectBaseDelayMs * reconnectAttempt)
  );

  logger.info({ delayMs: delay, reconnectAttempt }, `reconnecting in ${Math.round(delay / 1000)} seconds`);

  reconnectTimer = setTimeout(async () => {
    clearReconnectTimer();

    try {
      if (currentSock) {
        currentSock.end(new Error('restart socket'));
      }
    } catch (error) {
      logger.warn({ err: error }, 'gagal menutup socket lama sebelum reconnect');
    }

    await startWhatsApp();
  }, delay);
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

async function resolvePairingNumber() {
  if (config.pairingPhoneNumber) {
    return sanitizePhoneNumber(config.pairingPhoneNumber);
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question('Masukkan nomor WhatsApp untuk pairing (contoh 62812xxxx): ');
  rl.close();

  return sanitizePhoneNumber(answer);
}

function sanitizePhoneNumber(value) {
  const cleaned = String(value || '').replace(/[^0-9]/g, '');
  if (!cleaned) {
    throw new Error('Nomor WhatsApp tidak valid untuk pairing code');
  }
  return cleaned;
}

function renderQrToTerminal(qr, alreadyShown) {
  if (alreadyShown) {
    return;
  }

  process.stdout.write('\nSilakan scan QR berikut dari WhatsApp > Perangkat Tertaut\n\n');
  qrcode.generate(qr, { small: true });
  process.stdout.write('\n');
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

function getSock() {
  return currentSock;
}

module.exports = { startWhatsApp, validateRuntime, getSock };
