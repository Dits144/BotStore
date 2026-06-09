'use strict';
/**
 * transactionRepository.js — CRUD & statistik untuk tabel transactions
 */
const { connectDatabase } = require('../database/connection');

module.exports = {
  /**
   * Simpan transaksi baru
   * @param {object} data
   */
  async create(data) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO transactions
        (trx_id, group_id, group_name, customer_jid, admin_jid, product, amount, status, image_path, ocr_raw, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        data.createdAt || now,
        now,
      ]
    );
    return data.trxId;
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
      `SELECT * FROM transactions WHERE group_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [groupId, limit, offset]
    );
  },

  /**
   * Ambil semua transaksi (owner)
   */
  async getAll(limit = 100, offset = 0) {
    const db = await connectDatabase();
    return db.all(
      `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
