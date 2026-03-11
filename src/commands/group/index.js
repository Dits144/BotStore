const { formatDateTime } = require('../../utils/time');

async function info(ctx) {
  if (!ctx.isGroup) {
    await ctx.send(
      `┏━━〔 ℹ️ INFO BOT 〕━━┓\n` +
      `┗━━━━━━━━━━━━━━━━━━┛\n` +
      `📌 Command info grup hanya tersedia saat dipakai di grup.\n` +
      `💡 Gunakan command ini di grup untuk melihat detail metadata grup.`
    );
    return;
  }

  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const owner = meta.owner || 'tidak diketahui';
    const created = meta.creation ? formatDateTime(new Date(Number(meta.creation) * 1000).toISOString()) : 'tidak diketahui';
    const adminCount = (meta.participants || []).filter((p) => p.admin === 'admin' || p.admin === 'superadmin').length;

    let invite = 'tidak tersedia';
    try {
      const code = await ctx.sock.groupInviteCode(ctx.from);
      if (code) invite = `https://chat.whatsapp.com/${code}`;
    } catch (error) {
      invite = 'tidak tersedia';
    }

    await ctx.send(
      `┏━━〔 📌 INFO GRUP 〕━━┓\n` +
      `┃ ✦ Detail Grup WhatsApp\n` +
      `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
      `📛 Nama Group : ${meta.subject || 'tidak diketahui'}\n` +
      `🔗 Link Group : ${invite}\n` +
      `🆔 ID Group : ${ctx.from}\n` +
      `👑 Owner Group : ${owner}\n` +
      `📅 Tanggal Dibuat : ${created}\n` +
      `👥 Total Member : ${(meta.participants || []).length}\n` +
      `🛡️ Jumlah Admin : ${adminCount}\n\n` +
      `✅ Gunakan info ini dengan bijak.`
    );
  } catch (error) {
    await ctx.send('❌ Gagal mengambil info grup. Coba lagi beberapa saat.');
  }
}

module.exports = { info };
