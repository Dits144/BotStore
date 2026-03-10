const db = require('../database/connection');

const insertStmt = db.prepare('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, ?, ?)');
const removeStmt = db.prepare('DELETE FROM owners WHERE jid = ? AND is_main = 0');

module.exports = {
  addOwner(jid, isMain = 0) {
    return insertStmt.run(jid, isMain ? 1 : 0, new Date().toISOString());
  },
  removeOwner(jid) {
    return removeStmt.run(jid);
  },
  isOwner(jid) {
    const row = db.prepare('SELECT 1 FROM owners WHERE jid = ? LIMIT 1').get(jid);
    return Boolean(row);
  },
  listOwners() {
    return db.prepare('SELECT jid, is_main, created_at FROM owners ORDER BY is_main DESC, created_at ASC').all();
  }
};
