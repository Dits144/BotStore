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
const { sans } = require('../../utils/styledText');

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await sendMinimalError(ctx.sock, ctx.from, `⚠️ ${sans('Command ini hanya bisa dipakai di grup.')}`);
    return;
  }

  // Hanya admin grup atau owner bot
  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await sendMinimalError(
      ctx.sock,
      ctx.from,
      `❌ ${sans('Akses ditolak')}\n${sans('Perintah ini khusus untuk Admin Grup atau Owner Bot.')}`
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

  if (parsed.command === 'kick') return groupKick(ctx, parsed);
  if (parsed.command === 'add') return groupAdd(ctx, parsed);

  const sub = String(parsed.args[0] || '').toLowerCase();

  if (sub === 'close') return groupClose(ctx);
  if (sub === 'open') return groupOpen(ctx);

  await sendMinimalError(
    ctx.sock,
    ctx.from,
    `❌ ${sans('Format salah')}\n${sans('Contoh:')}\n• group close\n• group open\n• kick @user\n• add 628xxx`
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
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal menutup grup. Pastikan bot adalah admin grup.')}`);
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
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal membuka grup. Pastikan bot adalah admin grup.')}`);
  }
}

async function groupKick(ctx, parsed) {
  try {
    let targetJid = '';

    // 1. Quoted message (reply)
    const contextInfo = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const rawParticipant = contextInfo?.participant;
    if (contextInfo?.quotedMessage && rawParticipant) {
      const rawStr = String(rawParticipant).trim();
      if (rawStr.includes(':') && rawStr.includes('@')) {
        const [userPart, domain] = rawStr.split('@');
        const cleanUser = userPart.split(':')[0];
        targetJid = `${cleanUser}@${domain}`;
      } else {
        targetJid = rawStr.includes('@') ? rawStr : `${rawStr.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      }
    }

    // 2. Mentions
    if (!targetJid) {
      const mentions = contextInfo?.mentionedJid || [];
      if (mentions.length > 0) {
        targetJid = mentions[0];
      }
    }

    // 3. Arguments (phone number)
    if (!targetJid && parsed.args.length > 0) {
      const cleanPhone = parsed.args[0].replace(/[^0-9]/g, '');
      if (cleanPhone) {
        targetJid = `${cleanPhone}@s.whatsapp.net`;
      }
    }

    if (!targetJid) {
      await sendMinimalError(
        ctx.sock,
        ctx.from,
        `❌ ${sans('Format salah')}\n${sans('Contoh:')}\n• Reply chat target lalu ketik: kick\n• Tag target: kick @user\n• Ketik nomor: kick 628xxx`
      );
      return;
    }

    // Prevent kicking the bot itself
    const botNumber = ctx.sock.user.id.split(':')[0] + '@s.whatsapp.net';
    if (targetJid === botNumber) {
      await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal: Bot tidak dapat mengeluarkan dirinya sendiri.')}`);
      return;
    }

    await reactLoading(ctx.sock, ctx.msg);
    await ctx.sock.groupParticipantsUpdate(ctx.from, [targetJid], 'remove');
    await reactSuccess(ctx.sock, ctx.msg);

    const cleanNumber = targetJid.split('@')[0];
    await ctx.sock.sendMessage(ctx.from, {
      text: `✅ ${sans('Berhasil mengeluarkan')} @${cleanNumber} ${sans('dari grup!')}`,
      mentions: [targetJid]
    });
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[groupAdmin] gagal kick anggota');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal mengeluarkan anggota. Pastikan bot adalah admin grup.')}`);
  }
}

async function groupAdd(ctx, parsed) {
  try {
    if (!parsed.args.length) {
      await sendMinimalError(
        ctx.sock,
        ctx.from,
        `❌ ${sans('Format salah')}\n${sans('Contoh:')}\n• add 62899xxxxxxx`
      );
      return;
    }

    const cleanPhone = parsed.args[0].replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Nomor telepon tidak valid.')}`);
      return;
    }

    const targetJid = `${cleanPhone}@s.whatsapp.net`;

    await reactLoading(ctx.sock, ctx.msg);
    await ctx.sock.groupParticipantsUpdate(ctx.from, [targetJid], 'add');
    await reactSuccess(ctx.sock, ctx.msg);

    await ctx.sock.sendMessage(ctx.from, {
      text: `✅ ${sans('Berhasil menambahkan')} @${cleanPhone} ${sans('ke dalam grup!')}`,
      mentions: [targetJid]
    });
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[groupAdmin] gagal add anggota');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(
      ctx.sock,
      ctx.from,
      `❌ ${sans('Gagal menambahkan anggota. Pastikan nomor terdaftar di WA dan bot adalah admin grup.')}`
    );
  }
}

module.exports = { handle };
