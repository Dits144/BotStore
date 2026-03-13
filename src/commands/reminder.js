const { getReminderStatus, setReminderStatus, getReminderMeta } = require('../services/reminderService');

function normalizePhone(input = '') {
  return input.replace(/[^0-9]/g, '');
}

function isOwner(sender) {
  const owner = normalizePhone(process.env.OWNER_NUMBER || '');
  const senderPhone = normalizePhone((sender || '').split('@')[0]);
  return owner && senderPhone.endsWith(owner);
}

module.exports = {
  name: 'reminder',
  description: 'Admin control reminder harian',
  async execute({ sock, jid, sender, args }) {
    if (!isOwner(sender)) {
      await sock.sendMessage(jid, { text: 'Khusus owner.' });
      return;
    }

    const action = (args[0] || 'status').toLowerCase();
    if (action === 'on') setReminderStatus(true);
    if (action === 'off') setReminderStatus(false);

    if (!['on', 'off', 'status'].includes(action)) {
      await sock.sendMessage(jid, { text: 'Format: *.reminder on|off|status*' });
      return;
    }

    const meta = getReminderMeta();
    const enabled = getReminderStatus();
    await sock.sendMessage(jid, {
      text: `⏰ Reminder: *${enabled ? 'ON' : 'OFF'}*\nLast sent: ${meta.lastReminderSentAt || '-'}\nTime: ${process.env.DAILY_REMINDER_TIME || '07:00'} (${process.env.TZ || 'Asia/Jakarta'})`
    });
  }
};
