const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const config = require('../config/env');
const logger = require('../config/logger');

let dbPromise;

async function connectDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const dir = path.dirname(config.databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info({ dir }, 'database directory created');
    }

    try {
      const db = await open({
        filename: config.databasePath,
        driver: sqlite3.Database
      });

      await db.exec('PRAGMA journal_mode = WAL;');
      await db.exec('PRAGMA foreign_keys = ON;');
      logger.info({ file: config.databasePath }, 'database connected');
      return db;
    } catch (error) {
      logger.error({ err: error }, 'failed to connect database');
      throw new Error('Gagal terhubung ke database SQLite. Periksa dependency sqlite3 dan hak akses file.');
    }
  })();

  return dbPromise;
}

module.exports = { connectDatabase };
