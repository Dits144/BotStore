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
const { processTransaction } = require('../../services/transactionService');
const transactionRepository = require('../../repositories/transactionRepository');
const { connectDatabase } = require('../../database/connection');
const { durationForCommand, expiryFrom } = require('../../services/warrantyService');

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
  if (['p', 'd', 'r', 'b'].includes(parsed.command)) return transactionNote(ctx, parsed.command, parsed.args);
  if (parsed.command === 'clone') return cloneList(ctx, parsed);
  if (parsed.command === 'clearall') return clearAllGroupData(ctx);


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
  if (!raw.startsWith('@')) {
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Format salah')}\n${sans('Contoh:')}\nsetwelcome@Halo @user, selamat datang di {group}`);
    return;
  }
  const templateRaw = raw.slice(1).trim();
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
      `❌ ${sans('Format')}: clone <groupId_sumber>\n${sans('Contoh')}: clone 120363xxxxxx@g.us`

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
      `clone ${sourceGroupId} ya`

  });
}

async function getImageBuffer(ctx) {
  const directImage = ctx.msg?.message?.imageMessage;
  const baileys = await import('@whiskeysockets/baileys');
  if (directImage) {
    if (typeof ctx.sock.downloadMediaMessage === 'function') {
      return await ctx.sock.downloadMediaMessage(ctx.msg, 'buffer', {}, {});
    }
    return await baileys.downloadMediaMessage(
      ctx.msg,
      'buffer',
      {},
      { logger: undefined, reuploadRequest: ctx.sock.updateMediaMessage }
    );
  }

  const quotedMsg = ctx.msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quotedMsg?.imageMessage) {
    const downloadMsg = { message: quotedMsg };
    if (typeof ctx.sock.downloadMediaMessage === 'function') {
      return await ctx.sock.downloadMediaMessage(downloadMsg, 'buffer', {}, {});
    }
    return await baileys.downloadMediaMessage(
      downloadMsg,
      'buffer',
      {},
      { logger: undefined, reuploadRequest: ctx.sock.updateMediaMessage }
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// broadcast — HIDDEN TAG-ALL
// ─────────────────────────────────────────────────────────────────────────────
async function broadcast(ctx, parsed) {
  let rawText = ctx.body || parsed.raw || '';
  let text = rawText.replace(/^[./#!]?(h|hall|wptagall|everyone)\s*/i, '').trim();

  // Bersihkan dari mention manual dan spasi horizontal berlebih (preservasi paragraf/newline)
  text = text.replace(/@\d+/g, '').replace(/[ \t]{2,}/g, ' ').trim();

  let imageBuffer = null;
  try {
    imageBuffer = await getImageBuffer(ctx);
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[broadcast] gagal mengambil gambar');
  }

  if (!text && !imageBuffer) {
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
      text,
      hasImage: !!imageBuffer
    },
    '[broadcast] hidden tag-all debug'
  );

  try {
    if (imageBuffer) {
      await ctx.sock.sendMessage(ctx.from, {
        image: imageBuffer,
        caption: text || '',
        mentions
      });
    } else {
      await ctx.sock.sendMessage(ctx.from, {
        text,
        mentions
      });
    }
    await reactSuccess(ctx.sock, ctx.msg);
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[broadcast] gagal kirim pesan');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Gagal mengirimkan pesan broadcast.')}`);
  }
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
async function transactionNote(ctx, statusCode, args = []) {
  // Ambil contextInfo dari semua tipe pesan yang mungkin membawa reply
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

  // Normalize JID
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
  const statusMap = { p: 'pending', d: 'done', r: 'refund', b: 'batal' };
  const statusDb   = statusMap[statusCode] || 'pending';
  const statusLabel = { p: 'Pending', d: 'Done', r: 'Refund', b: 'Batal' }[statusCode] || 'Pending';

  // Ekstrak teks caption dari pesan yang di-reply (nama produk / catatan customer)
  const noteText = extractQuotedText(quoted) || '';
  // Ambil baris pertama sebagai nama produk (misalnya "capcut", "ml", dll)
  const productGuess = noteText.split(/\n/)[0].trim().slice(0, 80);

  const paymentMessageId = contextInfo?.stanzaId || null;

  // Durasi: jika p, cek args dan teks caption
  let duration = null;
  if (statusCode === 'p') {
    try {
      const overrideArg = Array.isArray(args) ? args.join(' ').trim() : '';
      duration = durationForCommand(overrideArg, noteText);
    } catch (err) {
      await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans(err.message)}`);
      return;
    }
  }

  const now = nowJakarta();

  // Ambil data level customer
  const { tier } = await customerRepository.getCustomerLevel(ctx.from, userJid);

  // Ambil nama grup
  let groupName = 'DITSSTORE';
  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    groupName = meta.subject || groupName;
  } catch (_) {}

  let trxId = '';
  let ocrAmount = 0;
  let finalDurationLabel = duration?.label || null;
  const startedAt = now.toISOString();
  const expiresAt = duration ? expiryFrom(startedAt, duration) : null;

  try {
    const db = await connectDatabase();

    if (statusCode === 'p') {
      // Cek apakah bukti TF ini sudah pernah diproses sebelumnya (misal koreksi P 1 Bulan)
      const existing = paymentMessageId
        ? await transactionRepository.getByPaymentMessage(ctx.from, paymentMessageId)
        : null;

      if (existing) {
        trxId = existing.trx_id;
        ocrAmount = existing.amount;
        if (duration) {
          await transactionRepository.updateDuration(existing.trx_id, duration, existing.started_at || startedAt);
          finalDurationLabel = duration.label;
        } else {
          finalDurationLabel = existing.duration_label;
        }
        logger.info({ trxId, groupId: ctx.from }, '[transactionNote] transaksi durasi diperbarui');
      } else {
        // Download gambar dari pesan yang di-reply (jika ada)
        let imageBuffer = null;
        try { imageBuffer = await getImageBuffer(ctx); } catch (_) {}

        const result = await processTransaction({
          imageBuffer,
          captionText: noteText,
          groupId: ctx.from,
          groupName,
          customerJid: userJid,
          adminJid: ctx.sender,
          product: productGuess,
          status: 'pending',
          paymentMessageId,
          durationValue: duration?.value || null,
          durationUnit: duration?.unit || null,
          durationLabel: duration?.label || null,
          startedAt,
          expiresAt,
          doneAt: null,
        });
        trxId = result.trxId;
        ocrAmount = result.amount;
        logger.info({ trxId, ocrAmount, groupId: ctx.from }, '[transactionNote] transaksi baru tersimpan');
      }
    } else {
      // statusCode is 'd', 'r', or 'b'
      // 1. Coba cari berdasarkan paymentMessageId yang di-reply
      let targetTrx = paymentMessageId
        ? await transactionRepository.getByPaymentMessage(ctx.from, paymentMessageId)
        : null;

      // 2. Coba cari dari teks quoted jika me-reply nota (TRX-...)
      if (!targetTrx) {
        const matchTrx = noteText.match(/TRX-\d{8}-\d{4}/i);
        if (matchTrx) {
          targetTrx = await db.get(
            'SELECT * FROM transactions WHERE trx_id = ? AND group_id = ?',
            [matchTrx[0], ctx.from]
          );
        }
      }

      // 3. Fallback: ambil transaksi pending terakhir untuk customer ini di grup
      if (!targetTrx) {
        targetTrx = await db.get(
          'SELECT * FROM transactions WHERE group_id = ? AND customer_jid = ? AND status = "pending" ORDER BY created_at DESC LIMIT 1',
          [ctx.from, userJid]
        );
      }

      if (targetTrx) {
        trxId = targetTrx.trx_id;
        ocrAmount = targetTrx.amount;
        finalDurationLabel = targetTrx.duration_label;
        const nowIso = now.toISOString();
        const doneAtVal = statusCode === 'd' ? (targetTrx.done_at || nowIso) : null;
        await db.run(
          'UPDATE transactions SET status = ?, done_at = ?, updated_at = ? WHERE trx_id = ?',
          [statusDb, doneAtVal, nowIso, targetTrx.trx_id]
        );
        logger.info({ trxId, statusDb, groupId: ctx.from }, '[transactionNote] status transaksi diperbarui');
      } else {
        // Fallback simpan transaksi baru jika belum ada riwayat sebelumnya
        let imageBuffer = null;
        try { imageBuffer = await getImageBuffer(ctx); } catch (_) {}
        const result = await processTransaction({
          imageBuffer,
          captionText: noteText,
          groupId: ctx.from,
          groupName,
          customerJid: userJid,
          adminJid: ctx.sender,
          product: productGuess,
          status: statusDb,
          paymentMessageId,
          durationValue: null,
          durationUnit: null,
          durationLabel: null,
          startedAt: null,
          expiresAt: null,
          doneAt: statusCode === 'd' ? now.toISOString() : null,
        });
        trxId = result.trxId;
        ocrAmount = result.amount;
      }
    }
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[transactionNote] gagal proses transaksi');
    if (!trxId) {
      trxId = `TRX-${now.format('YYYYMMDD')}-${crypto.randomInt(1000, 9999)}`;
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const mentionLine = `@${userNumber}`;
  const mentionJids = [userJid];
  const SEP = '────────────';
  const pad = ' '.repeat(Math.max(0, Math.floor((12 - groupName.length) / 2) + 2));

  // Baris nominal (hanya tampilkan jika OCR berhasil)
  const nominalLine = ocrAmount > 0
    ? `💰 Nominal : Rp${ocrAmount.toLocaleString('id-ID')}\n`
    : '';

  // Baris durasi jika ada durasi yang terdeteksi/diset
  const durationLine = finalDurationLabel
    ? `⏳ Durasi : ${finalDurationLabel}\n`
    : '';

  let statusText = '  Pesanan diproses';
  if (statusCode === 'd') {
    statusText = '  ✅ Pesanan Selesai';
  } else if (statusCode === 'r') {
    statusText = '  Pesanan Refund';
  } else if (statusCode === 'b') {
    statusText = '  Pesanan Batal';
  }

  const receiptBody =
    '```\n' +
    `${pad}${groupName}\n` +
    `${SEP}\n` +
    `No   : ${trxId}\n` +
    `Date : ${formatDate(now)}\n` +
    `Time : ${formatTime(now)} WIB\n` +
    `Level : ${tier.name} ${tier.emoji}\n\n` +
    `📝 Produk : ${productGuess || '-'}\n` +
    durationLine +
    nominalLine +
    `${SEP}\n` +
    `${statusText}\n` +
    `${SEP}\n`;

  let receiptFooter;
  if (statusCode === 'd') {
    receiptFooter =
      '```\n\n' +
      `THANK YOU ${mentionLine}\n` +
      '❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❚❙❘❘❘❚❙❘❘❚❙❘❘❚❙❘';
  } else if (statusCode === 'r') {
    receiptFooter =
      '```\n\n' +
      `🔄 Refund Berhasil\n\n` +
      `Maaf 🥺 ${mentionLine}`;
  } else if (statusCode === 'b') {
    receiptFooter =
      '```\n\n' +
      `❌ Transaksi Batal\n\n` +
      `Maaf 🥺 ${mentionLine}`;
  } else {
    receiptFooter =
      `LOADING... ⏳ Mohon tunggu\n` +
      '```\n\n' +
      mentionLine;
  }

  logger.info(
    { command: statusCode, rawParticipant, userJid, mentionJids, groupName, trxId, ocrAmount },
    '[transactionNote] kirim struk'
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
      const justLeveledUp = customerRepository.LEVEL_TIERS.some((t) => t.min === total);
      if (justLeveledUp && levelTier.name !== 'Baru') {
        const levelMsg =
          `🎉 ${sans('Selamat')} ${mentionLine}!\n` +
          `${sans('Kamu baru naik ke level')} ${levelTier.emoji} ${styled(levelTier.name)}!\n` +
          `🛒 ${sans('Total transaksi')}: ${total}x`;

        await ctx.sock.sendMessage(ctx.from, {
          text: levelMsg,
          mentions: mentionJids
        });
      }
    }
  }
}

async function clearAllGroupData(ctx) {
  await reactLoading(ctx.sock, ctx.msg);
  try {
    const transactionRepository = require('../../repositories/transactionRepository');
    await transactionRepository.clearAll(ctx.from);
    await deleteMessageForEveryone(ctx.sock, ctx.msg);
    await reactSuccess(ctx.sock, ctx.msg);
    await ctx.reply(`✅ *${styled('Reset Data Berhasil')}*\n\nSemua riwayat transaksi dan rekap grafik penjualan di grup ini telah dihapus bersih.`);
  } catch (err) {
    logger.error({ err, groupId: ctx.from }, '[clearAllGroupData] gagal reset data');
    await reactError(ctx.sock, ctx.msg);
    await sendMinimalError(ctx.sock, ctx.from, `❌ Gagal mereset data: ${err.message}`);
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
