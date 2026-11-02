'use strict';
/**
 * transactionRepository.js — CRUD & statistik untuk tabel transactions
 */
const { connectDatabase } = require('../database/connection');
const { expiryFrom, warrantyStatus } = require('../services/warrantyService');

async function getByPaymentMessage(groupId, paymentMessageId) {
  if (!paymentMessageId) return null;
  const db = await connectDatabase();
  return db.get('SELECT * FROM transactions WHERE group_id = ? AND payment_message_id = ?', [groupId, paymentMessageId]);
}

async function markPaymentStatus(groupId, paymentMessageId, customerJid, status) {
  if (!paymentMessageId) return null;
  const db = await connectDatabase();
  const row = await getByPaymentMessage(groupId, paymentMessageId);
  if (!row || row.customer_jid !== customerJid) return null;
  const now = new Date().toISOString();
  await db.run('UPDATE transactions SET status = ?, done_at = CASE WHEN ? = \'done\' THEN COALESCE(done_at, ?) ELSE NULL END, updated_at = ? WHERE trx_id = ?', [status, status, now, now, row.trx_id]);
  return row.trx_id;
}

async function listWarranties(userId, isOwner, limit = 200, offset = 0) {
  const db = await connectDatabase();
  const rows = await db.all(`SELECT t.*, c.name AS customer_name FROM transactions t
    LEFT JOIN contacts c ON t.customer_jid = c.jid
    WHERE (? = 1 OR EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = ? AND ug.group_id = t.group_id))
    ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
  [isOwner ? 1 : 0, userId, Math.min(Math.max(Number(limit) || 200, 1), 500), Math.max(Number(offset) || 0, 0)]);
  return rows.map(row => ({
    trx_id: row.trx_id, group_name: row.group_name, group_id: row.group_id,
    customer_name: row.customer_name || row.customer_jid?.split('@')[0] || '-',
    product: row.product, duration_label: row.duration_label,
    started_at: row.started_at, expires_at: row.expires_at,
    status: row.status, warranty_status: warrantyStatus(row),
  }));
}


module.exports = {
  getByPaymentMessage,
  markPaymentStatus,
  listWarranties,
  /**
   * Simpan transaksi baru
   * @param {object} data
   */
  async create(data) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO transactions
        (trx_id, group_id, group_name, customer_jid, admin_jid, product, amount, status, image_path, ocr_raw,
         payment_message_id, duration_value, duration_unit, duration_label, started_at, expires_at, done_at,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.trxId,
        data.groupId,
        data.groupName || '',
        data.customerJid,
        data.adminJid || '',
        data.product || '',
        data.amount || 0,
        data.status || 'pending',
        data.imagePath || '',
        data.ocrRaw || '',
        data.paymentMessageId || null,
        data.durationValue ?? null,
        data.durationUnit || null,
        data.durationLabel || null,
        data.startedAt || null,
        data.expiresAt || null,
        data.doneAt || null,
        data.createdAt || now,
        now,
      ]
    );
    return data.trxId;
  },

  /**
   * Update durasi transaksi
   */
  async updateDuration(trxId, duration, startedAt) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    const expiresAt = expiryFrom(startedAt, duration);
    await db.run(
      `UPDATE transactions SET
         duration_value = ?,
         duration_unit = ?,
         duration_label = ?,
         started_at = ?,
         expires_at = ?,
         updated_at = ?
       WHERE trx_id = ?`,
      [
        duration ? duration.value : null,
        duration ? duration.unit : null,
        duration ? duration.label : null,
        startedAt,
        expiresAt,
        now,
        trxId,
      ]
    );
  },

  /**
   * Update status transaksi
   */
  async updateStatus(trxId, status) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    await db.run(
      'UPDATE transactions SET status = ?, updated_at = ? WHERE trx_id = ?',
      [status, now, trxId]
    );
  },

  /**
   * Ambil riwayat transaksi per grup
   */
  async getByGroup(groupId, limit = 50, offset = 0) {
    const db = await connectDatabase();
    return db.all(
      `SELECT t.*, c.name AS customer_name
       FROM transactions t
       LEFT JOIN contacts c ON t.customer_jid = c.jid
       WHERE t.group_id = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [groupId, limit, offset]
    );
  },

  /**
   * Ambil semua transaksi (owner)
   */
  async getAll(limit = 100, offset = 0) {
    const db = await connectDatabase();
    return db.all(
      `SELECT t.*, c.name AS customer_name
       FROM transactions t
       LEFT JOIN contacts c ON t.customer_jid = c.jid
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  /**
   * Statistik hari ini
   * @param {string|null} groupId - null untuk semua grup
   */
  async statsToday(groupId = null) {
    const db = await connectDatabase();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const whereGroup = groupId ? 'AND group_id = ?' : '';
    const params = groupId ? [today, groupId] : [today];
    const row = await db.get(
      `SELECT
         COUNT(*) AS total_count,
         COALESCE(SUM(CASE WHEN status = 'done' THEN amount ELSE 0 END), 0) AS revenue_done,
         COALESCE(SUM(CASE WHEN status = 'refund' THEN amount ELSE 0 END), 0) AS revenue_refund,
         COALESCE(SUM(amount), 0) AS revenue_all
       FROM transactions
       WHERE date(created_at) = ? ${whereGroup}`,
      params
    );
    return row || { total_count: 0, revenue_done: 0, revenue_refund: 0, revenue_all: 0 };
  },

  /**
   * Statistik bulan tertentu
   */
  async statsMonth(groupId = null, year, month) {
    const db = await connectDatabase();
    const y = year || new Date().getFullYear();
    const m = String(month || new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}`;
    const whereGroup = groupId ? 'AND group_id = ?' : '';
    const params = groupId ? [prefix, groupId] : [prefix];
    const row = await db.get(
      `SELECT
         COUNT(*) AS total_count,
         COALESCE(SUM(CASE WHEN status = 'done' THEN amount ELSE 0 END), 0) AS revenue_done,
         COALESCE(SUM(CASE WHEN status = 'refund' THEN amount ELSE 0 END), 0) AS revenue_refund,
         COALESCE(SUM(amount), 0) AS revenue_all
       FROM transactions
       WHERE strftime('%Y-%m', created_at) = ? ${whereGroup}`,
      params
    );
    return row || { total_count: 0, revenue_done: 0, revenue_refund: 0, revenue_all: 0 };
  },

  /**
   * Data chart 12 bulan terakhir
   */
  async statsMonthlyChart(groupId = null, year) {
    const db = await connectDatabase();
    const y = year || new Date().getFullYear();
    const whereGroup = groupId ? 'AND group_id = ?' : '';
    const params = groupId ? [String(y), groupId] : [String(y)];
    const rows = await db.all(
      `SELECT
         strftime('%m', created_at) AS month,
         COUNT(*) AS total_count,
         COALESCE(SUM(CASE WHEN status = 'done' THEN amount ELSE 0 END), 0) AS revenue_done,
         COALESCE(SUM(CASE WHEN status = 'refund' THEN amount ELSE 0 END), 0) AS revenue_refund
       FROM transactions
       WHERE strftime('%Y', created_at) = ? ${whereGroup}
       GROUP BY month
       ORDER BY month ASC`,
      params
    );
    // Pad dengan 12 bulan (isi 0 jika tidak ada data)
    const map = {};
    rows.forEach(r => { map[r.month] = r; });
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const revDone = map[m]?.revenue_done || 0;
      const revRefund = map[m]?.revenue_refund || 0;
      return {
        month: m,
        total_count: map[m]?.total_count || 0,
        revenue_done: revDone,
        revenue_refund: revRefund,
        profit: revDone - revRefund,
      };
    });
  },

  /**
   * Produk terlaris (berdasarkan frekuensi transaksi)
   */
  async topProducts(groupId = null, limit = 10) {
    const db = await connectDatabase();
    const whereGroup = groupId ? 'WHERE group_id = ?' : '';
    const rows = await db.all(
      `SELECT product, COUNT(*) AS count,
         COALESCE(SUM(CASE WHEN status = 'done' THEN amount ELSE 0 END), 0) AS revenue
       FROM transactions
       ${whereGroup}
       GROUP BY product
       ORDER BY count DESC
       LIMIT ?`,
      groupId ? [groupId, limit] : [limit]
    );
    return rows.filter(r => r.product && r.product.trim());
  },

  /**
   * Ringkasan per grup (owner dashboard)
   */
  async summaryByGroup() {
    const db = await connectDatabase();
    return db.all(
      `SELECT
         group_id, group_name,
         COUNT(*) AS total_count,
         COALESCE(SUM(CASE WHEN status = 'done' THEN amount ELSE 0 END), 0) AS revenue_done
       FROM transactions
       GROUP BY group_id
       ORDER BY revenue_done DESC`
    );
  },

  /**
   * Hapus hanya data riwayat transaksi dan rekap grafik penjualan (dari tabel transactions) untuk grup tertentu
   */
  async clearAll(groupId) {
    const db = await connectDatabase();
    await db.run('DELETE FROM transactions WHERE group_id = ?', [groupId]);
  }
};
