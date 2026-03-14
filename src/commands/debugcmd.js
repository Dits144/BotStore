const { isOwnerJid } = require('../services/ownerService');

module.exports = {
  name: 'debugcmd',
  description: 'Owner-only command debug',
  async execute({ sock, jid, sender, runtime }) {
    if (!isOwnerJid(sender)) {
      await sock.sendMessage(jid, { text: '⛔ Khusus owner.' });
      return;
    }

    const text = [
      '🛠️ *COMMAND DEBUG*',
      `🔢 Total: ${runtime?.totalCommands || 0}`,
      `⏱️ Scheduler started: ${runtime?.schedulerStarted ? 'yes' : 'no'}`,
      `📋 List: ${(runtime?.commands || []).join(', ') || '-'}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
