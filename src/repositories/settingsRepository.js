const { connectDatabase } = require('../database/connection');

module.exports = {
  /**
   * Get a settings value by key
   * @param {string} key
   * @param {string} defaultValue
   * @returns {Promise<string>}
   */
  async get(key, defaultValue = '') {
    try {
      const db = await connectDatabase();
      const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
      return row ? row.value : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  },

  /**
   * Set/update a setting value
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    await db.run(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      [key, value, now]
    );
  }
};
