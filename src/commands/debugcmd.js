const { isOwnerJid } = require('../services/ownerService');
const { getAIReadiness } = require('../services/aiService');
const { getUser } = require('../services/userService');

module.exports = {
  name: 'debugcmd',
  description: 'Owner-only command debug',
  async execute({ sock, jid, sender, runtime }) {
    if (!isOwnerJid(sender)) {
      await sock.sendMessage(jid, { text: '⛔ Khusus owner.' });
      return;
    }

    const ai = getAIReadiness();
    const user = getUser(sender);

    const text = [
      '🛠️ *COMMAND DEBUG*',
      `📝 Raw text: ${runtime?.rawText || '-'}`,
      `🔤 Parsed command: ${runtime?.parsedCommand || '-'}`,
      `📦 Args: ${(runtime?.parsedArgs || []).join(' ') || '-'}`,
      `📌 Allowed group: ${runtime?.isAllowedGroup ? 'yes' : 'no'}`,
      `👑 Is owner: ${isOwnerJid(sender) ? 'yes' : 'no'}`,
      `🤖 AI ready: ${ai.ready ? 'yes' : 'no'}`,
      `🧠 Provider: ${ai.provider}`,
      `🧪 Model: ${ai.model}`,
      `💬 Chat mode active: ${user.chatMode ? 'yes' : 'no'}`,
      `⏱️ Scheduler started: ${runtime?.schedulerStarted ? 'yes' : 'no'}`,
      `🔢 Total command: ${runtime?.totalCommands || 0}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
