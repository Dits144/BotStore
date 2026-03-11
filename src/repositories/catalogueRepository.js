const { connectDatabase } = require('../database/connection');

module.exports = {
  async addItem(groupId, itemName, description, createdBy) {
    const db = await connectDatabase();
    const now = new Date().toISOString();
    return db.run(
      `INSERT INTO catalogues (group_id, item_name, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [groupId, itemName, description, createdBy, now, now]
    );
  },

  async deleteItem(groupId, itemName) {
    const db = await connectDatabase();
    return db.run('DELETE FROM catalogues WHERE group_id = ? AND item_name = ?', [groupId, itemName]);
  },

  async updateItem(groupId, itemName, description) {
    const db = await connectDatabase();
    return db.run('UPDATE catalogues SET description = ?, updated_at = ? WHERE group_id = ? AND item_name = ?', [description, new Date().toISOString(), groupId, itemName]);
  },

  async getItem(groupId, itemName) {
    const db = await connectDatabase();
    return db.get('SELECT * FROM catalogues WHERE group_id = ? AND item_name = ? LIMIT 1', [groupId, itemName]);
  },

  async listByGroup(groupId) {
    const db = await connectDatabase();
    return db.all('SELECT * FROM catalogues WHERE group_id = ? ORDER BY item_name ASC', [groupId]);
  }
};
