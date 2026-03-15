const cron = require('node-cron');
const { ALLOWED_GROUP_ID } = require('../utils/constants');
const { getRandomVocab } = require('../services/lessonService');
const { getReminderStatus, markReminderSent } = require('../services/reminderService');

function parseReminderTime(value) {
  const [h, m] = String(value || '07:00').split(':').map((x) => Number(x));
  const hour = Number.isInteger(h) && h >= 0 && h <= 23 ? h : 7;
  const minute = Number.isInteger(m) && m >= 0 && m <= 59 ? m : 0;
  return `${minute} ${hour} * * *`;
}

function getReminderScheduleInfo() {
  const cronExp = parseReminderTime(process.env.DAILY_REMINDER_TIME);
  return {
    cronExp,
    time: process.env.DAILY_REMINDER_TIME || '07:00',
    timezone: process.env.TZ || 'Asia/Jakarta'
  };
}

function startDailyReminder(sock) {
  const info = getReminderScheduleInfo();

  return cron.schedule(info.cronExp, async () => {
    try {
      if (!getReminderStatus()) return;
      const [vocab] = getRandomVocab(1);
      const vocabLine = vocab ? `Vocab cepat: *${vocab.word}* = ${vocab.meaning}` : 'Vocab cepat: data belum tersedia.';

      const text = [
        '⏰ *Daily Reminder*',
        'Yuk lanjut belajar English hari ini! Gunakan *.daily* buat materi lengkap.',
        vocabLine,
        'Keep going, little progress every day ✨'
      ].join('\n');

      await sock.sendMessage(ALLOWED_GROUP_ID, { text });
      markReminderSent();
    } catch (error) {
      console.error('daily reminder error:', error.message);
    }
  }, { timezone: info.timezone });
}

module.exports = { startDailyReminder, getReminderScheduleInfo };
