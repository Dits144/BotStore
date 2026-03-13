const { readDb, writeDb } = require('../database/db');

function getReminderStatus() {
  return readDb().global.reminderEnabled;
}

function setReminderStatus(enabled) {
  const db = readDb();
  db.global.reminderEnabled = Boolean(enabled);
  writeDb(db);
  return db.global.reminderEnabled;
}

function markReminderSent() {
  const db = readDb();
  db.global.lastReminderSentAt = new Date().toISOString();
  writeDb(db);
}

function getReminderMeta() {
  return readDb().global;
}

module.exports = { getReminderStatus, setReminderStatus, markReminderSent, getReminderMeta };
