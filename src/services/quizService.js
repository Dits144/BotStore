const path = require('path');
const { getUser, updateUser } = require('./userService');
const { safeReadJson } = require('./lessonService');

const quizPath = path.join(process.cwd(), 'data', 'quizzes.json');

function loadQuizzes() {
  const data = safeReadJson(quizPath, []);
  return Array.isArray(data) ? data.filter((q) => q?.id && q?.question && q?.answer) : [];
}

function generateQuiz(userId) {
  const quizzes = loadQuizzes();
  if (!quizzes.length) return null;

  const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];

  updateUser(userId, (user) => ({
    ...user,
    activeQuiz: {
      id: quiz.id,
      question: quiz.question,
      answer: String(quiz.answer).toLowerCase().trim(),
      options: quiz.options || [],
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

  const match = raw.match(/^([a-z])$/i);
  if (match && Array.isArray(activeQuiz?.options) && activeQuiz.options.length) {
    const idx = match[1].toUpperCase().charCodeAt(0) - 65;
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

module.exports = {
  generateQuiz,
  getActiveQuiz,
  clearActiveQuiz,
  normalizeAnswer
};
