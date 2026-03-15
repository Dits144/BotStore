const { getReminderStatus, setReminderStatus, getReminderMeta } = require('../services/reminderService');
const { isOwnerJid } = require('../services/ownerService');

module.exports = {
  name: 'reminder',
  description: 'Admin control reminder harian',
  async execute({ sock, jid, sender, args, runtime }) {
    if (!isOwnerJid(sender)) {
      await sock.sendMessage(jid, { text: '⛔ Khusus owner.' });
      return;
    }

    const action = (args[0] || 'status').toLowerCase();
    if (action === 'on') setReminderStatus(true);
    if (action === 'off') setReminderStatus(false);

    if (!['on', 'off', 'status'].includes(action)) {
      await sock.sendMessage(jid, { text: '⏰ Format: *.reminder on|off|status*' });
      return;
    }

    const meta = getReminderMeta();
    const enabled = getReminderStatus();
    await sock.sendMessage(jid, {
      text: `⏰ Reminder: *${enabled ? 'ON' : 'OFF'}*\n🕒 Last sent: ${meta.lastReminderSentAt || '-'}\n📌 Time: ${process.env.DAILY_REMINDER_TIME || '07:00'} (${process.env.TZ || 'Asia/Jakarta'})\n🛠️ Scheduler started: ${runtime?.schedulerStarted ? 'yes' : 'no'}`
    });
  }
};
