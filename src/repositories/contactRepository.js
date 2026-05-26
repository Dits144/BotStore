const { connectDatabase } = require('../database/connection');

module.exports = {
  async upsert(jid, name) {
    if (!jid || !name) return;
    const db = await connectDatabase();
    const now = new Date().toISOString();
    try {
      await db.run(
        `INSERT INTO contacts (jid, name, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(jid) DO UPDATE SET name = ?, updated_at = ?`,
        [jid, name, now, name, now]
      );
    } catch (err) {
      // Ignore database write failures for auxiliary names
    }
  },

  async getAll() {
    try {
      const db = await connectDatabase();
      return await db.all('SELECT jid, name FROM contacts');
    } catch (err) {
      return [];
    }
  }
};
