const { connectDatabase } = require('../database/connection');

// ─── Level Config ──────────────────────────────────────────────────────────────
// Tier ditentukan oleh jumlah transaksi sukses kumulatif
const LEVEL_TIERS = [
  { name: 'Platinum', emoji: '💎', min: 500 },
  { name: 'Gold',     emoji: '🥇', min: 100 },
  { name: 'Silver',   emoji: '🥈', min: 25  },
  { name: 'Bronze',   emoji: '🥉', min: 1   },
];

function resolveLevel(totalSuccess) {
  for (const tier of LEVEL_TIERS) {
    if (totalSuccess >= tier.min) return tier;
  }
  return { name: 'Baru', emoji: '🆕', min: 0 };
}

// ─── Repository ────────────────────────────────────────────────────────────────
module.exports = {
  LEVEL_TIERS,
  resolveLevel,

  /** Tambah satu transaksi sukses untuk customer di grup ini */
  async addSuccessTransaction(groupId, customerJid) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO customer_transactions (group_id, customer_jid, status, created_at)
       VALUES (?, ?, 'sukses', ?)`,
      [groupId, customerJid, now]
    );
  },

  /** Hitung total transaksi sukses customer di grup ini */
  async countSuccess(groupId, customerJid) {
    const db = await connectDatabase();
    const row = await db.get(
      `SELECT COUNT(*) AS total FROM customer_transactions
       WHERE group_id = ? AND customer_jid = ? AND status = 'sukses'`,
      [groupId, customerJid]
    );
    return row?.total || 0;
  },

  /** Ambil level + total transaksi customer di grup ini */
  async getCustomerLevel(groupId, customerJid) {
    const total = await this.countSuccess(groupId, customerJid);
    const tier  = resolveLevel(total);
    return { total, tier };
  },

  /** Cek apakah fitur level aktif di grup */
  async isLevelEnabled(groupId) {
    const db = await connectDatabase();
    const row = await db.get(
      `SELECT value FROM settings WHERE key = ?`,
      [`level_enabled_${groupId}`]
    );
    return row ? row.value === '1' : true; // default aktif
  },

  /** Toggle fitur level di grup */
  async setLevelEnabled(groupId, enabled) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    await db.run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [`level_enabled_${groupId}`, enabled ? '1' : '0', now]
    );
  },

  /** Semua customer dengan jumlah transaksi terbanyak di grup (leaderboard) */
  async getLeaderboard(groupId, limit = 10) {
    const db = await connectDatabase();
    return db.all(
      `SELECT customer_jid, COUNT(*) AS total
       FROM customer_transactions
       WHERE group_id = ? AND status = 'sukses'
       GROUP BY customer_jid
       ORDER BY total DESC
       LIMIT ?`,
      [groupId, limit]
    );
  }
};
