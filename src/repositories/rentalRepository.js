const db = require('../database/connection');

module.exports = {
  upsertRental(payload) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO rentals (group_id, group_name, duration_days, expired_at, is_active, added_by, created_at, updated_at)
      VALUES (@group_id, @group_name, @duration_days, @expired_at, @is_active, @added_by, @created_at, @updated_at)
      ON CONFLICT(group_id) DO UPDATE SET
      group_name = excluded.group_name,
      duration_days = excluded.duration_days,
      expired_at = excluded.expired_at,
      is_active = excluded.is_active,
      added_by = excluded.added_by,
      updated_at = excluded.updated_at
    `).run({
      ...payload,
      is_active: payload.is_active ? 1 : 0,
      created_at: now,
      updated_at: now
    });
  },

  deleteRental(groupId) {
    return db.prepare('UPDATE rentals SET is_active = 0, updated_at = ? WHERE group_id = ?')
      .run(new Date().toISOString(), groupId);
  },

  getRental(groupId) {
    return db.prepare('SELECT * FROM rentals WHERE group_id = ? LIMIT 1').get(groupId);
  },

  listRentals() {
    return db.prepare('SELECT * FROM rentals ORDER BY updated_at DESC').all();
  },

  refreshStatus(nowIso) {
    return db.prepare(`
      UPDATE rentals
      SET is_active = CASE WHEN datetime(expired_at) > datetime(?) THEN 1 ELSE 0 END,
          updated_at = ?
    `).run(nowIso, nowIso);
  }
};
