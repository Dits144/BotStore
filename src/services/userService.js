const { readDb, writeDb } = require('../database/db');
const { DEFAULT_USER } = require('../utils/constants');

function hydrateUser(userId, user) {
  return { userId, ...DEFAULT_USER, ...(user || {}) };
}

function getUser(userId) {
  const db = readDb();
  const user = hydrateUser(userId, db.users[userId]);
  if (!db.users[userId]) {
    db.users[userId] = user;
    writeDb(db);
  }
  return user;
}

function updateUser(userId, updater) {
  const db = readDb();
  const current = hydrateUser(userId, db.users[userId]);
  const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  db.users[userId] = hydrateUser(userId, updated);
  writeDb(db);
  return db.users[userId];
}

function addXpAndScore(userId, amount = 10) {
  return updateUser(userId, (user) => {
    const xp = user.xp + amount;
    return {
      ...user,
      xp,
      score: user.score + amount,
      level: Math.floor(xp / 100) + 1,
      totalCorrect: user.totalCorrect + 1,
      lastQuizAt: new Date().toISOString(),
      lastStudyAt: new Date().toISOString()
    };
  });
}

function updateStreak(userId) {
  const today = new Date().toISOString().slice(0, 10);
  return updateUser(userId, (user) => {
    if (user.lastActiveDate === today) return { ...user, lastStudyAt: new Date().toISOString() };

    let streak = 1;
    if (user.lastActiveDate) {
      const diff = Math.floor((new Date(today) - new Date(user.lastActiveDate)) / 86400000);
      if (diff === 1) streak = user.streak + 1;
    }

    return { ...user, streak, lastActiveDate: today, lastStudyAt: new Date().toISOString() };
  });
}

function incrementPracticeCount(userId) {
  return updateUser(userId, (user) => ({
    ...user,
    totalMessagesPracticed: user.totalMessagesPracticed + 1,
    lastPracticeResponseAt: Date.now(),
    lastStudyAt: new Date().toISOString()
  }));
}

function incrementPronunciationRequests(userId) {
  return updateUser(userId, (user) => ({ ...user, pronunciationRequests: user.pronunciationRequests + 1 }));
}

function resetProgress(userId) {
  return updateUser(userId, { ...DEFAULT_USER, userId });
}

function getLeaderboard(limit = 10) {
  const db = readDb();
  return Object.values(db.users)
    .map((u) => hydrateUser(u.userId, u))
    .sort((a, b) => (b.xp - a.xp) || (b.score - a.score))
    .slice(0, limit);
}

function getRank(userId) {
  const db = readDb();
  const sorted = Object.values(db.users)
    .map((u) => hydrateUser(u.userId, u))
    .sort((a, b) => (b.xp - a.xp) || (b.score - a.score));
  const index = sorted.findIndex((x) => x.userId === userId);
  return { rank: index >= 0 ? index + 1 : sorted.length + 1, total: sorted.length || 1 };
}

module.exports = {
  getUser,
  updateUser,
  addXpAndScore,
  updateStreak,
  incrementPracticeCount,
  incrementPronunciationRequests,
  resetProgress,
  getLeaderboard,
  getRank
};
