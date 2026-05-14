const { connectDatabase } = require('./connection');
const config = require('../config/env');
const logger = require('../config/logger');
const { normalizeJid } = require('../utils/jid');

async function ensureColumn(db, table, column, ddl) {
  const columns = await db.all(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

async function migrate() {
  const db = await connectDatabase();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL UNIQUE,
      is_main INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL UNIQUE,
      group_name TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      expired_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      added_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS catalogues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      description TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(group_id, item_name)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL UNIQUE,
      welcome_enabled INTEGER NOT NULL DEFAULT 0,
      welcome_message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      customer_jid TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sukses',
      created_at TEXT NOT NULL
    );
  `);

  await ensureColumn(db, 'catalogues', 'media_path', 'media_path TEXT NOT NULL DEFAULT ""');
  await ensureColumn(db, 'catalogues', 'media_type', 'media_type TEXT NOT NULL DEFAULT ""');

  const now = new Date().toISOString();
  await db.run('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, 1, ?)', [normalizeJid(config.mainOwnerJid), now]);

  // Also register LID-based JID for owner recognition in groups
  if (config.mainOwnerLid) {
    const lidNormalized = normalizeJid(config.mainOwnerLid);
    if (lidNormalized) {
      await db.run('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, 1, ?)', [lidNormalized, now]);
    }
  }

  logger.info('database initialized');
}

module.exports = migrate;
