const cron = require('node-cron');
const { ALLOWED_GROUP_ID } = require('../utils/constants');
const { getRandomVocab } = require('../services/lessonService');
const { getReminderStatus, markReminderSent } = require('../services/reminderService');

function parseReminderTime(value) {
  const [h, m] = (value || '07:00').split(':').map((x) => Number(x));
  return `${Number.isInteger(m) ? m : 0} ${Number.isInteger(h) ? h : 7} * * *`;
}

function startDailyReminder(sock) {
  const schedule = parseReminderTime(process.env.DAILY_REMINDER_TIME);
  const timezone = process.env.TZ || 'Asia/Jakarta';

  return cron.schedule(schedule, async () => {
    try {
      if (!getReminderStatus()) return;
      const [vocab] = getRandomVocab(1);
      const text = [
        '⏰ *Daily Reminder*',
        'Yuk lanjut belajar English hari ini! Gunakan *.daily* buat materi lengkap.',
        `Vocab cepat: *${vocab.word}* = ${vocab.meaning}`,
        'Keep going, little progress every day ✨'
      ].join('\n');
      await sock.sendMessage(ALLOWED_GROUP_ID, { text });
      markReminderSent();
    } catch (error) {
      console.error('daily reminder error:', error.message);
    }
  }, { timezone });
}

module.exports = { startDailyReminder };
