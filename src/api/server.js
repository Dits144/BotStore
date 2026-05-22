const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../database/connection');
const config = require('../config/env');
const logger = require('../config/logger');
const { getSock } = require('../services/whatsappService');
const { normalizeJid } = require('../utils/jid');
const crypto = require('crypto');

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
  const { email, password } = req.body;
  const db = await connectDatabase();
  
  // Seed owner if not exists
  const hashedAdminPw = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');
  await db.run('INSERT OR IGNORE INTO users (email, password, role, created_at) VALUES (?, ?, ?, ?)', [ADMIN_EMAIL, hashedAdminPw, 'owner', new Date().toISOString()]);

  const user = await db.get('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Email tidak ditemukan' });

  const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
  if (user.password !== hashedInput && user.password !== password) {
    return res.status(401).json({ error: 'Kredensial salah' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  
  let groups = [];
  if (user.role === 'owner') {
    const rentals = await db.all('SELECT group_id, group_name, created_at FROM rentals');
    groups = rentals.map(r => ({ token: r.group_id, name: r.group_name, linkedAt: r.created_at }));
  } else {
    const userGroups = await db.all('SELECT r.group_id, r.group_name, ug.created_at FROM user_groups ug JOIN rentals r ON ug.group_id = r.group_id WHERE ug.user_id = ?', [user.id]);
    groups = userGroups.map(r => ({ token: r.group_id, name: r.group_name, linkedAt: r.created_at }));
  }

  res.json({ email: user.email, role: user.role, token, groups });
});

// 1.5 Register Admin
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

  const db = await connectDatabase();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(400).json({ error: 'Email sudah terdaftar' });

  const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
  await db.run('INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, ?)', [email, hashedInput, 'admin', new Date().toISOString()]);
  
  res.json({ success: true });
});

// 2. Link Group
app.post('/api/groups/link', authenticate, async (req, res) => {
  const { groupToken, groupPassword } = req.body;
  const db = await connectDatabase();
  
  if (req.user.role === 'owner') {
    const rental = await db.get('SELECT group_id, group_name FROM rentals WHERE group_id = ?', [groupToken]);
    if (!rental) return res.status(404).json({ error: 'Grup tidak ditemukan di database sewa' });
    return res.json({ token: rental.group_id, name: rental.group_name, linkedAt: new Date().toISOString() });
  }

  const rental = await db.get('SELECT group_id, group_name, group_password FROM rentals WHERE group_id = ?', [groupToken]);
  if (!rental) return res.status(404).json({ error: 'Grup tidak ditemukan' });
  
  if (!rental.group_password || rental.group_password !== groupPassword) {
    return res.status(401).json({ error: 'Password grup salah' });
  }

  await db.run('INSERT OR IGNORE INTO user_groups (user_id, group_id, created_at) VALUES (?, ?, ?)', [req.user.id, groupToken, new Date().toISOString()]);
  
  res.json({
    token: rental.group_id,
    name: rental.group_name,
    linkedAt: new Date().toISOString()
  });
});

// 3. Get Products (Catalogues)
app.get('/api/products/:groupToken', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();
  
  if (req.user.role !== 'owner') {
    const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
    if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak untuk grup ini' });
  }

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
  
  if (req.user.role !== 'owner') {
    const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
    if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak' });
  }
  
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
  
  if (req.user.role !== 'owner') {
    const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
    if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak' });
  }

  await db.run('DELETE FROM catalogues WHERE id = ? AND group_id = ?', [id, groupToken]);
  res.json({ success: true });
});

// 6. Create Product
app.post('/api/products/:groupToken', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { name, description, inStock, fastDelivery, isRare } = req.body;
  const db = await connectDatabase();
  
  if (req.user.role !== 'owner') {
    const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
    if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak' });
  }

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

// 7. Get Rentals (Owner Only)
app.get('/api/rentals', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
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
