const crypto = require('crypto');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { formatWrongExample, renderMentionText } = require('../../utils/messageFormatter');
const groupSettingsRepository = require('../../repositories/groupSettingsRepository');
const { nowJakarta, formatDate, formatTime } = require('../../utils/time');
const { normalizeUserJid, toMentionJid } = require('../../utils/jid');
const logger = require('../../config/logger');
const {
  reactLoading,
  reactSuccess,
  reactError,
  deleteMessageForEveryone,
  sendMinimalSuccess,
  sendMinimalError
} = require('../../utils/chatUx');

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await sendMinimalError(ctx.sock, ctx.from, '⚠️ Command ini hanya bisa dipakai di grup.');
    return;
  }

  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await sendMinimalError(ctx.sock, ctx.from, '❌ Akses ditolak\nPerintah ini khusus untuk Admin Grup atau Owner Bot.');
    return;
  }

  if (parsed.command === 'welcome') return setWelcomeStatus(ctx, parsed);
  if (parsed.command === 'setwelcome') return setWelcomeTemplate(ctx, parsed);
  if (['h', 'hall', 'wptagall', 'everyone'].includes(parsed.command)) return broadcast(ctx, parsed);
  if (['p', 'd', 'r', 'b'].includes(parsed.command)) return transactionNote(ctx, parsed.command);
}

async function setWelcomeStatus(ctx, parsed) {
  const action = String(parsed.args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(action)) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample('welcome on'));
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await groupSettingsRepository.setWelcomeEnabled(ctx.from, action === 'on');
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(
    ctx.sock,
    ctx.from,
    action === 'on' ? '✅ Welcome diaktifkan.' : '✅ Welcome dinonaktifkan.'
  );
}

async function setWelcomeTemplate(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('setwelcome') + 'setwelcome'.length).trim();
  const [_, templateRaw] = raw.split('@');

  if (!templateRaw) {
    await sendMinimalError(
      ctx.sock,
      ctx.from,
      '❌ Format salah\nContoh:\nsetwelcome@Halo @user, selamat datang di {group}'
    );
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await groupSettingsRepository.setWelcomeMessage(ctx.from, templateRaw.trim());
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, '✅ Welcome diperbarui.');
}

// ---------------------------------------------------------------
// broadcast — HIDDEN TAG-ALL
//
// Kirim pesan dengan teks bersih (tanpa @nomor tampil),
// tapi semua anggota grup masuk ke `mentions` array
// sehingga WhatsApp notif mereka semua.
//
// Contoh: .h halo semua → dikirim "halo semua" + mentions=[semua JID]
// ---------------------------------------------------------------
async function broadcast(ctx, parsed) {
  // Ambil teks setelah nama command
  const text = parsed.raw.slice(parsed.command.length).trim();
  if (!text) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample(`${parsed.command} Halo semua`));
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  // Ambil semua participant dari groupMetadata
  let mentions = [];
  let participants = [];
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    participants = meta.participants || [];

    // Map ke JID yang valid — toMentionJid normalizes ke 628xxx@s.whatsapp.net
    mentions = [...new Set(
      participants
        .map((p) => toMentionJid(p.id))
        .filter(Boolean)
    )];
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[broadcast] gagal ambil groupMetadata');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, '❌ Gagal mengambil data anggota grup.');
    return;
  }

  // Debug log wajib
  logger.info(
    {
      command: parsed.command,
      groupId: ctx.from,
      participantCount: participants.length,
      mentionCount: mentions.length,
      sampleMentions: mentions.slice(0, 5)
    },
    '[broadcast] hidden tag-all debug'
  );

  // Kirim: text BERSIH (tidak ada @nomor tampil di chat),
  // tapi mentions array berisi semua JID → semua dapat notif
  await ctx.sock.sendMessage(ctx.from, {
    text,      // ← teks murni, tidak ada @user / @semua / @nomor
    mentions   // ← semua JID anggota grup → hidden tag-all
  });

  await reactSuccess(ctx.sock, ctx.msg);
}

// ---------------------------------------------------------------
// transactionNote — reply ke customer dengan mention aktif
//
// Bot harus di-reply pesan customer, lalu ketik .p / .d / .r / .b
// Target mention diambil dari contextInfo.participant (JID pengirim
// pesan yang di-reply), bukan dari sender command.
// ---------------------------------------------------------------
async function transactionNote(ctx, statusCode) {
  // Ambil quoted message dan participant (pengirim pesan yang di-reply)
  const contextInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
  const quoted = contextInfo?.quotedMessage;

  // participant di contextInfo = JID pengirim pesan yang di-reply
  const rawParticipant =
    contextInfo?.participant ||
    contextInfo?.remoteJid ||
    '';

  if (!quoted || !rawParticipant) {
    await sendMinimalError(
      ctx.sock,
      ctx.from,
      '❌ Perintah ini harus dipakai dengan me-reply pesan customer.'
    );
    return;
  }

  // Normalize JID target (orang yang dipesan/di-reply)
  const userJid = toMentionJid(rawParticipant) || normalizeUserJid(rawParticipant);

  if (!userJid) {
    await sendMinimalError(ctx.sock, ctx.from, '❌ Gagal membaca JID customer dari pesan yang di-reply.');
    return;
  }

  const statusMap = { p: 'Pending', d: 'Done', r: 'Refund', b: 'Batal' };
  const status = statusMap[statusCode] || 'Pending';
  const note = extractQuotedText(quoted) || '-';
  const now = nowJakarta();
  const trxId = `TRX-${now.format('YYYYMMDD')}-${crypto.randomInt(1000, 9999)}`;

  // Render mention: @user → @628xxx, mentions=[userJid]
  const mention = renderMentionText('@user Terima kasih sudah order! 🙏', userJid);

  // Debug log wajib
  logger.info(
    {
      command: statusCode,
      rawParticipant,
      targetJid: userJid,
      renderedText: mention.text,
      mentions: mention.mentions
    },
    '[transactionNote] mention debug'
  );

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  await ctx.sock.sendMessage(ctx.from, {
    text:
      `「 TRANSAKSI ${status.toUpperCase()} 」\n\n` +
      `🆔 ID : ${trxId}\n` +
      `📆 TANGGAL : ${formatDate(now)}\n` +
      `⌚ JAM : ${formatTime(now)} WIB\n` +
      `✨ STATUS : ${status}\n\n` +
      `📝 Catatan : ${note}\n\n` +
      `${mention.text}`,
    mentions: mention.mentions   // ← JID target ada di sini → mention aktif
  });

  await reactSuccess(ctx.sock, ctx.msg);
}

function extractQuotedText(quoted = {}) {
  return (
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    quoted.videoMessage?.caption ||
    ''
  ).trim();
}

module.exports = { handle };
