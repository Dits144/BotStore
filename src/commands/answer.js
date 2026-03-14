const { getActiveQuiz, clearActiveQuiz, normalizeAnswer } = require('../services/quizService');
const { addXpAndScore, updateStreak } = require('../services/userService');

module.exports = {
  name: 'answer',
  description: 'Jawab quiz aktif',
  async execute({ sock, jid, sender, args }) {
    const rawAnswer = args.join(' ').trim();
    if (!rawAnswer) {
      await sock.sendMessage(jid, { text: 'Format: *.answer <jawaban>*' });
      return;
    }

    const activeQuiz = getActiveQuiz(sender);
    if (!activeQuiz) {
      await sock.sendMessage(jid, { text: 'Belum ada quiz aktif. Gunakan *.quiz* dulu.' });
      return;
    }

    const userAnswer = normalizeAnswer(rawAnswer, activeQuiz);
    const correct = userAnswer === String(activeQuiz.answer).toLowerCase().trim();

    if (correct) {
      const user = addXpAndScore(sender, 15);
      updateStreak(sender);
      clearActiveQuiz(sender, { question: activeQuiz.question, result: 'correct', answer: userAnswer, at: Date.now() });
      await sock.sendMessage(jid, {
        text: `✅ Jawaban benar! +15 XP\nScore: ${user.score} | XP: ${user.xp} | Level: ${user.level}`
      });
      return;
    }

    clearActiveQuiz(sender, { question: activeQuiz.question, result: 'wrong', answer: userAnswer, at: Date.now() });
    await sock.sendMessage(jid, {
      text: `❌ Jawaban kurang tepat.\nJawaban benar: *${activeQuiz.answer}*`
    });
  }
};
