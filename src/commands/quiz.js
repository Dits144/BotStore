const { generateQuiz } = require('../services/quizService');
const { updateStreak } = require('../services/userService');

module.exports = {
  name: 'quiz',
  description: 'Quiz random',
  async execute({ sock, jid, sender }) {
    try {
      const quiz = generateQuiz(sender);
      updateStreak(sender);

      const options = quiz.options?.length
        ? `\n\n🧠 Pilihan:\n${quiz.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`
        : '';

      await sock.sendMessage(jid, {
        text: `🧠 *QUIZ AKTIF*\n❓ ${quiz.question}${options}\n\n✏️ Jawab dengan: *.answer <jawaban>*`
      });
    } catch (error) {
      console.error('[quiz] failed:', error.message);
      await sock.sendMessage(jid, { text: '⚠️ Quiz belum bisa dimuat. Coba lagi sebentar.' });
    }
  }
};
