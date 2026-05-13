// src/commands/admin/groupAdmin.js
// Command: group open / group close
// Permission: Admin grup ATAU Owner Bot, bot harus admin grup

const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { getBotGroupAdminDiagnostics } = require('../../utils/admin');
const {
  reactLoading,
  reactSuccess,
  reactError,
  deleteForEveryone,
  sendMinimalError
} = require('../../utils/chatUx');
const logger = require('../../config/logger');
const { styled } = require('../../utils/styledText');

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await sendMinimalError(ctx.sock, ctx.from, `⚠️ ${styled('Command ini hanya bisa dipakai di grup.')}`);
    return;
  }

  // Hanya admin grup atau owner bot
  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await sendMinimalError(
      ctx.sock,
      ctx.from,
      `❌ ${styled('Akses ditolak')}\n${styled('Perintah ini khusus untuk Admin Grup atau Owner Bot.')}`
    );
    return;
  }

  // Bot harus admin grup agar bisa mengubah setting grup
  const diag = await getBotGroupAdminDiagnostics(ctx.sock, ctx.from);
  if (!diag.isAdmin) {
    const diagText = 
      `❌ *Bot harus menjadi admin grup untuk menggunakan command ini.*\n\n` +
      `🔍 *𝗖𝗢𝗡𝗦𝗢𝗟𝗘 𝗗𝗜𝗔𝗚𝗡𝗢𝗦𝗧𝗜𝗖𝗦:*\n` +
      `• *Bot JID:* ${diag.botJid || '-'}\n` +
      `• *Normalized Bot JID:* ${diag.normalizedBotJid || '-'}\n` +
      `• *Group ID:* ${diag.groupId || '-'}\n` +
      `• *Error:* ${diag.error || 'None'}\n` +
      `• *Total Member:* ${diag.participantCount}\n` +
      `• *Bot di Member:* ${diag.meInParticipants ? 'Ya' : 'Tidak'}\n` +
      `• *Status Admin Bot:* ${diag.meAdminStatus || 'Bukan Admin'}\n` +
      (diag.sampleParticipants && diag.sampleParticipants.length ? `• *Contoh Member:* ${diag.sampleParticipants.join(', ')}` : '');

    await ctx.reply(diagText);
    return;
  }

  const sub = String(parsed.args[0] || '').toLowerCase();

  if (sub === 'close') return groupClose(ctx);
  if (sub === 'open') return groupOpen(ctx);

  await sendMinimalError(
    ctx.sock,
    ctx.from,
    `❌ ${styled('Format salah')}\n${styled('Contoh:')}\n• group close\n• group open`
  );
}

async function groupClose(ctx) {
  try {
    await reactLoading(ctx.sock, ctx.msg);
    await ctx.sock.groupSettingUpdate(ctx.from, 'announcement');
    await deleteForEveryone(ctx.sock, ctx.msg);
    await reactSuccess(ctx.sock, ctx.msg);

    logger.info({ groupId: ctx.from, sender: ctx.sender }, '[groupAdmin] group closed');

    await ctx.sock.sendMessage(ctx.from, {
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
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[groupAdmin] gagal close grup');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${styled('Gagal menutup grup. Pastikan bot adalah admin grup.')}`);
  }
}

async function groupOpen(ctx) {
  try {
    await reactLoading(ctx.sock, ctx.msg);
    await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement');
    await deleteForEveryone(ctx.sock, ctx.msg);
    await reactSuccess(ctx.sock, ctx.msg);

    logger.info({ groupId: ctx.from, sender: ctx.sender }, '[groupAdmin] group opened');

    await ctx.sock.sendMessage(ctx.from, {
      text:
        '┌─── ⌁ 𝗚𝗥𝗢𝗨𝗣 𝗢𝗣𝗘𝗡𝗘𝗗 ⌁ ───┐\n' +
        '│ 🔓 Grup telah dibuka kembali\n' +
        '│ 💬 Semua member sudah dapat mengirim pesan\n' +
        '│ ⚡ Gunakan grup dengan bijak & jangan spam\n' +
        '│\n' +
        '│ • Selamat beraktivitas kembali ✨\n' +
        '└───────────────────────────────┘'
    });
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[groupAdmin] gagal open grup');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${styled('Gagal membuka grup. Pastikan bot adalah admin grup.')}`);
  }
}

module.exports = { handle };
