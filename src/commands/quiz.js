const { generateQuiz } = require('../services/quizService');
const { updateStreak } = require('../services/userService');

module.exports = {
  name: 'quiz',
  description: 'Quiz random',
  async execute({ sock, jid, sender }) {
    const quiz = generateQuiz(sender);
    updateStreak(sender);

    const options = quiz.options?.length
      ? `\n\nPilihan:\n${quiz.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`
      : '';

    await sock.sendMessage(jid, {
      text: `❓ *Quiz Aktif*\n${quiz.question}${options}\n\nJawab dengan: *.answer <jawaban>*`
    });
  }
};
