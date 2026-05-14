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
const { styled, sans } = require('../../utils/styledText');

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
// broadcast — HIDDEN TAG-ALL
//
// HOW IT WORKS:
//   WhatsApp mention system punya 2 layer terpisah:
//   1. `text`     = string yang TAMPIL di layar chat
//   2. `mentions` = array JID yang dapat NOTIFIKASI
//
//   Keduanya INDEPENDEN. Kita bisa kirim:
//     text: "halo semua"            ← tidak ada @nomor sama sekali
//     mentions: [628aaa, 628bbb...] ← semua dapat notif
//
//   Hasilnya: pesan tampil "halo semua", semua anggota dapat notif tag.
//   Ini yang disebut hidden tag-all.
//
//   KUNCI: text TIDAK boleh mengandung @nomor sama sekali.
//   Jika ada @nomor di text → WhatsApp render sebagai @+6281xx... (visible mention).
//   Jika text bersih → mentions bekerja silent di background.
// ─────────────────────────────────────────────────────────────────────────────
async function broadcast(ctx, parsed) {
  // Ambil teks setelah nama command, strip semua @-mention yang mungkin ada
  let text = parsed.raw.slice(parsed.command.length).trim();

  if (!text) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample(`${parsed.command} Halo semua`));
    return;
  }

  // PENTING: strip semua @nomor dari teks agar tidak tampil sebagai visible mention
  // Regex ini hapus pola @angka (misal @628123) yang mungkin lolos dari input
  text = text.replace(/@\d+/g, '').replace(/\s{2,}/g, ' ').trim();

  if (!text) {
    await sendMinimalError(ctx.sock, ctx.from, formatWrongExample(`${parsed.command} Halo semua`));
    return;
  }

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  // Ambil semua participant dari groupMetadata
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

  // Build mentions: ambil JID mentah langsung dari p.id tanpa normalisasi berlebihan
  // Baileys groupMetadata sudah return JID dalam format yang benar (628xxx@s.whatsapp.net)
  // Normalisasi hanya untuk strip device suffix (:0, :12, dll)
  const mentions = [...new Set(
    participants
      .map((p) => {
        const raw = String(p.id || '').trim();
        if (!raw) return null;
        // Strip device suffix jika ada: 628xxx:12@s.whatsapp.net → 628xxx@s.whatsapp.net
        if (raw.includes(':') && raw.includes('@')) {
          const [userPart, domain] = raw.split('@');
          const cleanUser = userPart.split(':')[0];
          return `${cleanUser}@${domain}`;
        }
        return raw;
      })
      .filter(Boolean)
  )];

  // Debug log wajib
  logger.info(
    {
      command: parsed.command,
      groupId: ctx.from,
      participantCount: participants.length,
      mentionCount: mentions.length,
      sampleMentions: mentions.slice(0, 5),
      text   // log teks final yang dikirim untuk verifikasi tidak ada @nomor
    },
    '[broadcast] hidden tag-all debug'
  );

  // Kirim: text BERSIH + mentions PENUH
  // text = "halo semua"         → tampil di chat tanpa @nomor
  // mentions = [628aaa, 628bbb] → semua dapat notif hidden
  await ctx.sock.sendMessage(ctx.from, {
    text,
    mentions
  });

  await reactSuccess(ctx.sock, ctx.msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// transactionNote — kirim nota transaksi dengan mention customer
//
// Format receipt: DITSSTORE ORDER RECEIPT
// Footer dinamis berdasarkan status:
//   p (Pending) → LOADING... ⏳ Mohon tunggu
//   d (Done)    → THANK YOU ║▌│█║▌│ █║▌│█│║▌║
//   r (Refund)  → 🔄 Refund sedang diproses
//   b (Batal)   → ❌ Transaksi Batal
// ─────────────────────────────────────────────────────────────────────────────
async function transactionNote(ctx, statusCode) {
  // Ambil contextInfo dari pesan yang di-reply
  const contextInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
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

  // Footer dinamis berdasarkan status
  const footerMap = {
    p: `Pesanan diproses\n──────────────────\nLOADING... ⏳ Mohon tunggu`,
    d: `Pesanan diproses\n──────────────────\nTHANK YOU\n║▌│█║▌│ █║▌│█│║▌║`,
    r: `Pesanan diproses\n──────────────────\n🔄 Refund sedang diproses`,
    b: `Pesanan dibatalkan\n──────────────────\n❌ Transaksi Batal`
  };
  const footer = footerMap[statusCode] || footerMap['p'];

  // Render mention text
  const mentionLine = `@${userNumber}`;
  const mentionJids = [userJid];

  logger.info(
    { command: statusCode, rawParticipant, userJid, mentionJids },
    '[transactionNote] mention debug'
  );

  await reactLoading(ctx.sock, ctx.msg);
  await deleteMessageForEveryone(ctx.sock, ctx.msg);

  await ctx.sock.sendMessage(ctx.from, {
    text:
      `DITSSTORE ORDER RECEIPT\n` +
      `──────────────────\n` +
      `No   : ${trxId}\n` +
      `Date : ${formatDate(now)}\n` +
      `Time : ${formatTime(now)} WIB\n` +
      `Status: ${status}\n` +
      `Pesan : ${note}\n` +
      `──────────────────\n` +
      `${footer}\n` +
      `──────────────────\n` +
      `${mentionLine}`,
    mentions: mentionJids
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
