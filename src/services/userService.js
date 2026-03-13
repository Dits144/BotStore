const { readDb, writeDb } = require('../database/db');
const { DEFAULT_USER } = require('../utils/constants');

function getUser(userId) {
  const db = readDb();
  if (!db.users[userId]) {
    db.users[userId] = { userId, ...DEFAULT_USER };
    writeDb(db);
  }
  return db.users[userId];
}

function updateUser(userId, updater) {
  const db = readDb();
  if (!db.users[userId]) {
    db.users[userId] = { userId, ...DEFAULT_USER };
  }
  const current = db.users[userId];
  const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  db.users[userId] = updated;
  writeDb(db);
  return updated;
}

function addXpAndScore(userId, amount = 10) {
  return updateUser(userId, (user) => {
    const xp = user.xp + amount;
    const score = user.score + amount;
    const level = Math.floor(xp / 100) + 1;
    return {
      ...user,
      xp,
      score,
      level,
      totalCorrect: user.totalCorrect + 1
    };
  });
}

function updateStreak(userId) {
  const today = new Date().toISOString().slice(0, 10);
  return updateUser(userId, (user) => {
    if (user.lastActiveDate === today) {
      return user;
    }

    let streak = 1;
    if (user.lastActiveDate) {
      const previous = new Date(user.lastActiveDate);
      const diff = Math.floor((new Date(today) - previous) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak = user.streak + 1;
    }

    return {
      ...user,
      streak,
      lastActiveDate: today
    };
  });
}

function resetProgress(userId) {
  return updateUser(userId, {
    userId,
    ...DEFAULT_USER
  });
}

module.exports = {
  getUser,
  updateUser,
  addXpAndScore,
  updateStreak,
  resetProgress
};
