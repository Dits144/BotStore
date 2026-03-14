const { isOwnerJid } = require('../services/ownerService');
const { isAIEnabled } = require('../services/aiService');

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
      `📝 Raw text: ${runtime?.rawText || '-'}`,
      `🔤 Parsed command: ${runtime?.parsedCommand || '-'}`,
      `📦 Args: ${(runtime?.parsedArgs || []).join(' ') || '-'}`,
      `📌 Allowed group: ${runtime?.isAllowedGroup ? 'yes' : 'no'}`,
      `👑 Is owner: ${isOwnerJid(sender) ? 'yes' : 'no'}`,
      `🤖 AI ready: ${isAIEnabled() ? 'yes' : 'no'}`,
      `⏱️ Scheduler started: ${runtime?.schedulerStarted ? 'yes' : 'no'}`,
      `🔢 Total command: ${runtime?.totalCommands || 0}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
