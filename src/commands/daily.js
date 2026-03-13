const { getDailyLesson } = require('../services/lessonService');
const { updateStreak } = require('../services/userService');

module.exports = {
  name: 'daily',
  description: 'Materi English harian',
  async execute({ sock, jid, sender }) {
    const lesson = getDailyLesson();
    updateStreak(sender);

    const wordsText = lesson.words
      .map((item, i) => `Word ${i + 1}: ${item.word} = ${item.meaning}\nExample: ${item.example}`)
      .join('\n\n');

    const text = [
      '📅 *Daily English Lesson*',
      '',
      wordsText,
      '',
      `Quiz: ${lesson.quiz}`,
      `Challenge: ${lesson.challenge}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
