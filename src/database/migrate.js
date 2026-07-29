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
    
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL,
      group_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      jid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      trx_id       TEXT    NOT NULL UNIQUE,
      group_id     TEXT    NOT NULL,
      group_name   TEXT    NOT NULL DEFAULT '',
      customer_jid TEXT    NOT NULL,
      admin_jid    TEXT    NOT NULL DEFAULT '',
      product      TEXT    NOT NULL DEFAULT '',
      amount       INTEGER NOT NULL DEFAULT 0,
      status       TEXT    NOT NULL DEFAULT 'pending',
      image_path   TEXT    NOT NULL DEFAULT '',
      ocr_raw      TEXT    NOT NULL DEFAULT '',
      created_at   TEXT    NOT NULL,
      updated_at   TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_trx_group   ON transactions(group_id);
    CREATE INDEX IF NOT EXISTS idx_trx_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_trx_status  ON transactions(status);
  `);

  await ensureColumn(db, 'catalogues', 'media_path', 'media_path TEXT NOT NULL DEFAULT ""');
  await ensureColumn(db, 'catalogues', 'media_type', 'media_type TEXT NOT NULL DEFAULT ""');
  await ensureColumn(db, 'catalogues', 'in_stock', 'in_stock INTEGER NOT NULL DEFAULT 1');
  await ensureColumn(db, 'catalogues', 'fast_delivery', 'fast_delivery INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'catalogues', 'is_rare', 'is_rare INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'rentals', 'group_password', 'group_password TEXT');
  await ensureColumn(db, 'group_settings', 'payment_caption', 'payment_caption TEXT');

  const now = new Date().toISOString();
  await db.run('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, 1, ?)', [normalizeJid(config.mainOwnerJid), now]);

  // Also register LID-based JID for owner recognition in groups
  if (config.mainOwnerLid) {
    const lidNormalized = normalizeJid(config.mainOwnerLid);
    if (lidNormalized) {
      await db.run('INSERT OR IGNORE INTO owners (jid, is_main, created_at) VALUES (?, 1, ?)', [lidNormalized, now]);
    }
  }

  // Clean up existing payment captions to strip out OCR note and footer from input
  try {
    const rows = await db.all('SELECT group_id, payment_caption FROM group_settings WHERE payment_caption IS NOT NULL');
    for (const row of rows) {
      if (row.payment_caption) {
        const cleaned = cleanCaption(row.payment_caption);
        if (cleaned !== row.payment_caption) {
          await db.run('UPDATE group_settings SET payment_caption = ? WHERE group_id = ?', [cleaned, row.group_id]);
          logger.info({ groupId: row.group_id }, 'Cleaned group payment_caption in database');
        }
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to clean group_settings payment_caption');
  }

  try {
    const row = await db.get('SELECT value FROM settings WHERE key = "payment_caption"');
    if (row && row.value) {
      const cleaned = cleanCaption(row.value);
      if (cleaned !== row.value) {
        await db.run('UPDATE settings SET value = ? WHERE key = "payment_caption"', [cleaned]);
        logger.info('Cleaned global payment_caption in database');
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to clean global payment_caption');
  }

  logger.info('database initialized');
}

function cleanCaption(caption) {
  if (!caption) return caption;
  let cleaned = caption;
  // Remove OCR note line and any leading/trailing newlines/whitespace
  cleaned = cleaned.replace(/\r?\n\s*📸\s*\*?Kirim ss Bukti Tf.*?(?:\r?\n|$)/gi, '\n');
  cleaned = cleaned.replace(/📸\s*\*?Kirim ss Bukti Tf.*/gi, '');
  // Remove footer line: "Pembayaran untuk ..."
  cleaned = cleaned.replace(/\r?\n\s*Pembayaran untuk.*?(?:\r?\n|$)/gi, '\n');
  cleaned = cleaned.replace(/Pembayaran untuk.*/gi, '');
  return cleaned.trim();
}

module.exports = migrate;
