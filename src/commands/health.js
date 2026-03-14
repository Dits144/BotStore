const { isOwnerJid, getOwnerNumber } = require('../services/ownerService');
const { getAIConfig } = require('../services/aiService');
const { getReminderStatus } = require('../services/reminderService');
const { getDataStats } = require('../services/lessonService');
const { getQuizStats } = require('../services/quizService');

function maskKey(key = '') {
  if (!key) return '-';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 6)}****${key.slice(-4)}`;
}

module.exports = {
  name: 'health',
  description: 'Owner-only health check',
  async execute({ sock, jid, sender, runtime }) {
    if (!isOwnerJid(sender)) {
      await sock.sendMessage(jid, { text: '⛔ Khusus owner.' });
      return;
    }

    const ai = getAIConfig();
    const vocabStats = getDataStats();
    const quizStats = getQuizStats();

    const text = [
      '🩺 *BOT HEALTH*',
      `🔌 Bot connected: ${runtime?.connected ? 'yes' : 'no'}`,
      `🤖 AI enabled: ${ai.enabled ? 'yes' : 'no'}`,
      `🧠 Provider: ${ai.provider}`,
      `🧪 Model: ${ai.model}`,
      `🔐 API key: ${maskKey(process.env.AI_API_KEY || '')}`,
      `📌 Allowed group: ${process.env.ALLOWED_GROUP_ID || '120363406071615706@g.us'}`,
      `👑 Owner loaded: ${getOwnerNumber() ? 'yes' : 'no'}`,
      `⏰ Reminder enabled: ${getReminderStatus() ? 'yes' : 'no'}`,
      `🧩 Total command: ${runtime?.totalCommands || '-'}`,
      `🗂️ Vocab count: ${vocabStats.vocabCount}`,
      `❓ Quiz count: ${quizStats.quizCount}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
