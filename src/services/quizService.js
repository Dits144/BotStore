const path = require('path');
const { DATA_DIR } = require('../utils/constants');
const { getUser, updateUser } = require('./userService');
const { loadArray } = require('./lessonService');

const quizPath = path.resolve(DATA_DIR, 'quizzes.json');

const FALLBACK_QUIZZES = [
  { id: 'fq1', question: "Apa bahasa Inggris dari 'percaya diri'?", answer: 'confident', options: ['confident', 'schedule', 'mistake', 'habit'] },
  { id: 'fq2', question: 'Choose the correct sentence:', answer: 'she is studying now', options: ['she study now', 'she is studying now', 'she are studying now', 'she studying now'] },
  { id: 'fq3', question: "Apa arti kata 'improve'?", answer: 'meningkatkan', options: ['meningkatkan', 'menghafal', 'mengulang', 'mengirim'] }
];

function loadQuizzes() {
  return loadArray(quizPath, {
    fallback: FALLBACK_QUIZZES,
    validator: (q) => q && q.id && q.question && q.answer
  });
}

function generateQuiz(userId) {
  const quizzes = loadQuizzes();
  const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];

  updateUser(userId, (user) => ({
    ...user,
    activeQuiz: {
      id: quiz.id,
      question: quiz.question,
      answer: String(quiz.answer).toLowerCase().trim(),
      options: Array.isArray(quiz.options) ? quiz.options : [],
      createdAt: Date.now()
    },
    lastQuizAt: new Date().toISOString()
  }));

  return quiz;
}

function getActiveQuiz(userId) {
  return getUser(userId).activeQuiz;
}

function normalizeAnswer(input, activeQuiz) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return raw;

  const optionMatch = raw.match(/^([a-z])$/i);
  if (optionMatch && Array.isArray(activeQuiz?.options) && activeQuiz.options.length) {
    const idx = optionMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < activeQuiz.options.length) {
      return String(activeQuiz.options[idx]).toLowerCase().trim();
    }
  }

  return raw;
}

function clearActiveQuiz(userId, historyEntry = null) {
  return updateUser(userId, (user) => ({
    ...user,
    activeQuiz: null,
    quizHistory: historyEntry ? [...(user.quizHistory || []).slice(-19), historyEntry] : user.quizHistory || []
  }));
}

function getQuizStats() {
  return {
    quizCount: loadQuizzes().length
  };
}

module.exports = {
  generateQuiz,
  getActiveQuiz,
  clearActiveQuiz,
  normalizeAnswer,
  loadQuizzes,
  getQuizStats
};
