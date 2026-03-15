const { getDailyLesson } = require('../services/lessonService');
const { updateStreak, updateUser } = require('../services/userService');

module.exports = {
  name: 'daily',
  description: 'Materi English harian',
  async execute({ sock, jid, sender }) {
    try {
      const lesson = getDailyLesson();
      updateStreak(sender);
      updateUser(sender, { lastStudyAt: new Date().toISOString() });

      const wordsText = lesson.words
        .slice(0, 5)
        .map((item, i) => [
          `📝 Word ${i + 1}: *${item.word}*`,
          `🇮🇩 Arti: ${item.meaning}`,
          `💬 Example: ${item.example || '-'}`
        ].join('\n'))
        .join('\n\n');

      const text = [
        '📚 *DAILY ENGLISH LESSON* 📚',
        '',
        wordsText,
        '',
        '❓ *Quiz:*',
        lesson.quiz,
        '',
        '🎯 *Challenge:*',
        lesson.challenge
      ].join('\n');

      await sock.sendMessage(jid, { text });
    } catch (error) {
      console.error('[daily] failed:', error.message);
      await sock.sendMessage(jid, { text: '⚠️ Daily lesson sedang bermasalah. Coba lagi sebentar ya.' });
    }
  }
};
