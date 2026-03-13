const fs = require('fs');
const path = require('path');
const { getUser, updateUser } = require('./userService');

const quizPath = path.join(process.cwd(), 'data', 'quizzes.json');

function loadQuizzes() {
  return JSON.parse(fs.readFileSync(quizPath, 'utf8'));
}

function generateQuiz(userId) {
  const quizzes = loadQuizzes();
  const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];

  updateUser(userId, (user) => ({
    ...user,
    activeQuiz: {
      id: quiz.id,
      question: quiz.question,
      answer: quiz.answer.toLowerCase(),
      createdAt: Date.now()
    }
  }));

  return quiz;
}

function getActiveQuiz(userId) {
  return getUser(userId).activeQuiz;
}

function clearActiveQuiz(userId, historyEntry = null) {
  return updateUser(userId, (user) => ({
    ...user,
    activeQuiz: null,
    quizHistory: historyEntry
      ? [...(user.quizHistory || []).slice(-19), historyEntry]
      : user.quizHistory || []
  }));
}

module.exports = {
  generateQuiz,
  getActiveQuiz,
  clearActiveQuiz
};
