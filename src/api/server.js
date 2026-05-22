const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../database/connection');
const config = require('../config/env');
const logger = require('../config/logger');
const { getSock } = require('../services/whatsappService');
const { normalizeJid } = require('../utils/jid');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey144';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dits144@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ditsanalah144';

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 1. Auth Login
app.post('/api/login', async (req, res) => {
  const { email, password, groupToken } = req.body;
  
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Kredensial salah' });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
  
  const db = await connectDatabase();
  const rentals = await db.all('SELECT group_id, group_name, created_at FROM rentals');
  
  const groups = rentals.map(r => ({
    token: r.group_id,
    name: r.group_name,
    linkedAt: r.created_at
  }));

  // If groupToken provided but not in groups, we can add it or just return existing
  if (groupToken && !groups.find(g => g.token === groupToken)) {
    groups.push({
      token: groupToken,
      name: groupToken.split('@')[0],
      linkedAt: new Date().toISOString()
    });
  }

  res.json({ email, token, groups });
});

// 2. Link Group
app.post('/api/groups/link', authenticate, async (req, res) => {
  const { groupToken } = req.body;
  res.json({
    token: groupToken,
    name: groupToken.split('@')[0],
    linkedAt: new Date().toISOString()
  });
});

// 3. Get Products (Catalogues)
app.get('/api/products/:groupToken', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();
  const products = await db.all('SELECT id, item_name, description, in_stock, fast_delivery, is_rare FROM catalogues WHERE group_id = ?', [groupToken]);
  
  res.json(products.map(p => ({
    id: p.id.toString(),
    name: p.item_name,
    description: p.description,
    price: 0, // Not used per user feedback
    category: 'Umum',
    inStock: Boolean(p.in_stock),
    fastDelivery: Boolean(p.fast_delivery),
    isRare: Boolean(p.is_rare)
  })));
});

// 4. Update Product (Toggle Stock/Fast/Rare)
app.put('/api/products/:groupToken/:id', authenticate, async (req, res) => {
  const { groupToken, id } = req.params;
  const { inStock, fastDelivery, isRare } = req.body;
  
  const db = await connectDatabase();
  await db.run(
    'UPDATE catalogues SET in_stock = ?, fast_delivery = ?, is_rare = ?, updated_at = ? WHERE id = ? AND group_id = ?',
    [inStock ? 1 : 0, fastDelivery ? 1 : 0, isRare ? 1 : 0, new Date().toISOString(), id, groupToken]
  );
  
  res.json({ success: true });
});

// 5. Delete Product (from web)
app.delete('/api/products/:groupToken/:id', authenticate, async (req, res) => {
  const { groupToken, id } = req.params;
  const db = await connectDatabase();
  await db.run('DELETE FROM catalogues WHERE id = ? AND group_id = ?', [id, groupToken]);
  res.json({ success: true });
});

// 6. Create Product
app.post('/api/products/:groupToken', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { name, description, inStock, fastDelivery, isRare } = req.body;
  
  const db = await connectDatabase();
  const now = new Date().toISOString();
  
  try {
    const result = await db.run(
      'INSERT INTO catalogues (group_id, item_name, description, created_by, created_at, updated_at, in_stock, fast_delivery, is_rare) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [groupToken, name, description || '', ADMIN_EMAIL, now, now, inStock ? 1 : 0, fastDelivery ? 1 : 0, isRare ? 1 : 0]
    );
    res.json({ id: result.lastID.toString(), name, description, inStock, fastDelivery, isRare });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 7. Get Rentals
app.get('/api/rentals', authenticate, async (req, res) => {
  const db = await connectDatabase();
  const rentals = await db.all('SELECT group_id, group_name, duration_days, expired_at, is_active FROM rentals');
  res.json(rentals);
});

// 8. Add Rental Time
app.post('/api/rentals/:groupToken/add_time', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { days } = req.body;
  if (!days) return res.status(400).json({ error: 'days is required' });

  const db = await connectDatabase();
  const rental = await db.get('SELECT expired_at, duration_days FROM rentals WHERE group_id = ?', [groupToken]);
  if (!rental) return res.status(404).json({ error: 'Rental not found' });

  const currentExpiry = new Date(rental.expired_at);
  currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));
  const newExpiry = currentExpiry.toISOString();
  const newDuration = rental.duration_days + parseInt(days);

  await db.run('UPDATE rentals SET expired_at = ?, duration_days = ?, updated_at = ? WHERE group_id = ?', [newExpiry, newDuration, new Date().toISOString(), groupToken]);
  res.json({ success: true, expiredAt: newExpiry });
});

// 9. Reduce Rental Time
app.post('/api/rentals/:groupToken/reduce_time', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { days } = req.body;
  if (!days) return res.status(400).json({ error: 'days is required' });

  const db = await connectDatabase();
  const rental = await db.get('SELECT expired_at, duration_days FROM rentals WHERE group_id = ?', [groupToken]);
  if (!rental) return res.status(404).json({ error: 'Rental not found' });

  const currentExpiry = new Date(rental.expired_at);
  currentExpiry.setDate(currentExpiry.getDate() - parseInt(days));
  const newExpiry = currentExpiry.toISOString();
  const newDuration = Math.max(0, rental.duration_days - parseInt(days));

  await db.run('UPDATE rentals SET expired_at = ?, duration_days = ?, updated_at = ? WHERE group_id = ?', [newExpiry, newDuration, new Date().toISOString(), groupToken]);
  res.json({ success: true, expiredAt: newExpiry });
});

function startServer(port = 3000) {
  app.listen(port, () => {
    logger.info(`Web API Server running on port ${port}`);
  });
}

module.exports = { startServer };
