const crypto = require('crypto');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { formatWrongExample, renderMentionText } = require('../../utils/messageFormatter');
const groupSettingsRepository = require('../../repositories/groupSettingsRepository');
const { nowJakarta, formatDate, formatTime } = require('../../utils/time');
const { normalizeJid, toMentionJid } = require('../../utils/jid');
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
  if (parsed.command === 'h') return broadcast(ctx, parsed, true);
  if (parsed.command === 'hall') return broadcast(ctx, parsed, true);
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
  await sendMinimalSuccess(ctx.sock, ctx.from, action === 'on' ? '✅ Welcome diaktifkan.' : '✅ Welcome dinonaktifkan.');
}

async function setWelcomeTemplate(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('setwelcome') + 'setwelcome'.length).trim();
  const [_, templateRaw] = raw.split('@');

  if (!templateRaw) {
    await sendMinimalError(ctx.sock, ctx.from, '❌ Format salah\nContoh:\nsetwelcome@Halo @user, selamat datang di {group}');
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await groupSettingsRepository.setWelcomeMessage(ctx.from, templateRaw.trim());
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, '✅ Welcome diperbarui.');
}

async function broadcast(ctx, parsed, withMentionAll) {
  const text = parsed.raw.slice(parsed.command.length).trim();
  if (!text) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample(`${parsed.command} halo semua nya`));
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  if (!withMentionAll) {
    await ctx.sock.sendMessage(ctx.from, { text });
    await reactSuccess(ctx.sock, ctx.msg);
    return;
  }

  const meta = await ctx.sock.groupMetadata(ctx.from);
  const mentions = (meta.participants || []).map((p) => toMentionJid(p.id)).filter(Boolean).slice(0, 250);
  logger.info({ command: parsed.command, mentionsCount: mentions.length, groupId: ctx.from }, 'broadcast mentions prepared');
  await ctx.sock.sendMessage(ctx.from, { text, mentions });
  await reactSuccess(ctx.sock, ctx.msg);
}

async function transactionNote(ctx, statusCode) {
  const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const participant = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (!quoted || !participant) {
    await sendMinimalError(ctx.sock, ctx.from, '❌ Perintah ini harus dipakai dengan me-reply pesan customer.');
    return;
  }

  const statusMap = { p: 'Pending', d: 'Done', r: 'Refund', b: 'Batal' };
  const status = statusMap[statusCode] || 'Pending';
  const note = extractQuotedText(quoted) || '-';
  const now = nowJakarta();
  const trxId = `TRX-${now.format('YYYYMMDD')}-${crypto.randomInt(1000, 9999)}`;
  const userJid = toMentionJid(participant);

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  const mention = renderMentionText('@user Terima kasih sudah order!', userJid, 'user');
  logger.info({ command: statusCode, targetMentionJid: userJid }, 'transaction mention target');
  await ctx.sock.sendMessage(ctx.from, {
    text:
      `「 TRANSAKSI ${status.toUpperCase()} 」\n\n` +
      `🆔 ID : ${trxId}\n` +
      `📆 TANGGAL : ${formatDate(now)}\n` +
      `⌚ JAM : ${formatTime(now)} WIB\n` +
      `✨ STATUS : ${status}\n\n` +
      `📝 Catatan : ${note}\n\n` +
      `${mention.text}`,
    mentions: mention.mentions
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
