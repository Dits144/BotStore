const { connectDatabase } = require('../database/connection');

module.exports = {
  async upsertRental(payload) {
    const db = await connectDatabase();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO rentals (group_id, group_name, duration_days, expired_at, is_active, added_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(group_id) DO UPDATE SET
       group_name = excluded.group_name,
       duration_days = excluded.duration_days,
       expired_at = excluded.expired_at,
       is_active = excluded.is_active,
       added_by = excluded.added_by,
       updated_at = excluded.updated_at`,
      [
        payload.group_id,
        payload.group_name,
        payload.duration_days,
        payload.expired_at,
        payload.is_active ? 1 : 0,
        payload.added_by,
        now,
        now
      ]
    );
  },

  async deleteRental(groupId) {
    const db = await connectDatabase();
    return db.run('UPDATE rentals SET is_active = 0, updated_at = ? WHERE group_id = ?', [new Date().toISOString(), groupId]);
  },

  async getRental(groupId) {
    const db = await connectDatabase();
    return db.get('SELECT * FROM rentals WHERE group_id = ? LIMIT 1', [groupId]);
  },

  async listRentals() {
    const db = await connectDatabase();
    return db.all('SELECT * FROM rentals ORDER BY updated_at DESC');
  },

  async refreshStatus(nowIso) {
    const db = await connectDatabase();
    return db.run(
      `UPDATE rentals
       SET is_active = CASE WHEN datetime(expired_at) > datetime(?) THEN 1 ELSE 0 END,
           updated_at = ?`,
      [nowIso, nowIso]
    );
  }
};
