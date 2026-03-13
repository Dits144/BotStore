const fs = require('fs');
const path = require('path');
const { USER_DB_PATH, DATA_DIR } = require('../utils/constants');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USER_DB_PATH)) {
    fs.writeFileSync(USER_DB_PATH, JSON.stringify({ users: {} }, null, 2));
  }
}

function readDb() {
  ensureDataFile();
  const raw = fs.readFileSync(USER_DB_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const backupPath = path.join(DATA_DIR, `users.corrupt.${Date.now()}.json`);
    fs.writeFileSync(backupPath, raw);
    fs.writeFileSync(USER_DB_PATH, JSON.stringify({ users: {} }, null, 2));
    return { users: {} };
  }
}

function writeDb(data) {
  ensureDataFile();
  fs.writeFileSync(USER_DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  readDb,
  writeDb,
  ensureDataFile
};
