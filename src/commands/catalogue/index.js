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
const { toMentionJid } = require('../../utils/jid');
const config = require('../../config/env');
const logger = require('../../config/logger');
const { styled, sans } = require('../../utils/styledText');

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await ctx.send(`⚠️ ${sans('Command katalog hanya bisa dipakai di grup.')}`);
    return;
  }

  if (parsed.command === 'list') {
    await listCatalogue(ctx);
    return;
  }

  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await ctx.send(`❌ ${sans('Akses ditolak')}\n${sans('Perintah ini khusus untuk Admin Grup atau Owner Bot.')}`);
    return;
  }

  if (parsed.command === 'addlist') return addList(ctx, parsed);
  if (parsed.command === 'dellist') return delList(ctx, parsed);
  if (parsed.command === 'updatelist') return updateList(ctx, parsed);
}

async function listCatalogue(ctx) {
  const rows = await catalogueRepository.listByGroup(ctx.from);
  if (!rows.length) {
    await ctx.send(`🛒 ${sans('Toko kosong, admin belum menambahkan katalog.')}`);
    return;
  }

  const groupName = await resolveGroupName(ctx);
  const listBody = rows.map((r) => `┃ 💠 ${r.item_name}`).join('\n');
  const now = nowJakarta();

  // FIX: renderMentionText hanya menerima 2 argumen (template, targetJid)
  // ctx.sender sudah merupakan JID pengirim yang benar (dari getSenderJid di messageRouter)
  const senderJid = toMentionJid(ctx.sender) || ctx.sender;
  const mention = renderMentionText('@user', senderJid);

  logger.debug(
    { senderJid, renderedText: mention.text, mentions: mention.mentions },
    '[listCatalogue] sender mention debug'
  );

  await ctx.sock.sendMessage(ctx.from, {
    text:
      `╭〔 ${styled(groupName)} 〕╮\n` +
      `💠═══════💠\n` +
      `   𖥻 ׁsee the list ! ✧\n` +
      `💠═══════💠\n\n` +
      `𖹭 ${styled('Helloo')} ${styled('Bubss')}~ ✦\n` +
      `👤 ${styled('Name')} : ${mention.text}\n` +
      `╭⸼ 𝖼⃘𐑋 ִ╮${sans('time')} ${formatTime(now)}\n` +
      `╰⸼ 𝖼⃘𐑋 ִ╯${sans('date')} ${formatDate(now)}\n\n` +
      `╭〔 ${styled('Catalog')} 〕╮\n` +
      `${listBody}\n` +
      `╰────────────────╯\n\n` +
      `╭〔 ${styled('Note')} ✦ 〕╮\n` +
      `• 𝖪𝖾𝗍𝗂𝗄 𝗇𝖺𝗆𝖺 𝗉𝗋𝗈𝖽𝗎𝗄\n` +
      `• 𝖦𝗎𝗇𝖺𝗄𝖺𝗇 𝗆𝖾𝗇𝗎 𝖻𝗈𝗍\n` +
      `• 𝖳𝗋𝖺𝗇𝗌𝖺𝗄𝗌𝗂 𝗏𝗂𝖺 𝖺𝖽𝗆𝗂𝗇`,
    mentions: mention.mentions
  });
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
  await reactLoading(ctx.sock, ctx.msg);

  const media = await maybeSaveMedia(ctx, name);

  if (media?.error) {
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal menyimpan media.')}`);
    return;
  }

  try {
    await catalogueRepository.addItem(ctx.from, name, description, ctx.sender, media || {});
    await deleteMessageForEveryone(ctx.sock, ctx.msg);
    await reactSuccess(ctx.sock, ctx.msg);
    await sendMinimalSuccess(
      ctx.sock,
      ctx.from,
      media?.path ? `✅ ${sans('List + media berhasil ditambahkan.')}` : `✅ ${sans('List ditambahkan.')}`
    );
  } catch {
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal menambahkan list.')}`);
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
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Item tidak ditemukan.')}`);
    return;
  }

  if (item?.media_path && fs.existsSync(item.media_path)) fs.unlinkSync(item.media_path);
  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, `✅ ${sans('List dihapus.')}`);
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
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Item tidak ditemukan.')}`);
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, `✅ ${sans('List diperbarui.')}`);
}

async function productTrigger(ctx, rawText) {
  const name = normalizeText(rawText);
  if (!name || name.includes(' ')) return;

  const groupName = await resolveGroupName(ctx);
  const footer = `\n\n❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❘❚❙❘❘❚❙❘❘❚❙❘\n◟☁️ ׄ   ${groupName}  𓂃 ࣪˖ ִֶָ`;

  const item = await catalogueRepository.getItem(ctx.from, name);
  if (item) {
    const detailText = `${item.description}${footer}`;
    if (item.media_path && fs.existsSync(item.media_path)) {
      await ctx.sock.sendMessage(
        ctx.from,
        { image: fs.readFileSync(item.media_path), caption: detailText },
        { quoted: ctx.msg }
      );
      return;
    }
    await ctx.send(detailText);
    return;
  }

  const rows = await catalogueRepository.listByGroup(ctx.from);
  const suggestions = suggestClosest(name, rows.map((r) => r.item_name));
  if (!suggestions.length) return;

  const bestMatchName = suggestions[0];
  const bestMatchItem = rows.find((r) => r.item_name === bestMatchName);

  if (bestMatchItem) {
    const captionText = `❓ Maksud Anda ${bestMatchName}?\n\n${bestMatchItem.description}${footer}`;
    if (bestMatchItem.media_path && fs.existsSync(bestMatchItem.media_path)) {
      await ctx.sock.sendMessage(
        ctx.from,
        { image: fs.readFileSync(bestMatchItem.media_path), caption: captionText },
        { quoted: ctx.msg }
      );
      return;
    }
    await ctx.send(captionText);
  }
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
