const { toMentionJid } = require('./jid');
const logger = require('../config/logger');
const { sans } = require('./styledText');

function formatWrongExample(example) {
  return `❌ ${sans('Format salah')}\n${sans('Contoh:')}\n${example}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// renderMentionText
//
// Ganti @user di template dengan @nomor, dan return mentions array.
//
// CARA KERJA MENTION WHATSAPP:
//   text: "Halo @628xxx selamat datang"  → WhatsApp render sebagai link biru
//   mentions: ["628xxx@s.whatsapp.net"]  → 628xxx dapat notifikasi
//
//   Keduanya HARUS sinkron: @nomor di teks harus ada JID-nya di mentions.
//
// TENTANG DISPLAY:
//   Jika nomor disimpan di kontak → tampil @NamaKontak
//   Jika nomor TIDAK disimpan     → tampil @+62 812-xxx (format internasional)
//   Ini behavior WhatsApp, bukan bug kode.
//
// @param {string} textTemplate - Template dengan placeholder @user
// @param {string} targetJid    - JID target, contoh: 628xxx@s.whatsapp.net
// @returns {{ text: string, mentions: string[] }}
// ─────────────────────────────────────────────────────────────────────────────
function renderMentionText(textTemplate = '', targetJid = '') {
  // Normalize JID: strip device suffix (:0, :12) jika ada
  let normalized = '';
  const rawJid = String(targetJid || '').trim();

  if (rawJid) {
    if (rawJid.includes(':') && rawJid.includes('@')) {
      const [userPart, domain] = rawJid.split('@');
      const cleanUser = userPart.split(':')[0];
      normalized = `${cleanUser}@${domain}`;
    } else if (rawJid.includes('@')) {
      normalized = rawJid;
    } else {
      // Fallback: anggap nomor saja
      const digits = rawJid.replace(/[^0-9]/g, '');
      normalized = digits ? `${digits}@s.whatsapp.net` : '';
    }
  }

  // Jika toMentionJid tersedia dan lebih lengkap, pakai itu
  if (!normalized && rawJid) {
    normalized = toMentionJid(rawJid);
  }

  const userNumber = normalized ? normalized.split('@')[0] : null;
  let renderedText = String(textTemplate || '');

  if (userNumber) {
    // Ganti @user → @628xxx agar WhatsApp render sebagai mention aktif
    renderedText = renderedText.replaceAll('@user', `@${userNumber}`);
  }

  const mentions = normalized ? [normalized] : [];

  logger.debug(
    { targetJid, normalized, userNumber, renderedText, mentions },
    '[renderMentionText] debug'
  );

  return { text: renderedText, mentions };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildMentionText
// Untuk multi-target (misal tag beberapa orang sekaligus).
// ─────────────────────────────────────────────────────────────────────────────
function buildMentionText(textTemplate = '', targets = []) {
  const rawTargets = Array.isArray(targets) ? targets : [targets];

  const uniqueJids = [...new Set(
    rawTargets
      .map((t) => {
        const raw = typeof t === 'string' ? t : (t?.jid || t?.id || '');
        return toMentionJid(raw);
      })
      .filter(Boolean)
  )];

  let renderedText = String(textTemplate || '');

  if (uniqueJids.length === 1) {
    const num = uniqueJids[0].split('@')[0];
    renderedText = renderedText.replaceAll('@user', `@${num}`);
  } else {
    for (const jid of uniqueJids) {
      const num = jid.split('@')[0];
      // replace hanya kemunculan pertama per iterasi
      renderedText = renderedText.replace('@user', `@${num}`);
    }
  }

  logger.debug(
    { uniqueJids, renderedText },
    '[buildMentionText] debug'
  );

  return { text: renderedText, mentions: uniqueJids };
}

function mentionTag(jid = '', fallback = 'user') {
  const normalized = toMentionJid(jid);
  const user = normalized ? normalized.split('@')[0] : null;
  return user ? `@${user}` : `@${fallback}`;
}

module.exports = { formatWrongExample, mentionTag, buildMentionText, renderMentionText };
