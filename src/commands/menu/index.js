const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { sans } = require('../../utils/styledText');

// ─── Blok teks per section ────────────────────────────────────────────────────
const HEADER =
  `┏━━〔 📚 𝗕𝗢𝗧𝗦𝗧𝗢𝗥𝗘 𝗠𝗘𝗡𝗨 〕━━┓\n` +
  `┃ ◆  𝓟𝓻𝓮𝓶𝓲𝓾𝓶 𝓦𝓱𝓪𝓽𝓼𝓐𝓹𝓹 𝓑𝓸𝓽  ◆\n` +
  `┗━━━━━━━━━━━━━━━━━━━━━┛\n`;

const OWNER_SECTION =
  `\n👑 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨\n` +
  `• 👑 owner — tambah owner tambahan\n` +
  `• 🗑 delowner — hapus owner tambahan\n` +
  `• 📋 listowner — list owner bot\n` +
  `• ⚡ addsewa — tambah masa sewa grup\n` +
  `• ♻ renewsewa — perpanjang sewa grup\n` +
  `• 🗑 delsewa — hapus grup dari sewa\n` +
  `• 📋 listsewa — list grup sewa aktif\n` +
  `• 🔍 ceksewa — cek status sewa grup\n`;

const ADMIN_SECTION =
  `\n🛡 𝗔𝗗𝗠𝗜𝗡 𝗠𝗘𝗡𝗨\n` +
  `• 📦 addlist — tambah produk ke katalog\n` +
  `• 📝 updatelist — edit deskripsi produk\n` +
  `• ❌ dellist — hapus produk dari katalog\n` +
  `• 📋 clone — clone produk dari grup lain\n` +

  `• 👋 welcome — aktifkan/matikan ucapan welcome\n` +
  `• ✏ setwelcome — set template ucapan welcome\n` +
  `• 📢 h — broadcast tag-all tersembunyi\n` +
  `• 🔒 group close — tutup pengiriman pesan grup\n` +
  `• 🔓 group open — buka pengiriman pesan grup\n` +
  `• ⏳ p — nota transaksi status Pending\n` +
  `• 💳 d — nota transaksi status Done\n` +
  `• 🔄 r — nota transaksi status Refund\n` +
  `• ❌ b — nota transaksi status Batal\n` +
  `• 🔍 ceksewa — cek status sewa grup ini\n`;


const USER_SECTION =
  `\n👥 𝗨𝗦𝗘𝗥 𝗠𝗘𝗡𝗨\n` +
  `• 🛍 list — lihat katalog produk\n` +
  `• ℹ info — info detail grup\n` +
  `• 👤 myrole — cek role & status sewa Anda\n` +
  `• 📚 allmenu — tampilkan menu bot\n` +
  `• 📝 [nama produk] — langsung trigger detail produk\n`;

const FOOTER =
  `\n───────────────────────\n` +
  `✨ 𝘛𝘳𝘢𝘯𝘴𝘢𝘬𝘴𝘪 & 𝘖𝘳𝘥𝘦𝘳 𝘩𝘢𝘯𝘺𝘢 𝘮𝘦𝘭𝘢𝘭𝘶𝘪 𝘈𝘥𝘮𝘪𝘯 𝘎𝘳𝘶𝘱!`;

// ─── Handler ──────────────────────────────────────────────────────────────────
async function allmenu(ctx) {
  const role = ctx.role || 'user';

  // Tentukan section yang tampil berdasarkan role
  let sections = HEADER + USER_SECTION + FOOTER;

  if (role === 'bot_owner') {
    // Owner: tampilkan semua section
    sections = HEADER + OWNER_SECTION + ADMIN_SECTION + USER_SECTION + FOOTER;
  } else if (role === 'group_admin' || role === 'group_owner') {
    // Admin grup: tampilkan admin + user
    sections = HEADER + ADMIN_SECTION + USER_SECTION + FOOTER;
  } else {
    // User biasa: hanya user section
    sections = HEADER + USER_SECTION + FOOTER;
  }

  // Cek tambahan: jika di grup dan sender adalah admin grup tapi role belum terdeteksi,
  // fallback pakai canManageCatalogue
  if (role === 'user' && ctx.isGroup) {
    try {
      const isAdmin = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
      if (isAdmin) {
        sections = HEADER + ADMIN_SECTION + USER_SECTION + FOOTER;
      }
    } catch (_) { /* biarkan tampil user section saja */ }
  }

  await ctx.send(sections);
}

module.exports = { allmenu };
