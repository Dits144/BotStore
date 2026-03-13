const { connectDatabase } = require('../database/connection');
const { normalizeJid } = require('../utils/jid');

module.exports = {
  async addOwner(jid, isMain = 0) {
    const db = await connectDatabase();
    const normalized = normalizeJid(jid);
    return db.run('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, ?, ?)', [normalized, isMain ? 1 : 0, new Date().toISOString()]);
  },

  async removeOwner(jid) {
    const db = await connectDatabase();
    const normalized = normalizeJid(jid);
    return db.run('DELETE FROM owners WHERE jid = ? AND is_main = 0', [normalized]);
  },

  async isOwner(jid) {
    const db = await connectDatabase();
    const normalized = normalizeJid(jid);
    const row = await db.get('SELECT 1 FROM owners WHERE jid = ? LIMIT 1', [normalized]);
    return Boolean(row);
  },

  async listOwners() {
    const db = await connectDatabase();
    return db.all('SELECT jid, is_main, created_at FROM owners ORDER BY is_main DESC, created_at ASC');
  }
};
