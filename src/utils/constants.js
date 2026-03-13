const path = require('path');

module.exports = {
  PREFIX: '.',
  ALLOWED_GROUP_ID: '120363406071615706@g.us',
  DATA_DIR: path.join(process.cwd(), 'data'),
  USER_DB_PATH: path.join(process.cwd(), 'data', 'users.json'),
  SESSION_DIR: path.join(process.cwd(), 'session'),
  DEFAULT_USER: {
    score: 0,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    totalCorrect: 0,
    chatMode: false,
    activeQuiz: null,
    quizHistory: []
  }
};
