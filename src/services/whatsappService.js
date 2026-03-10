const fs = require('fs');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('../config/env');
const logger = require('../config/logger');
const { bindConnectionEvents } = require('../events/connection');
const { bindMessageEvents } = require('../events/message');

let reconnectTimer = null;

async function startWhatsApp() {
  logger.info('starting');

  if (!fs.existsSync(config.sessionsPath)) {
    fs.mkdirSync(config.sessionsPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionsPath);

  const sock = makeWASocket({
    auth: state,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false,
    logger
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    if (update.qr) {
      qrcode.generate(update.qr, { small: true });
    }
  });

  bindConnectionEvents(sock, () => {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      await startWhatsApp();
    }, 3000);
  });

  bindMessageEvents(sock);
}

module.exports = { startWhatsApp };
