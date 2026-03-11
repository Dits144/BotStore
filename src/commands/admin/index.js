const crypto = require('crypto');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { deleteMessageForEveryone } = require('../../utils/admin');
const { formatWrongExample, renderMentionText } = require('../../utils/messageFormatter');
const groupSettingsRepository = require('../../repositories/groupSettingsRepository');
const { nowJakarta, formatDate, formatTime } = require('../../utils/time');
const { normalizeJid } = require('../../utils/jid');

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await ctx.send('⚠️ Command ini hanya bisa dipakai di grup.');
    return;
  }

  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await ctx.send('❌ Akses ditolak\nPerintah ini khusus untuk Admin Grup atau Owner Bot.');
    return;
  }

  if (parsed.command === 'welcome') return setWelcomeStatus(ctx, parsed);
  if (parsed.command === 'setwelcome') return setWelcomeTemplate(ctx, parsed);
  if (parsed.command === 'h') return broadcast(ctx, parsed);
  if (['p', 'd', 'r', 'b'].includes(parsed.command)) return transactionNote(ctx, parsed.command);
}

async function setWelcomeStatus(ctx, parsed) {
  const action = String(parsed.args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(action)) {
    await ctx.send(formatWrongExample('welcome on'));
    return;
  }

  await groupSettingsRepository.setWelcomeEnabled(ctx.from, action === 'on');
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await ctx.send(action === 'on' ? '✅ Welcome berhasil diaktifkan' : '✅ Welcome berhasil dinonaktifkan');
}

async function setWelcomeTemplate(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('setwelcome') + 'setwelcome'.length).trim();
  const [_, templateRaw] = raw.split('@');

  if (!templateRaw) {
    await ctx.send('❌ Format salah\nContoh:\nsetwelcome@Halo @user, selamat datang di {group}');
    return;
  }

  await groupSettingsRepository.setWelcomeMessage(ctx.from, templateRaw.trim());
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await ctx.send('✅ Welcome message berhasil diperbarui');
}

async function broadcast(ctx, parsed) {
  const text = parsed.raw.slice(1).trim();
  if (!text) {
    await ctx.send(formatWrongExample('h sudah buka gais silahkan order'));
    return;
  }

  const meta = await ctx.sock.groupMetadata(ctx.from);
  const mentions = (meta.participants || []).map((p) => normalizeJid(p.id)).filter(Boolean);

  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await ctx.send(text, { mentions });
}

async function transactionNote(ctx, statusCode) {
  const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const participant = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (!quoted || !participant) {
    await ctx.send('❌ Perintah ini harus dipakai dengan me-reply pesan customer.');
    return;
  }

  const statusMap = { p: 'Pending', d: 'Done', r: 'Refund', b: 'Batal' };
  const status = statusMap[statusCode] || 'Pending';
  const note = extractQuotedText(quoted) || '-';
  const now = nowJakarta();
  const trxId = `TRX-${now.format('YYYYMMDD')}-${crypto.randomInt(1000, 9999)}`;
  const userJid = normalizeJid(participant);

  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  const mention = renderMentionText('@user Terima kasih sudah order!', userJid, 'user');
  await ctx.send(
    `「 TRANSAKSI ${status.toUpperCase()} 」\n\n` +
    `🆔 ID : ${trxId}\n` +
    `📆 TANGGAL : ${formatDate(now)}\n` +
    `⌚ JAM : ${formatTime(now)} WIB\n` +
    `✨ STATUS : ${status}\n\n` +
    `📝 Catatan : ${note}\n\n` +
    `${mention.text}`,
    { mentions: mention.mentions }
  );
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
