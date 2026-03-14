const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const SESSION_DIR = path.resolve(ROOT_DIR, 'session');
const USER_DB_PATH = path.resolve(DATA_DIR, 'users.json');
const ALLOWED_GROUP_ID = process.env.ALLOWED_GROUP_ID || '120363406071615706@g.us';

module.exports = {
  PREFIX: '.',
  ROOT_DIR,
  DATA_DIR,
  USER_DB_PATH,
  SESSION_DIR,
  ALLOWED_GROUP_ID,
  DEFAULT_USER: {
    score: 0,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    totalCorrect: 0,
    chatMode: false,
    activeQuiz: null,
    quizHistory: [],
    lastQuizAt: null,
    lastStudyAt: null,
    totalMessagesPracticed: 0,
    pronunciationRequests: 0,
    lastPracticeResponseAt: 0
  },
  DEFAULT_GLOBAL: {
    allowedGroupId: ALLOWED_GROUP_ID,
    reminderEnabled: true,
    lastReminderSentAt: null,
    ownerNumber: ''
  }
};
