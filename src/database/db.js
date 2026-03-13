const fs = require('fs');
const path = require('path');
const { USER_DB_PATH, DATA_DIR, DEFAULT_GLOBAL } = require('../utils/constants');

function buildDefaultDb() {
  return { users: {}, global: { ...DEFAULT_GLOBAL } };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USER_DB_PATH)) fs.writeFileSync(USER_DB_PATH, JSON.stringify(buildDefaultDb(), null, 2));
}

function normalizeDb(data) {
  const safe = data && typeof data === 'object' ? data : {};
  return {
    users: safe.users && typeof safe.users === 'object' ? safe.users : {},
    global: { ...DEFAULT_GLOBAL, ...(safe.global || {}) }
  };
}

function readDb() {
  ensureDataFile();
  const raw = fs.readFileSync(USER_DB_PATH, 'utf8');
  try {
    return normalizeDb(JSON.parse(raw));
  } catch (error) {
    const backupPath = path.join(DATA_DIR, `users.corrupt.${Date.now()}.json`);
    fs.writeFileSync(backupPath, raw);
    const reset = buildDefaultDb();
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(reset, null, 2));
    return reset;
  }
}

function writeDb(data) {
  ensureDataFile();
  const tempPath = `${USER_DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(normalizeDb(data), null, 2));
  fs.renameSync(tempPath, USER_DB_PATH);
}

module.exports = { readDb, writeDb, ensureDataFile };
