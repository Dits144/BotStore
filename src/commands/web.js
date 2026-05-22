const { connectDatabase } = require('../database/connection');
const { sans, monospace } = require('../utils/styledText');
const { isBotOwner } = require('../services/roleService');
const config = require('../config/env');

async function handle(ctx, parsed) {
  const { command } = parsed;
  if (command === 'dashboard') {
    return dashboard(ctx);
  }
  if (command === 'stok') {
    return stok(ctx);
  }
}

async function dashboard(ctx) {
  const { isGroup, chatJid, senderJid, role, sendText, sock } = ctx;

  if (!isGroup) {
    return sendText(`❌ ${sans('Perintah ini hanya bisa digunakan di dalam grup.')}`);
  }

  // Check if sender is admin or owner
  if (role !== 'admin' && role !== 'bot_owner') {
    return sendText(`❌ ${sans('Hanya admin grup atau owner yang bisa mengakses dashboard.')}`);
  }

  try {
    const webUrl = process.env.WEB_DASHBOARD_URL || 'https://web-anda.com/login';
    const message = `Halo! Berikut adalah akses Dashboard Web untuk grup ini:\n\n` +
      `🌐 *URL:* ${webUrl}\n` +
      `🔑 *Token Grup:* ${chatJid}\n\n` +
      `Silakan login menggunakan Email dan Password admin Anda.`;

    // Send private message
    await sock.sendMessage(senderJid, { text: message });
    return sendText(`✅ ${sans('Akses dashboard telah dikirim melalui pesan pribadi (PC).')}`);
  } catch (error) {
    console.error('Failed to send dashboard link:', error);
    return sendText(`❌ ${sans('Gagal mengirim akses dashboard. Pastikan Anda tidak memblokir bot.')}`);
  }
}

async function stok(ctx) {
  const { isGroup, chatJid, sendText } = ctx;

  if (!isGroup) {
    return sendText(`❌ ${sans('Perintah ini hanya bisa digunakan di dalam grup.')}`);
  }

  const db = await connectDatabase();
  const products = await db.all(
    'SELECT item_name, in_stock, fast_delivery, is_rare FROM catalogues WHERE group_id = ? ORDER BY item_name ASC',
    [chatJid]
  );

  if (products.length === 0) {
    return sendText(`ℹ️ ${sans('Belum ada produk di grup ini.')}`);
  }

  let text = `📦 *STOK PRODUK SAAT INI* 📦\n\n`;

  for (const p of products) {
    const inStock = Boolean(p.in_stock);
    const fastDelivery = Boolean(p.fast_delivery);
    const isRare = Boolean(p.is_rare);

    let icons = inStock ? '✅' : '❌';
    if (fastDelivery) icons += ' ⚡';
    if (isRare) icons += ' ❗';

    text += `- ${p.item_name} (${icons})\n`;
  }

  return sendText(text);
}

module.exports = { handle, dashboard, stok };
