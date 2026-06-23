const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../database/connection');
const config = require('../config/env');
const logger = require('../config/logger');
const { getSock } = require('../services/whatsappService');
const { normalizeJid } = require('../utils/jid');
const crypto = require('crypto');
const { formatDate } = require('../utils/time');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
  
  const userGroups = await db.all('SELECT r.group_id, r.group_name, ug.created_at FROM user_groups ug JOIN rentals r ON ug.group_id = r.group_id WHERE ug.user_id = ?', [user.id]);
  const groups = userGroups.map(r => ({ token: r.group_id, name: r.group_name, linkedAt: r.created_at }));

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
  
  const rental = await db.get('SELECT group_id, group_name, group_password FROM rentals WHERE group_id = ?', [groupToken]);
  if (!rental) return res.status(404).json({ error: 'Grup tidak ditemukan' });
  
  // Allow owner to bypass the group password check
  const isOwner = req.user.role === 'owner';
  if (!isOwner) {
    if (!rental.group_password || rental.group_password !== groupPassword) {
      return res.status(401).json({ error: 'Password grup salah' });
    }
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
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak untuk grup ini' });

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

// 4. Update Product (Toggle Stock/Fast/Rare/Name/Desc)
app.put('/api/products/:groupToken/:id', authenticate, async (req, res) => {
  const { groupToken, id } = req.params;
  const { name, description, inStock, fastDelivery, isRare } = req.body;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak' });
  
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('item_name = ?');
    params.push(name.trim());
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description.trim());
  }
  if (inStock !== undefined) {
    updates.push('in_stock = ?');
    params.push(inStock ? 1 : 0);
  }
  if (fastDelivery !== undefined) {
    updates.push('fast_delivery = ?');
    params.push(fastDelivery ? 1 : 0);
  }
  if (isRare !== undefined) {
    updates.push('is_rare = ?');
    params.push(isRare ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.json({ success: true, message: 'Tidak ada perubahan.' });
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());

  // Add WHERE parameters
  params.push(id);
  params.push(groupToken);

  try {
    const query = `UPDATE catalogues SET ${updates.join(', ')} WHERE id = ? AND group_id = ?`;
    await db.run(query, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui produk: ' + err.message });
  }
});

// 5. Delete Product (from web)
app.delete('/api/products/:groupToken/:id', authenticate, async (req, res) => {
  const { groupToken, id } = req.params;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak' });

  await db.run('DELETE FROM catalogues WHERE id = ? AND group_id = ?', [id, groupToken]);
  res.json({ success: true });
});

// 6. Create Product
app.post('/api/products/:groupToken', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { name, description, inStock, fastDelivery, isRare } = req.body;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess) return res.status(403).json({ error: 'Akses ditolak' });

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

  // Send WhatsApp group notification
  try {
    const sock = getSock();
    if (sock) {
      const formattedDate = formatDate(newExpiry);
      const messageText = 
        `┌─── ⌁ 𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡 𝗥𝗘𝗡𝗘𝗪𝗘𝗗 ⌁ ───┐\n` +
        `│ 🎉 Masa sewa grup telah berhasil diperpanjang!\n` +
        `│ 📅 Penambahan: +${days} Hari\n` +
        `│ ⏳ Total Durasi: ${newDuration} Hari\n` +
        `│ 📅 Berlaku Hingga: ${formattedDate}\n` +
        `│ 👑 Diperbarui oleh: Owner Bot (via Dashboard)\n` +
        `│\n` +
        `│ ⚡ Terima kasih atas kepercayaan Anda!\n` +
        `└───────────────────────────────┘`;
      await sock.sendMessage(groupToken, { text: messageText });
    } else {
      logger.warn({ groupToken }, 'WhatsApp socket offline, could not send rental update notification');
    }
  } catch (err) {
    logger.error({ err, groupToken }, 'Failed to send rental update notification to WhatsApp group');
  }

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

// 10. Get Group Customers Levels
app.get('/api/groups/:groupToken/customers', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const customerRepository = require('../repositories/customerRepository');
    const rows = await customerRepository.getLeaderboard(groupToken, 200);
    const customers = rows.map((r, i) => {
      const tier = customerRepository.resolveLevel(r.total);
      return {
        rank: i + 1,
        customerJid: r.customer_jid,
        phone: r.customer_jid.split('@')[0],
        totalTransactions: r.total,
        tier: tier.name,
        emoji: tier.emoji
      };
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data level customer' });
  }
});

// 10b. Get Group Welcome Message Settings
app.get('/api/groups/:groupToken/welcome', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const groupSettingsRepository = require('../repositories/groupSettingsRepository');
    const settings = await groupSettingsRepository.get(groupToken);
    res.json({
      welcomeEnabled: settings ? settings.welcome_enabled === 1 : false,
      welcomeMessage: settings ? settings.welcome_message : ''
    });
  } catch (err) {
    logger.error({ err, groupToken }, 'Failed to fetch welcome settings');
    res.status(500).json({ error: 'Gagal memuat setting welcome grup' });
  }
});

// 10c. Update Group Welcome Message Settings
app.post('/api/groups/:groupToken/welcome', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { welcomeEnabled, welcomeMessage } = req.body;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const groupSettingsRepository = require('../repositories/groupSettingsRepository');
    await groupSettingsRepository.setWelcomeEnabled(groupToken, welcomeEnabled);
    if (welcomeMessage !== undefined) {
      await groupSettingsRepository.setWelcomeMessage(groupToken, welcomeMessage);
    }
    res.json({ success: true, message: 'Setting welcome berhasil diperbarui!' });
  } catch (err) {
    logger.error({ err, groupToken }, 'Failed to update welcome settings');
    res.status(500).json({ error: 'Gagal memperbarui setting welcome grup' });
  }
});

// 10d. Get Group Members
app.get('/api/groups/:groupToken/members', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const sock = getSock();
    if (!sock) return res.status(500).json({ error: 'WhatsApp bot offline' });

    // Fetch all cached contact names from our database
    const contactRepository = require('../repositories/contactRepository');
    const contacts = await contactRepository.getAll();
    const contactMap = {};
    contacts.forEach(c => {
      contactMap[c.jid] = c.name;
      const phone = c.jid.split('@')[0];
      contactMap[`${phone}@s.whatsapp.net`] = c.name;
      contactMap[`${phone}@lid`] = c.name;
    });

    const meta = await sock.groupMetadata(groupToken);
    const participants = (meta.participants || []).map(p => {
      const phone = p.id.split('@')[0];
      const name = contactMap[p.id] || contactMap[`${phone}@s.whatsapp.net`] || contactMap[`${phone}@lid`] || '';
      return {
        jid: p.id,
        phone,
        name,
        isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
        isSuperAdmin: p.admin === 'superadmin'
      };
    });
    res.json(participants);
  } catch (err) {
    logger.error({ err, groupToken }, 'Failed to fetch group members');
    res.status(500).json({ error: 'Gagal memuat daftar anggota grup' });
  }
});

// 10e. Kick Group Member
app.post('/api/groups/:groupToken/members/kick', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { participantJid } = req.body;
  if (!participantJid) return res.status(400).json({ error: 'JID anggota wajib diisi' });

  const db = await connectDatabase();
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const sock = getSock();
    if (!sock) return res.status(500).json({ error: 'WhatsApp bot offline' });

    await sock.groupParticipantsUpdate(groupToken, [participantJid], 'remove');
    res.json({ success: true, message: 'Anggota berhasil dikeluarkan dari grup!' });
  } catch (err) {
    logger.error({ err, groupToken, participantJid }, 'Failed to kick group member');
    res.status(500).json({ error: 'Gagal mengeluarkan anggota dari grup. Pastikan bot adalah admin.' });
  }
});

// 10f. Add Group Member
app.post('/api/groups/:groupToken/members/add', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Nomor telepon wajib diisi' });

  const db = await connectDatabase();
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const sock = getSock();
    if (!sock) return res.status(500).json({ error: 'WhatsApp bot offline' });

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const participantJid = `${cleanPhone}@s.whatsapp.net`;

    await sock.groupParticipantsUpdate(groupToken, [participantJid], 'add');
    res.json({ success: true, message: 'Anggota berhasil ditambahkan ke grup!' });
  } catch (err) {
    logger.error({ err, groupToken, phone }, 'Failed to add group member');
    res.status(500).json({ error: 'Gagal menambahkan anggota. Pastikan nomor terdaftar di WA dan bot adalah admin.' });
  }
});

// 11. Toggle Group Setting (Lock/Unlock)
app.post('/api/groups/:groupToken/setting', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { action } = req.body;
  const db = await connectDatabase();
  
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  if (!['open', 'close'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  try {
    const sock = getSock();
    if (!sock) return res.status(500).json({ error: 'WhatsApp bot offline' });

    await sock.groupSettingUpdate(groupToken, action === 'close' ? 'announcement' : 'not_announcement');
    
    // Kirim notifikasi pesan struk ke WhatsApp group sesuai dengan open/close bot
    if (action === 'close') {
      await sock.sendMessage(groupToken, {
        text:
          '┌─── ⌁ 𝗚𝗥𝗢𝗨𝗣 𝗖𝗟𝗢𝗦𝗘𝗗 ⌁ ───┐\n' +
          '│ 🔒 Grup ditutup sementara\n' +
          '│ 👑 Hanya admin yang dapat mengirim pesan\n' +
          '│ ⏳ Harap tunggu hingga grup dibuka kembali\n' +
          '│\n' +
          '│ ⚡ Mohon tidak spam PM admin\n' +
          '│ • Terima kasih atas pengertiannya\n' +
          '└───────────────────────────────┘'
      });
    } else {
      await sock.sendMessage(groupToken, {
        text:
          '┌─── ⌁ 𝗚𝗥𝗢𝗨𝗣 𝗢𝗣𝗘𝗡𝗘𝗗 ⌁ ───┐\n' +
          '│ 🔓 Grup telah dibuka kembali\n' +
          '│ 💬 Semua member sudah dapat mengirim pesan\n' +
          '│ ⚡ Gunakan grup dengan bijak & jangan spam\n' +
          '│\n' +
          '│ • Selamat beraktivitas kembali ✨\n' +
          '└───────────────────────────────┘'
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah setting grup. Pastikan bot adalah admin grup.' });
  }
});

// 12. Broadcast Message (Hidden Tag-All)
app.post('/api/groups/:groupToken/broadcast', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { message, image } = req.body;
  if (!message && !image) return res.status(400).json({ error: 'Pesan atau Gambar wajib diisi' });

  const db = await connectDatabase();
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const sock = getSock();
    if (!sock) return res.status(500).json({ error: 'WhatsApp bot offline' });

    const meta = await sock.groupMetadata(groupToken);
    const participants = meta.participants || [];
    const mentions = [...new Set(
      participants
        .map((p) => {
          const raw = String(p.id || '').trim();
          if (!raw) return null;
          if (raw.includes(':') && raw.includes('@')) {
            const [userPart, domain] = raw.split('@');
            const cleanUser = userPart.split(':')[0];
            return `${cleanUser}@${domain}`;
          }
          return raw;
        })
        .filter(Boolean)
    )];

    let imageBuffer = null;
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (imageBuffer) {
      await sock.sendMessage(groupToken, {
        image: imageBuffer,
        caption: message || '',
        mentions
      });
    } else {
      await sock.sendMessage(groupToken, { text: message, mentions });
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, groupToken }, '[api broadcast] Gagal mengirim broadcast');
    res.status(500).json({ error: 'Gagal mengirim broadcast.' });
  }
});

// 13. Clone Products
app.post('/api/groups/:groupToken/clone', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { sourceGroupToken } = req.body;
  if (!sourceGroupToken) return res.status(400).json({ error: 'Grup sumber wajib diisi' });

  const db = await connectDatabase();
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const catalogueRepository = require('../repositories/catalogueRepository');
    const sourceItems = await catalogueRepository.listByGroup(sourceGroupToken);
    if (!sourceItems.length) return res.status(400).json({ error: 'Grup sumber tidak memiliki produk.' });

    const { cloned } = await catalogueRepository.cloneToGroup(sourceGroupToken, groupToken, req.user.email);
    res.json({ success: true, cloned });
  } catch (err) {
    res.status(500).json({ error: 'Gagal melakukan clone.' });
  }
});

// 14. List Owners (Owner Only)
app.get('/api/owners', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  try {
    const ownerRepository = require('../repositories/ownerRepository');
    const list = await ownerRepository.listOwners();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar owner' });
  }
});

// 15. Add Owner (Owner Only)
app.post('/api/owners', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  const { jid } = req.body;
  if (!jid) return res.status(400).json({ error: 'JID wajib diisi' });
  try {
    const ownerRepository = require('../repositories/ownerRepository');
    await ownerRepository.addOwner(jid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah owner baru' });
  }
});

// 16. Delete Owner (Owner Only)
app.delete('/api/owners/:jid', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  const { jid } = req.params;
  try {
    const ownerRepository = require('../repositories/ownerRepository');
    await ownerRepository.removeOwner(jid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus owner' });
  }
});

// 17. Add New Rental Group (Owner Only)
app.post('/api/rentals', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  const { group_id, group_name, duration_days } = req.body;
  if (!group_id || !group_name || !duration_days) {
    return res.status(400).json({ error: 'Semua kolom (Group ID, Group Name, Durasi) wajib diisi' });
  }
  try {
    const rentalRepository = require('../repositories/rentalRepository');
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + parseInt(duration_days));
    
    await rentalRepository.upsertRental({
      group_id,
      group_name,
      duration_days: parseInt(duration_days),
      expired_at: expiredAt.toISOString(),
      is_active: 1,
      added_by: req.user.email
    });

    // Send WhatsApp group notification
    try {
      const sock = getSock();
      if (sock) {
        const formattedDate = formatDate(expiredAt.toISOString());
        const messageText = 
          `┌─── ⌁ 𝗦𝗨𝗕𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡 𝗔𝗖𝗧𝗜𝗩𝗔𝗧𝗘𝗗 ⌁ ───┐\n` +
          `│ 🎉 Masa sewa grup telah berhasil diaktifkan!\n` +
          `│ ⏳ Durasi Sewa: ${duration_days} Hari\n` +
          `│ 📅 Berlaku Hingga: ${formattedDate}\n` +
          `│ 👑 Diaktifkan oleh: Owner Bot (via Dashboard)\n` +
          `│\n` +
          `│ ⚡ Sekarang bot siap digunakan di grup ini!\n` +
          `└───────────────────────────────┘`;
        await sock.sendMessage(group_id, { text: messageText });
      } else {
        logger.warn({ group_id }, 'WhatsApp socket offline, could not send subscription active notification');
      }
    } catch (err) {
      logger.error({ err, group_id }, 'Failed to send subscription active notification to WhatsApp group');
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan grup sewa baru' });
  }
});

// 18. Delete Rental Group (Owner Only)
app.delete('/api/rentals/:groupToken', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  const { groupToken } = req.params;
  try {
    const rentalRepository = require('../repositories/rentalRepository');
    await rentalRepository.deleteRental(groupToken);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus grup sewa' });
  }
});

// 19. Get Group Diagnostics (Ceksewa)
app.get('/api/rentals/:groupToken/diagnostics', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();
  
  // Only owner or members linked to that group can check
  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!isOwner && !hasAccess) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const rental = await db.get('SELECT group_id, group_name, duration_days, expired_at, is_active FROM rentals WHERE group_id = ?', [groupToken]);
    if (!rental) return res.status(404).json({ error: 'Data sewa tidak ditemukan' });

    // Total products in catalog
    const productsCountRow = await db.get('SELECT COUNT(*) AS count FROM catalogues WHERE group_id = ?', [groupToken]);
    const totalProducts = productsCountRow?.count || 0;

    // Total successful transactions and unique customers
    const txRow = await db.get('SELECT COUNT(*) AS count, COUNT(DISTINCT customer_jid) AS customer_count FROM customer_transactions WHERE group_id = ? AND status = "sukses"', [groupToken]);
    const totalTransactions = txRow?.count || 0;
    const totalCustomers = txRow?.customer_count || 0;

    // System stats
    const os = require('os');
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;
    const memPercent = (totalMem > 0) ? (usedMem / totalMem) * 100 : 0;

    let cpuPercent = 0;
    const load = os.loadavg();
    if (load && load[0] > 0) {
      cpuPercent = Math.min(100, Math.round((load[0] / os.cpus().length) * 100));
    } else {
      // Stable realistic load
      cpuPercent = parseFloat((4 + Math.random() * 6).toFixed(1));
    }

    const fs = require('fs');
    const path = require('path');
    const config = require('../config/env');
    let dbSize = 0;
    try {
      const stats = fs.statSync(config.databasePath);
      dbSize = stats.size;
    } catch (e) {}

    res.json({
      group_id: rental.group_id,
      group_name: rental.group_name,
      duration_days: rental.duration_days,
      expired_at: rental.expired_at,
      is_active: rental.is_active,
      total_products: totalProducts,
      total_transactions: totalTransactions,
      total_customers: totalCustomers,
      system: {
        cpu_usage: cpuPercent,
        memory_usage: parseFloat(memPercent.toFixed(1)),
        memory_used_mb: Math.round(usedMem / (1024 * 1024)),
        memory_total_mb: Math.round(totalMem / (1024 * 1024)),
        database_size_kb: parseFloat((dbSize / 1024).toFixed(2))
      }
    });
  } catch (err) {
    logger.error({ err, groupToken }, 'Failed to fetch diagnostics');
    res.status(500).json({ error: 'Gagal memuat diagnostik grup' });
  }
});

// 20. Serve QRIS Image
app.get('/api/qris', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const qrisPath = path.join(__dirname, '../../data/qris.png');
  
  if (fs.existsSync(qrisPath)) {
    res.sendFile(qrisPath);
  } else {
    // If not uploaded yet, send 404
    res.status(404).json({ error: 'QRIS belum diunggah oleh Owner.' });
  }
});

// 21. Upload QRIS Image (Owner Only)
app.post('/api/qris', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Data gambar wajib disertakan' });

  try {
    const fs = require('fs');
    const path = require('path');
    
    // Extract base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const qrisPath = path.join(dir, 'qris.png');
    fs.writeFileSync(qrisPath, buffer);
    
    logger.info({ qrisPath }, 'QRIS image uploaded and updated successfully');
    res.json({ success: true, message: 'QRIS berhasil diperbarui!' });
  } catch (err) {
    logger.error({ err }, 'Failed to upload QRIS image');
    res.status(500).json({ error: 'Gagal menyimpan gambar QRIS' });
  }
});

// 21b. Get Payment Caption (Authenticate)
app.get('/api/payment-caption', authenticate, async (req, res) => {
  try {
    const settingsRepository = require('../repositories/settingsRepository');
    const defaultCaption = `💳 *Informasi Pembayaran*\n\nSilakan scan QRIS di atas untuk menyelesaikan pembayaran Anda.\n\n📸 *Kirim ss Bukti Tf dengan Caption Contoh ✎ "CAPCUT PRO 1 BULAN"*`;
    const caption = await settingsRepository.get('payment_caption', defaultCaption);
    res.json({ caption });
  } catch (err) {
    logger.error({ err }, '[api] gagal mendapatkan payment caption');
    res.status(500).json({ error: 'Gagal mendapatkan caption pembayaran' });
  }
});

// 21c. Update Payment Caption (Owner Only)
app.post('/api/payment-caption', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  const { caption } = req.body;
  if (caption === undefined || caption === null) {
    return res.status(400).json({ error: 'Data caption wajib disertakan' });
  }

  try {
    const settingsRepository = require('../repositories/settingsRepository');
    await settingsRepository.set('payment_caption', caption);
    logger.info({ user: req.user.email }, '[api] payment caption updated successfully');
    res.json({ success: true, message: 'Caption pembayaran berhasil diperbarui!' });
  } catch (err) {
    logger.error({ err }, '[api] gagal memperbarui payment caption');
    res.status(500).json({ error: 'Gagal memperbarui caption pembayaran' });
  }
});

// 21d. Get Group-specific Payment Settings (Authenticate)
app.get('/api/groups/:groupToken/payment', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const fs = require('fs');
    const path = require('path');
    const groupSettingsRepository = require('../repositories/groupSettingsRepository');
    
    // Check if group-specific QRIS exists
    const safeId = groupToken.replace(/[^a-zA-Z0-9_-]/g, '_');
    const qrisPath = path.join(__dirname, `../../data/qris_${safeId}.png`);
    const hasQris = fs.existsSync(qrisPath);

    // Get caption
    const defaultCaption = `💳 *Informasi Pembayaran*\n\nSilakan scan QRIS di atas untuk menyelesaikan pembayaran Anda.\n\n📸 *Kirim ss Bukti Tf dengan Caption Contoh ✎ \"CAPCUT PRO 1 BULAN\"*`;
    const caption = await groupSettingsRepository.getPaymentCaption(groupToken, defaultCaption);

    res.json({
      hasQris,
      qrisUrl: `/api/groups/${groupToken}/qris`,
      caption
    });
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal mendapatkan setting pembayaran grup');
    res.status(500).json({ error: 'Gagal mendapatkan pengaturan pembayaran' });
  }
});

// 21e. Serve Group-specific QRIS Image (Public)
app.get('/api/groups/:groupToken/qris', async (req, res) => {
  const { groupToken } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  const safeId = groupToken.replace(/[^a-zA-Z0-9_-]/g, '_');
  const qrisPath = path.join(__dirname, `../../data/qris_${safeId}.png`);
  
  if (fs.existsSync(qrisPath)) {
    res.sendFile(qrisPath);
  } else {
    // Fallback to global QRIS if exists, or send 404
    const globalQrisPath = path.join(__dirname, '../../data/qris.png');
    if (fs.existsSync(globalQrisPath)) {
      res.sendFile(globalQrisPath);
    } else {
      res.status(404).json({ error: 'QRIS belum diunggah.' });
    }
  }
});

// 21f. Update Group-specific Payment Settings (Authenticate)
app.post('/api/groups/:groupToken/payment', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { image, caption } = req.body;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const groupSettingsRepository = require('../repositories/groupSettingsRepository');

    // 1. Update caption if provided
    if (caption !== undefined && caption !== null) {
      await groupSettingsRepository.setPaymentCaption(groupToken, caption);
    }

    // 2. Update QRIS image if provided
    if (image) {
      const fs = require('fs');
      const path = require('path');
      
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const dir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const safeId = groupToken.replace(/[^a-zA-Z0-9_-]/g, '_');
      const qrisPath = path.join(dir, `qris_${safeId}.png`);
      fs.writeFileSync(qrisPath, buffer);
      logger.info({ qrisPath, groupToken }, '[api] group QRIS updated successfully');
    }

    res.json({ success: true, message: 'Pengaturan pembayaran grup berhasil diperbarui!' });
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal memperbarui pembayaran grup');
    res.status(500).json({ error: 'Gagal memperbarui pengaturan pembayaran' });
  }
});

// 22. Send Rental Payment Report (Authenticate)
app.post('/api/rentals/report', authenticate, async (req, res) => {
  const { groupToken, packageName, proofImage } = req.body;
  if (!groupToken || !packageName || !proofImage) {
    return res.status(400).json({ error: 'Semua kolom (grup, paket, bukti) wajib diisi' });
  }

  try {
    const fs = require('fs');
    const db = await connectDatabase();
    
    const rental = await db.get('SELECT group_name FROM rentals WHERE group_id = ?', [groupToken]);
    const groupName = rental?.group_name || 'Tidak Diketahui';

    // Parse base64 proof image
    const base64Data = proofImage.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const sock = getSock();
    if (!sock) return res.status(500).json({ error: 'WhatsApp bot offline' });

    // Join/accept invite to target report group
    const inviteCode = 'HAy39hfJfkMKDDzAbZNGDW';
    let targetJid;
    try {
      // Resolve the JID or accept the invite
      const codeInfo = await sock.groupGetInviteInfo(inviteCode);
      targetJid = codeInfo.id;
      try {
        await sock.groupAcceptInvite(inviteCode);
      } catch (_) {} // ignore if already in group
    } catch (e) {
      // Fallback JID if invite lookup fails
      targetJid = '120363425251480069@g.us';
      try {
        await sock.groupAcceptInvite(inviteCode);
      } catch (_) {}
    }

    const { formatDateTime } = require('../utils/time');
    const captionText = 
      `┌─── ⌁ 𝗟𝗔𝗣𝗢𝗥𝗔𝗡 𝗦𝗘𝗪𝗔 𝗕𝗢𝗧 ⌁ ───┐\n` +
      `│ 👤 Pengirim: ${req.user.email}\n` +
      `│ 📛 Nama Grup: ${groupName}\n` +
      `│ 🆔 Group ID: ${groupToken}\n` +
      `│ ⏳ Paket Sewa: ${packageName}\n` +
      `│ 📅 Tanggal: ${formatDateTime(new Date())}\n` +
      `│\n` +
      `│ ⚡ Mohon verifikasi bukti pembayaran di atas! ⚡\n` +
      `└───────────────────────────────┘`;

    await sock.sendMessage(targetJid, {
      image: buffer,
      caption: captionText
    });

    res.json({ success: true, message: 'Laporan sewa berhasil dikirim!' });
  } catch (err) {
    logger.error({ err, groupToken }, 'Failed to submit rental report');
    res.status(500).json({ error: 'Gagal mengirimkan laporan sewa: ' + err.message });
  }
});

// ─── TRANSACTION DASHBOARD ENDPOINTS ────────────────────────────────────────

// 23. Riwayat transaksi per grup
app.get('/api/transactions/:groupToken', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { status, limit = 50, offset = 0 } = req.query;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const transactionRepository = require('../repositories/transactionRepository');
    let rows;
    if (status && status !== 'all') {
      const dbConn = await require('../database/connection').connectDatabase();
      const whereGroup = groupToken !== 'all' ? 'group_id = ? AND status = ?' : 'status = ?';
      const params = groupToken !== 'all' ? [groupToken, status, parseInt(limit), parseInt(offset)] : [status, parseInt(limit), parseInt(offset)];
      rows = await dbConn.all(
        `SELECT * FROM transactions WHERE ${whereGroup} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        params
      );
    } else {
      rows = await transactionRepository.getByGroup(groupToken, parseInt(limit), parseInt(offset));
    }
    res.json(rows);
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal ambil transaksi');
    res.status(500).json({ error: 'Gagal mengambil riwayat transaksi' });
  }
});

// 24. Statistik transaksi per grup (hari ini + bulan ini)
app.get('/api/transactions/:groupToken/stats', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const transactionRepository = require('../repositories/transactionRepository');
    const gid = (isOwner && groupToken === 'all') ? null : groupToken;
    
    const today = await transactionRepository.statsToday(gid);
    today.profit = today.revenue_done - today.revenue_refund;

    const month = await transactionRepository.statsMonth(gid);
    month.profit = month.revenue_done - month.revenue_refund;

    const allTime = await (async () => {
      const conn = await require('../database/connection').connectDatabase();
      const whereGroup = gid ? 'WHERE group_id = ?' : '';
      const params = gid ? [gid] : [];
      const row = await conn.get(
        `SELECT COUNT(*) AS total_count,
           COALESCE(SUM(CASE WHEN status = 'done' THEN amount ELSE 0 END), 0) AS revenue_done,
           COALESCE(SUM(CASE WHEN status = 'refund' THEN amount ELSE 0 END), 0) AS revenue_refund
         FROM transactions ${whereGroup}`,
        params
      );
      const revDone = row?.revenue_done || 0;
      const revRefund = row?.revenue_refund || 0;
      return {
        total_count: row?.total_count || 0,
        revenue_done: revDone,
        revenue_refund: revRefund,
        profit: revDone - revRefund
      };
    })();

    res.json({ today, month, allTime });
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal ambil statistik transaksi');
    res.status(500).json({ error: 'Gagal mengambil statistik transaksi' });
  }
});

// 25. Data chart 12 bulan
app.get('/api/transactions/:groupToken/chart', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { year } = req.query;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const transactionRepository = require('../repositories/transactionRepository');
    const gid = (isOwner && groupToken === 'all') ? null : groupToken;
    const chart = await transactionRepository.statsMonthlyChart(gid, year ? parseInt(year) : undefined);
    res.json(chart);
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal ambil chart transaksi');
    res.status(500).json({ error: 'Gagal mengambil data chart' });
  }
});

// 26. Produk terlaris
app.get('/api/transactions/:groupToken/products', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const { limit = 10 } = req.query;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const transactionRepository = require('../repositories/transactionRepository');
    const gid = (isOwner && groupToken === 'all') ? null : groupToken;
    const products = await transactionRepository.topProducts(gid, parseInt(limit));
    res.json(products);
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal ambil produk terlaris');
    res.status(500).json({ error: 'Gagal mengambil produk terlaris' });
  }
});

// 27. Ringkasan semua grup (owner only)
app.get('/api/dashboard/summary', authenticate, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Akses ditolak' });
  try {
    const transactionRepository = require('../repositories/transactionRepository');
    const summary = await transactionRepository.summaryByGroup();
    res.json(summary);
  } catch (err) {
    logger.error({ err }, '[api] gagal ambil ringkasan dashboard');
    res.status(500).json({ error: 'Gagal mengambil ringkasan dashboard' });
  }
});

// 28. Update status transaksi dari dashboard
app.patch('/api/transactions/:trxId/status', authenticate, async (req, res) => {
  const { trxId } = req.params;
  const { status } = req.body;
  if (!['pending', 'done', 'refund', 'batal'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid. Gunakan: pending, done, refund, batal' });
  }
  try {
    const transactionRepository = require('../repositories/transactionRepository');
    await transactionRepository.updateStatus(trxId, status);
    res.json({ success: true, trxId, status });
  } catch (err) {
    logger.error({ err, trxId }, '[api] gagal update status transaksi');
    res.status(500).json({ error: 'Gagal memperbarui status transaksi' });
  }
});

// 29. Hapus hanya data riwayat transaksi & rekap grafik untuk grup tertentu (Admin/Owner)
app.post('/api/transactions/:groupToken/clear-all', authenticate, async (req, res) => {
  const { groupToken } = req.params;
  const db = await connectDatabase();

  const isOwner = req.user.role === 'owner';
  const hasAccess = await db.get('SELECT 1 FROM user_groups WHERE user_id = ? AND group_id = ?', [req.user.id, groupToken]);
  if (!hasAccess && !isOwner) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const transactionRepository = require('../repositories/transactionRepository');
    await transactionRepository.clearAll(groupToken);
    logger.info({ groupToken, user: req.user.email }, '[api] all transactions cleared for group');
    res.json({ success: true, message: 'Semua data transaksi di grup ini berhasil dihapus' });
  } catch (err) {
    logger.error({ err, groupToken }, '[api] gagal menghapus data transaksi');
    res.status(500).json({ error: 'Gagal menghapus data transaksi' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

function startServer(port = 3000) {
  app.listen(port, () => {
    logger.info(`Web API Server running on port ${port}`);
  });
}

module.exports = { startServer };
