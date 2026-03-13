const fs = require('fs');
const path = require('path');
const baileys = require('@whiskeysockets/baileys');
const catalogueRepository = require('../../repositories/catalogueRepository');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { formatWrongExample, renderMentionText } = require('../../utils/messageFormatter');
const { normalizeText } = require('../../utils/parser');
const { nowJakarta, formatDate, formatTime } = require('../../utils/time');
const { deleteMessageForEveryone } = require('../../utils/admin');
const { reactLoading, reactSuccess, reactError, sendMinimalSuccess, sendMinimalError } = require('../../utils/chatUx');
const { suggestClosest } = require('../../utils/typo');
const config = require('../../config/env');

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await ctx.send('⚠️ Command katalog hanya bisa dipakai di grup.');
    return;
  }

  if (parsed.command === 'list') {
    await listCatalogue(ctx);
    return;
  }

  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await ctx.send('❌ Akses ditolak\nPerintah ini khusus untuk Admin Grup atau Owner Bot.');
    return;
  }

  if (parsed.command === 'addlist') return addList(ctx, parsed);
  if (parsed.command === 'dellist') return delList(ctx, parsed);
  if (parsed.command === 'updatelist') return updateList(ctx, parsed);
}

async function listCatalogue(ctx) {
  const rows = await catalogueRepository.listByGroup(ctx.from);
  if (!rows.length) {
    await ctx.send('🛒 Toko kosong, admin belum menambahkan katalog.');
    return;
  }

  const groupName = await resolveGroupName(ctx);
  const listBody = rows.map((r) => `┃ 💎 ${r.item_name}`).join('\n');
  const now = nowJakarta();

  const mention = renderMentionText('@user', ctx.sender, 'user');
  await ctx.send(
    `┏━━〔 ⚙ ${groupName} 〕━━┓\n` +
    `┃ ◆ ◆ ◆ ◆ ◆ ◆\n` +
    `┗━━━━━━━━━━━━━┛\n` +
    `       ⋮\n` +
    `     ${mention.text}\n\n` +
    `⚡ Available Services\n\n` +
    `⏱ time : ${formatTime(now)}\n` +
    `📅 date : ${formatDate(now)}\n\n` +
    `╭──〔 📦 CATALOGUE 〕──╮\n` +
    `${listBody}\n` +
    `╰────────────────────╯\n\n` +
    `📌 NOTE\n` +
    `• ketik nama produk untuk melihat detail\n` +
    `• atau gunakan menu bot yang tersedia\n` +
    `• transaksi hanya melalui admin`,
    { mentions: mention.mentions }
  );
}

async function addList(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('addlist') + 'addlist'.length).trim();
  const [nameRaw, descRaw] = raw.split('@');

  if (!nameRaw || !descRaw) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample('addlist capcut@1 bulan harga 50.000'));
    return;
  }

  const name = normalizeText(nameRaw);
  const description = descRaw.trim();
  const hasImage = Boolean(ctx.msg?.message?.imageMessage);
  await reactLoading(ctx.sock, ctx.msg);

  const media = await maybeSaveMedia(ctx, name);

  if (media?.error) {
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, '❌ Gagal menyimpan media.');
    return;
  }

  try {
    await catalogueRepository.addItem(ctx.from, name, description, ctx.sender, media || {});
    await deleteMessageForEveryone(ctx.sock, ctx.msg);
    await reactSuccess(ctx.sock, ctx.msg);
    await sendMinimalSuccess(ctx.sock, ctx.from, media?.path ? '✅ List + media berhasil ditambahkan.' : '✅ List ditambahkan.');
  } catch {
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, '❌ Gagal menambahkan list.');
  }
}

async function delList(ctx, parsed) {
  if (!parsed.args.length) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample('dellist capcut'));
    return;
  }

  const name = normalizeText(parsed.args.join(' '));
  const item = await catalogueRepository.getItem(ctx.from, name);
  const result = await catalogueRepository.deleteItem(ctx.from, name);
  if (!result.changes) {
    await sendMinimalError(ctx.sock, ctx.from, '❌ Item tidak ditemukan.');
    return;
  }

  if (item?.media_path && fs.existsSync(item.media_path)) fs.unlinkSync(item.media_path);
  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, '✅ List dihapus.');
}

async function updateList(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('updatelist') + 'updatelist'.length).trim();
  const [nameRaw, descRaw] = raw.split('@');

  if (!nameRaw || !descRaw) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample('updatelist capcut@1 bulan harga 45.000 promo'));
    return;
  }

  const name = normalizeText(nameRaw);
  const description = descRaw.trim();
  const result = await catalogueRepository.updateItem(ctx.from, name, description);

  if (!result.changes) {
    await sendMinimalError(ctx.sock, ctx.from, '❌ Item tidak ditemukan.');
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, '✅ List diperbarui.');
}

async function productTrigger(ctx, rawText) {
  const name = normalizeText(rawText);
  if (!name || name.includes(' ')) return;

  const item = await catalogueRepository.getItem(ctx.from, name);
  if (item) {
    if (item.media_path && fs.existsSync(item.media_path)) {
      await ctx.sock.sendMessage(ctx.from, {
        image: fs.readFileSync(item.media_path),
        caption: item.description
      }, { quoted: ctx.msg });
      return;
    }

    await ctx.send(item.description);
    return;
  }

  const rows = await catalogueRepository.listByGroup(ctx.from);
  const suggestions = suggestClosest(name, rows.map((r) => r.item_name));
  if (!suggestions.length) return;

  if (suggestions.length === 1) {
    await ctx.send(`❓ Apakah yang kamu maksud: ${suggestions[0]} ?`);
    return;
  }

  await ctx.send(`❓ Mungkin yang kamu maksud:\n${suggestions.map((s) => `• ${s}`).join('\n')}`);
}

async function maybeSaveMedia(ctx, name) {
  const hasImage = Boolean(ctx.msg?.message?.imageMessage);
  if (!hasImage) return null;

  try {
    if (!fs.existsSync(config.mediaPath)) fs.mkdirSync(config.mediaPath, { recursive: true });

    let buffer = null;
    if (typeof ctx.sock.downloadMediaMessage === 'function') {
      buffer = await ctx.sock.downloadMediaMessage(ctx.msg, 'buffer', {}, {});
    }

    if (!buffer) {
      buffer = await baileys.downloadMediaMessage(
        ctx.msg,
        'buffer',
        {},
        { logger: undefined, reuploadRequest: ctx.sock.updateMediaMessage }
      );
    }

    if (!buffer || !buffer.length) return { error: true };

    const filePath = path.join(config.mediaPath, `${Date.now()}-${name}.jpg`);
    fs.writeFileSync(filePath, buffer);
    return { path: filePath, type: 'image' };
  } catch {
    return { error: true };
  }
}

async function resolveGroupName(ctx) {
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    return meta.subject || 'Unknown Group';
  } catch {
    return 'Unknown Group';
  }
}

module.exports = { handle, productTrigger };
