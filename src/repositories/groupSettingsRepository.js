const { connectDatabase } = require('../database/connection');

async function ensureGroup(groupId) {
  const db = await connectDatabase();
  const now = new Date().toISOString();
  await db.run(
    `INSERT OR IGNORE INTO group_settings (group_id, welcome_enabled, welcome_message, created_at, updated_at)
     VALUES (?, 0, '', ?, ?)`,
    [groupId, now, now]
  );
}

module.exports = {
  async get(groupId) {
    await ensureGroup(groupId);
    const db = await connectDatabase();
    return db.get('SELECT * FROM group_settings WHERE group_id = ? LIMIT 1', [groupId]);
  },

  async setWelcomeEnabled(groupId, enabled) {
    await ensureGroup(groupId);
    const db = await connectDatabase();
    const now = new Date().toISOString();
    return db.run('UPDATE group_settings SET welcome_enabled = ?, updated_at = ? WHERE group_id = ?', [enabled ? 1 : 0, now, groupId]);
  },

  async setWelcomeMessage(groupId, message) {
    await ensureGroup(groupId);
    const db = await connectDatabase();
    const now = new Date().toISOString();
    return db.run('UPDATE group_settings SET welcome_message = ?, updated_at = ? WHERE group_id = ?', [message, now, groupId]);
  }
};
