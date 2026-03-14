const { isOwnerJid, getOwnerNumber } = require('../services/ownerService');

module.exports = {
  name: 'health',
  description: 'Owner-only health check',
  async execute({ sock, jid, sender, runtime }) {
    if (!isOwnerJid(sender)) {
      await sock.sendMessage(jid, { text: '⛔ Khusus owner.' });
      return;
    }

    const text = [
      '🩺 *BOT HEALTH*',
      `📌 Allowed Group: ${process.env.ALLOWED_GROUP_ID || '120363406071615706@g.us'}`,
      `👑 Owner Loaded: ${getOwnerNumber() ? 'yes' : 'no'}`,
      `🤖 AI Enabled: ${process.env.AI_API_KEY ? 'yes' : 'no'}`,
      `🧠 AI Provider: ${process.env.AI_PROVIDER || 'openrouter'}`,
      `🧩 Commands Loaded: ${runtime?.totalCommands || '-'}`,
      `⏰ Reminder Time: ${process.env.DAILY_REMINDER_TIME || '07:00'} (${process.env.TZ || 'Asia/Jakarta'})`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
