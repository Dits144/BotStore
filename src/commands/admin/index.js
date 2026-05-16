const crypto = require('crypto');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { formatWrongExample, renderMentionText } = require('../../utils/messageFormatter');
const groupSettingsRepository = require('../../repositories/groupSettingsRepository');
const catalogueRepository = require('../../repositories/catalogueRepository');
const customerRepository = require('../../repositories/customerRepository');
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
const { styled, sans } = require('../../utils/styledText');
const { recordSuccess } = require('../customer');

// ─── Pending clone sessions (in-memory) ───────────────────────────────────────
// Key: `${groupId}:${senderJid}` → { sourceGroupId, ts }
const PENDING_CLONE = new Map();
const PENDING_CLONE_TTL_MS = 60_000; // 60 detik

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await sendMinimalError(ctx.sock, ctx.from, `⚠️ ${sans('Command ini hanya bisa dipakai di grup.')}`);
    return;
  }

  const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
  if (!canManage) {
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Akses ditolak')}\n${sans('Perintah ini khusus untuk Admin Grup atau Owner Bot.')}`);
    return;
  }

  if (parsed.command === 'welcome') return setWelcomeStatus(ctx, parsed);
  if (parsed.command === 'setwelcome') return setWelcomeTemplate(ctx, parsed);
  if (['h', 'hall', 'wptagall', 'everyone'].includes(parsed.command)) return broadcast(ctx, parsed);
  if (['p', 'd', 'r', 'b'].includes(parsed.command)) return transactionNote(ctx, parsed.command);
  if (parsed.command === 'clonelist') return cloneList(ctx, parsed);
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
    ctx.sock, ctx.from,
    action === 'on' ? `✅ ${sans('Welcome diaktifkan.')}` : `✅ ${sans('Welcome dinonaktifkan.')}`
  );
}

async function setWelcomeTemplate(ctx, parsed) {
  const raw = parsed.raw.slice(parsed.raw.toLowerCase().indexOf('setwelcome') + 'setwelcome'.length).trim();
  const [_, templateRaw] = raw.split('@');
  if (!templateRaw) {
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Format salah')}\n${sans('Contoh:')}\nsetwelcome@Halo @user, selamat datang di {group}`);
    return;
  }
  await reactLoading(ctx.sock, ctx.msg);
  await groupSettingsRepository.setWelcomeMessage(ctx.from, templateRaw.trim());
  await deleteMessageForEveryone(ctx.sock, ctx.msg);
  await reactSuccess(ctx.sock, ctx.msg);
  await sendMinimalSuccess(ctx.sock, ctx.from, `✅ ${sans('Welcome diperbarui.')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// cloneList — clone semua produk dari grup lain ke grup ini
//
// Flow dua langkah:
//   1. clonelist <groupId_sumber>  → bot minta konfirmasi
//   2. clonelist <groupId_sumber> ya  → eksekusi clone
//
// Jika produk sama sudah ada → pakai yang baru (INSERT OR REPLACE)
// ─────────────────────────────────────────────────────────────────────────────
async function cloneList(ctx, parsed) {
  const sourceGroupId = String(parsed.args[0] || '').trim();
  const confirm       = String(parsed.args[1] || '').toLowerCase();

  if (!sourceGroupId) {
    await sendMinimalError(
      ctx.sock, ctx.from,
      `❌ ${sans('Format')}: clonelist <groupId_sumber>\n${sans('Contoh')}: clonelist 120363xxxxxx@g.us`
    );
    return;
  }

  if (!sourceGroupId.endsWith('@g.us')) {
    await sendMinimalError(
      ctx.sock, ctx.from,
      `❌ ${sans('Group ID harus berformat')}: xxxxxx@g.us`
    );
    return;
  }

  if (sourceGroupId === ctx.from) {
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Tidak bisa clone dari grup yang sama.')}`);
    return;
  }

  const pendingKey = `${ctx.from}:${ctx.sender}`;

  // ── Langkah 2: konfirmasi "ya" ──
  if (confirm === 'ya') {
    const pending = PENDING_CLONE.get(pendingKey);
    if (!pending || pending.sourceGroupId !== sourceGroupId || Date.now() - pending.ts > PENDING_CLONE_TTL_MS) {
      PENDING_CLONE.delete(pendingKey);
      await sendMinimalError(
        ctx.sock, ctx.from,
        `⚠️ ${sans('Sesi konfirmasi habis atau tidak ditemukan.')}\n${sans('Ketik ulang perintah clone.')}`
      );
      return;
    }

    // Eksekusi clone
    PENDING_CLONE.delete(pendingKey);
    await reactLoading(ctx.sock, ctx.msg);

    // Cek sumber punya produk
    const sourceItems = await catalogueRepository.listByGroup(sourceGroupId);
    if (!sourceItems.length) {
      await reactError(ctx.sock, ctx.msg);
      await sendMinimalError(ctx.sock, ctx.from, `📭 ${sans('Grup sumber tidak memiliki produk.')}`);
      return;
    }

    // Resolusi nama grup
    let sourceName = sourceGroupId;
    let targetName = ctx.from;
    try {
      const srcMeta = await ctx.sock.groupMetadata(sourceGroupId);
      sourceName = srcMeta.subject || sourceGroupId;
    } catch (_) {}
    try {
      const tgtMeta = await ctx.sock.groupMetadata(ctx.from);
      targetName = tgtMeta.subject || ctx.from;
    } catch (_) {}

    const { cloned } = await catalogueRepository.cloneToGroup(sourceGroupId, ctx.from, ctx.sender);

    await deleteMessageForEveryone(ctx.sock, ctx.msg);
    await reactSuccess(ctx.sock, ctx.msg);

    await ctx.sock.sendMessage(ctx.from, {
      text:
        `✅ ${styled('Clone list berhasil')}\n\n` +
        `📦 ${sans('Sumber')} : ${styled(sourceName)}\n` +
        `📍 ${sans('Tujuan')} : ${styled(targetName)}\n` +
        `🛒 ${sans('Produk dicopy')} : ${cloned} ${sans('item')}`
    });
    return;
  }

  // ── Langkah 1: minta konfirmasi ──
  PENDING_CLONE.set(pendingKey, { sourceGroupId, ts: Date.now() });

  // Cek preview sumber
  let sourceName = sourceGroupId;
  let itemCount  = '?';
  try {
    const srcMeta = await ctx.sock.groupMetadata(sourceGroupId);
    sourceName = srcMeta.subject || sourceGroupId;
  } catch (_) {}
  try {
    const rows = await catalogueRepository.listByGroup(sourceGroupId);
    itemCount  = rows.length;
  } catch (_) {}

  await ctx.sock.sendMessage(ctx.from, {
    text:
      `⚠️ ${styled('Konfirmasi Clone List')}\n\n` +
      `📦 ${sans('Grup Sumber')} : ${styled(sourceName)}\n` +
      `🛒 ${sans('Produk')}      : ${itemCount} ${sans('item')}\n\n` +
      `${sans('Apakah kamu yakin ingin clone dari grup lama?')}\n` +
      `${sans('Balas dengan')}:\n` +
      `clonelist ${sourceGroupId} ya`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// broadcast — HIDDEN TAG-ALL
// ─────────────────────────────────────────────────────────────────────────────
async function broadcast(ctx, parsed) {
  let text = parsed.raw.slice(parsed.command.length).trim();

  if (!text) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample(`${parsed.command} Halo semua`));
    return;
  }

  text = text.replace(/@\d+/g, '').replace(/\s{2,}/g, ' ').trim();

  if (!text) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample(`${parsed.command} Halo semua`));
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  let meta;
  try {
    meta = await ctx.sock.groupMetadata(ctx.from);
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[broadcast] gagal ambil groupMetadata');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal mengambil data anggota grup.')}`);
    return;
  }

  const participants = meta.participants || [];

  const mentions = [...new Set(
    participants
      .map((p) => {
        const raw = String(p.id || '').trim();
        if (!raw) return null;
        if (raw.includes(':') && raw.includes('@')) {
          const [userPart, domain] = raw.split('@');
          const cleanUser = userPart.split(':')[0];
          return `${cleanUser}@${domain}`;
        }
        return raw;
      })
      .filter(Boolean)
  )];

  logger.info(
    {
      command: parsed.command,
      groupId: ctx.from,
      participantCount: participants.length,
      mentionCount: mentions.length,
      sampleMentions: mentions.slice(0, 5),
      text
    },
    '[broadcast] hidden tag-all debug'
  );

  await ctx.sock.sendMessage(ctx.from, {
    text,
    mentions
  });

  await reactSuccess(ctx.sock, ctx.msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// transactionNote — kirim nota transaksi dengan mention customer
//
// Footer dinamis berdasarkan status:
//   p (Pending) → LOADING... ⏳ Mohon tunggu  lalu @mention
//   d (Done)    → THANK YOU @mention  lalu ❚❙❘❘...
//   r (Refund)  → 🔄 Refund sedang diproses  lalu @mention
//   b (Batal)   → ❌ Transaksi Batal  lalu @mention
// ─────────────────────────────────────────────────────────────────────────────
async function transactionNote(ctx, statusCode) {
  // Ambil contextInfo dari semua tipe pesan yang mungkin membawa reply
  // Ketika admin ketik 'p' (1 huruf), WhatsApp bisa kirim sebagai:
  //   - conversation (tanpa extendedTextMessage) → contextInfo TIDAK ada di sini
  //   - extendedTextMessage → contextInfo ada di dalamnya
  // Kita cek semua kemungkinan path agar reply selalu terdeteksi.
  const msgContent = ctx.msg.message || {};
  const contextInfo =
    msgContent.extendedTextMessage?.contextInfo ||
    msgContent.imageMessage?.contextInfo ||
    msgContent.videoMessage?.contextInfo ||
    msgContent.audioMessage?.contextInfo ||
    msgContent.documentMessage?.contextInfo ||
    msgContent.stickerMessage?.contextInfo ||
    msgContent.buttonsResponseMessage?.contextInfo ||
    null;

  const quoted = contextInfo?.quotedMessage;

  // participant = JID pengirim pesan yang di-reply (bukan sender command)
  const rawParticipant = contextInfo?.participant || contextInfo?.remoteJid || '';

  if (!quoted || !rawParticipant) {
    await sendMinimalError(
      ctx.sock, ctx.from,
      `❌ ${sans('Perintah ini harus dipakai dengan me-reply pesan customer.')}`
    );
    return;
  }

  // Normalize JID: strip device suffix, pastikan format benar
  let userJid = '';
  const rawStr = String(rawParticipant).trim();
  if (rawStr.includes(':') && rawStr.includes('@')) {
    const [userPart, domain] = rawStr.split('@');
    const cleanUser = userPart.split(':')[0];
    userJid = `${cleanUser}@${domain}`;
  } else {
    userJid = rawStr.includes('@') ? rawStr : `${rawStr.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  }

  if (!userJid || !userJid.includes('@')) {
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal membaca JID customer dari pesan yang di-reply.')}`);
    return;
  }

  const userNumber = userJid.split('@')[0];
  const statusMap = { p: 'Pending', d: 'Done', r: 'Refund', b: 'Batal' };
  const status = statusMap[statusCode] || 'Pending';
  const note = extractQuotedText(quoted) || '-';
  const now = nowJakarta();
  const trxId = `TRX-${now.format('YYYYMMDD')}-${crypto.randomInt(1000, 9999)}`;

  // Ambil data level customer
  const { tier } = await customerRepository.getCustomerLevel(ctx.from, userJid);

  // Ambil nama grup sebagai header
  let groupName = 'DITSSTORE';
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    groupName = meta.subject || groupName;
  } catch (_) { /* pakai default jika gagal */ }

  // Mention text
  const mentionLine = `@${userNumber}`;
  const mentionJids = [userJid];

  // Separator pendek (12 karakter)
  const SEP = '────────────';

  // Centering nama grup: padding kiri agar terlihat tengah
  const pad = ' '.repeat(Math.max(0, Math.floor((12 - groupName.length) / 2) + 2));

  // Receipt body dalam triple backtick → font monospace (tampilan struk)
  // Mention HARUS di luar code block agar bisa di-tap sebagai @Nama
  const receiptBody =
    `\`\`\`\n` +
    `${pad}${groupName}\n` +
    `${SEP}\n` +
    `No   : ${trxId}\n` +
    `Date : ${formatDate(now)}\n` +
    `Time : ${formatTime(now)} WIB\n` +
    `Level : ${tier.name} ${tier.emoji}\n\n` +
    `📝 Catatan : ${note}\n` +
    `${SEP}\n` +
    `  Pesanan diproses\n` +
    `${SEP}\n`;

  // Footer + mention berbeda per status
  // - Body ditutup ``` sebelum mention keluar dari code block
  let receiptFooter;
  if (statusCode === 'd') {
    // Done: tutup code block → THANK YOU @mention → barcode
    receiptFooter =
      `\`\`\`\n\n` +
      `THANK YOU ${mentionLine}\n` +
      `❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❘❚❙❘❘❚❙❘❘❚❙❘`;
  } else if (statusCode === 'r') {
    // Refund: status di dalam code block → tutup → @mention
    receiptFooter =
      `🔄 Refund sedang diproses\n` +
      `\`\`\`\n\n` +
      `${mentionLine}`;
  } else if (statusCode === 'b') {
    // Batal: status di dalam code block → tutup → @mention
    receiptFooter =
      `❌ Transaksi Batal\n` +
      `\`\`\`\n\n` +
      `${mentionLine}`;
  } else {
    // Pending: LOADING di dalam code block → tutup → @mention
    receiptFooter =
      `LOADING... ⏳ Mohon tunggu\n` +
      `\`\`\`\n\n` +
      `${mentionLine}`;
  }

  logger.info(
    { command: statusCode, rawParticipant, userJid, mentionJids, groupName },
    '[transactionNote] mention debug'
  );

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  await ctx.sock.sendMessage(ctx.from, {
    text: receiptBody + receiptFooter,
    mentions: mentionJids
  });

  await reactSuccess(ctx.sock, ctx.msg);

  // ── Jika transaksi Done, catat ke sistem level customer ──
  if (statusCode === 'd') {
    const levelResult = await recordSuccess(ctx.from, userJid);
    if (levelResult) {
      const { total, tier: levelTier } = levelResult;
      let levelMsg = `🎖️ ${mentionLine} ${sans('sekarang di level')} ${levelTier.emoji} ${styled(levelTier.name)} (${total}x ${sans('transaksi')})`;

      // Cek apakah baru saja naik level (total == tier.min → baru sampai level ini)
      const justLeveledUp = customerRepository.LEVEL_TIERS.some((t) => t.min === total);
      if (justLeveledUp && levelTier.name !== 'Baru') {
        levelMsg =
          `🎉 ${sans('Selamat')} ${mentionLine}!\n` +
          `${sans('Kamu baru naik ke level')} ${levelTier.emoji} ${styled(levelTier.name)}!\n` +
          `🛒 ${sans('Total transaksi')}: ${total}x`;
      }

      await ctx.sock.sendMessage(ctx.from, {
        text: levelMsg,
        mentions: mentionJids
      });
    }
  }
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
