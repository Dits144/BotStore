const db = require('../database/connection');

module.exports = {
  addItem(groupId, itemName, description, createdBy) {
    return db.prepare(`
      INSERT INTO catalogues (group_id, item_name, description, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(groupId, itemName, description, createdBy, new Date().toISOString(), new Date().toISOString());
  },

  deleteItem(groupId, itemName) {
    return db.prepare('DELETE FROM catalogues WHERE group_id = ? AND item_name = ?').run(groupId, itemName);
  },

  updateItem(groupId, itemName, description) {
    return db.prepare('UPDATE catalogues SET description = ?, updated_at = ? WHERE group_id = ? AND item_name = ?')
      .run(description, new Date().toISOString(), groupId, itemName);
  },

  getItem(groupId, itemName) {
    return db.prepare('SELECT * FROM catalogues WHERE group_id = ? AND item_name = ? LIMIT 1').get(groupId, itemName);
  },

  listByGroup(groupId) {
    return db.prepare('SELECT * FROM catalogues WHERE group_id = ? ORDER BY item_name ASC').all(groupId);
  }
};
