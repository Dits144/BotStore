const catalogueRepository = require('../../repositories/catalogueRepository');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { formatWrongExample, mentionTag } = require('../../utils/messageFormatter');
const { normalizeText } = require('../../utils/parser');
const { nowJakarta, formatDate, formatTime } = require('../../utils/time');

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
    await ctx.send('❌ Kamu tidak punya izin untuk mengelola katalog.');
    return;
  }

  if (parsed.command === 'addlist') return addList(ctx, parsed);
  if (parsed.command === 'dellist') return delList(ctx, parsed);
  if (parsed.command === 'updatelist') return updateList(ctx, parsed);
}

async function listCatalogue(ctx) {
  const rows = catalogueRepository.listByGroup(ctx.from);
  if (!rows.length) {
    await ctx.send('🛒 Toko kosong, admin belum menambahkan katalog.');
    return;
  }

  const groupName = await resolveGroupName(ctx);
  const userTag = mentionTag(ctx.sender);
  const listBody = rows.map((r) => `┃ 💎 ${r.item_name}`).join('\n');
  const now = nowJakarta();

  await ctx.send(
    `┏━━〔 ⚙ ${groupName} 〕━━┓\n` +
    `┃ ◆ ◆ ◆ ◆ ◆ ◆\n` +
    `┗━━━━━━━━━━━━━┛\n` +
    `       ⋮\n` +
    `     ${userTag}\n\n` +
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
    { mentions: [ctx.sender] }
  );
}

async function addList(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('addlist') + 'addlist'.length).trim();
  const [nameRaw, descRaw] = raw.split('@');

  if (!nameRaw || !descRaw) {
    await ctx.send(formatWrongExample('addlist capcut@1 bulan harga 50.000'));
    return;
  }

  const name = normalizeText(nameRaw);
  const description = descRaw.trim();

  try {
    catalogueRepository.addItem(ctx.from, name, description, ctx.sender);
    await ctx.send(`✅ List berhasil ditambahkan\n📦 Nama : ${name}\n📝 Deskripsi : ${description}`);
  } catch (error) {
    await ctx.send('❌ Gagal menambahkan list. Pastikan nama item unik per grup.');
  }
}

async function delList(ctx, parsed) {
  if (!parsed.args.length) {
    await ctx.send(formatWrongExample('dellist capcut'));
    return;
  }

  const name = normalizeText(parsed.args.join(' '));
  const result = catalogueRepository.deleteItem(ctx.from, name);
  if (!result.changes) {
    await ctx.send('❌ Item tidak ditemukan di katalog grup ini.');
    return;
  }

  await ctx.send(`🗑️ List berhasil dihapus\n📦 Nama : ${name}`);
}

async function updateList(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('updatelist') + 'updatelist'.length).trim();
  const [nameRaw, descRaw] = raw.split('@');

  if (!nameRaw || !descRaw) {
    await ctx.send(formatWrongExample('updatelist capcut@1 bulan harga 45.000 promo'));
    return;
  }

  const name = normalizeText(nameRaw);
  const description = descRaw.trim();
  const result = catalogueRepository.updateItem(ctx.from, name, description);

  if (!result.changes) {
    await ctx.send('❌ Item tidak ditemukan, gagal memperbarui katalog.');
    return;
  }

  await ctx.send(`♻️ List berhasil diperbarui\n📦 Nama : ${name}\n📝 Deskripsi Baru : ${description}`);
}

async function productTrigger(ctx, rawText) {
  const name = normalizeText(rawText);
  if (!name || name.includes(' ')) return;

  const item = catalogueRepository.getItem(ctx.from, name);
  if (!item) return;

  await ctx.send(
    `┏━━〔 📦 DETAIL PRODUK 〕━━┓\n` +
    `┗━━━━━━━━━━━━━━━━━━━━┛\n\n` +
    `💎 Nama : ${item.item_name}\n` +
    `📝 Deskripsi : ${item.description}\n\n` +
    `📌 Hubungi admin untuk order.`
  );
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
