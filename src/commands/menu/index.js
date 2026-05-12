async function allmenu(ctx) {
  const menuText =
    `┏━━〔 📚 𝗕𝗢𝗧𝗦𝗧𝗢𝗥𝗘 𝗠𝗘𝗡𝗨 〕━━┓\n` +
    `┃ ◆  𝓟𝓻𝓮𝓶𝓲𝓾𝓶 𝓦𝓱𝓪𝓽𝓼𝓐𝓹𝓹 𝓑𝓸𝓽  ◆\n` +
    `┗━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
    
    `👑 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨\n` +
    `• 👑 owner — tambah owner tambahan\n` +
    `• 🗑 delowner — hapus owner tambahan\n` +
    `• 📋 listowner — list owner bot\n` +
    `• ⚡ addsewa — tambah masa sewa grup\n` +
    `• ♻ renewsewa — perpanjang sewa grup\n` +
    `• 🗑 delsewa — hapus grup dari sewa\n` +
    `• 📋 listsewa — list grup sewa aktif\n` +
    `• 🔍 ceksewa — cek status sewa grup\n\n` +

    `🛡 𝗔𝗗𝗠𝗜𝗡 𝗠𝗘𝗡𝗨\n` +
    `• 📦 addlist — tambah produk ke katalog\n` +
    `• 📝 updatelist — edit deskripsi produk\n` +
    `• ❌ dellist — hapus produk dari katalog\n` +
    `• 👋 welcome — aktifkan/matikan ucapan welcome\n` +
    `• ✏ setwelcome — set template ucapan welcome\n` +
    `• 📢 h — broadcast tag-all tersembunyi\n` +
    `• 🔒 group close — tutup pengiriman pesan grup\n` +
    `• 🔓 group open — buka pengiriman pesan grup\n` +
    `• ⏳ p — nota transaksi status Pending\n` +
    `• 💳 d — nota transaksi status Done\n` +
    `• 🔄 r — nota transaksi status Refund\n` +
    `• ❌ b — nota transaksi status Batal\n\n` +

    `👥 𝗨𝗦𝗘𝗥 𝗠𝗘𝗡𝗨\n` +
    `• 🛍 list — lihat katalog produk\n` +
    `• ℹ info — info detail grup\n` +
    `• 👤 myrole — cek role & status sewa Anda\n` +
    `• 📚 allmenu — tampilkan semua menu bot\n` +
    `• 📝 [nama produk] — langsung trigger detail produk\n\n` +
    
    `───────────────────────\n` +
    `✨ 𝘛𝘳𝘢𝘯𝘴𝘢𝘬𝘴𝘪 & 𝘖𝘳𝘥𝘦𝘳 𝘩𝘢𝘯𝘺𝘢 𝘮𝘦𝘭𝘢𝘭𝘶𝘪 𝘈𝘥𝘮𝘪𝘯 𝘎𝘳𝘶𝘱!`;

  await ctx.send(menuText);
}

module.exports = { allmenu };
