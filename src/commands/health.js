function normalizePhone(input = '') {
  return input.replace(/[^0-9]/g, '');
}

function isOwner(sender) {
  const owner = normalizePhone(process.env.OWNER_NUMBER || '');
  const senderPhone = normalizePhone((sender || '').split('@')[0]);
  return Boolean(owner && senderPhone.endsWith(owner));
}

module.exports = {
  name: 'health',
  description: 'Owner-only health check',
  async execute({ sock, jid, sender, runtime }) {
    if (!isOwner(sender)) {
      await sock.sendMessage(jid, { text: 'Khusus owner.' });
      return;
    }

    const text = [
      '🩺 *Bot Health*',
      `Allowed Group: ${process.env.ALLOWED_GROUP_ID || '120363406071615706@g.us'}`,
      `Owner Loaded: ${process.env.OWNER_NUMBER ? 'yes' : 'no'}`,
      `AI Enabled: ${process.env.AI_API_KEY ? 'yes' : 'no'}`,
      `AI Provider: ${process.env.AI_PROVIDER || 'openrouter'}`,
      `Commands Loaded: ${runtime?.totalCommands || '-'}`,
      `Reminder Time: ${process.env.DAILY_REMINDER_TIME || '07:00'} (${process.env.TZ || 'Asia/Jakarta'})`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
