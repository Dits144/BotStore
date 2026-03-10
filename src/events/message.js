const logger = require('../config/logger');
const { routeMessage } = require('../handlers/messageRouter');

function bindMessageEvents(sock) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        await routeMessage(sock, msg);
      } catch (error) {
        logger.error({ err: error }, 'failed processing incoming message');
      }
    }
  });
}

module.exports = { bindMessageEvents };
