const { connectDatabase } = require('./connection');
const config = require('../config/env');
const logger = require('../config/logger');
const { normalizeJid } = require('../utils/jid');

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
  `);

  const now = new Date().toISOString();
  await db.run('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, 1, ?)', [normalizeJid(config.mainOwnerJid), now]);
  logger.info('database initialized');
}

module.exports = migrate;
