const { normalizeUserJid, toMentionJid } = require('./jid');
const logger = require('../config/logger');

function formatWrongExample(example) {
  return `❌ Format salah\nContoh:\n${example}`;
}

// ---------------------------------------------------------------
// renderMentionText
// Ganti semua kemunculan @user dalam template dengan @nomor,
// dan kembalikan mentions array berisi JID penuh.
//
// WhatsApp akan render @nomor sebagai mention aktif HANYA jika
// JID yang sama ada di `mentions` array.
//
// @param {string} textTemplate  - Template dengan @user placeholder
// @param {string} targetJid     - JID penuh target (628xxx@s.whatsapp.net)
// @returns {{ text: string, mentions: string[] }}
// ---------------------------------------------------------------
function renderMentionText(textTemplate = '', targetJid = '') {
  // Normalize JID — pastikan format 628xxx@s.whatsapp.net
  const normalized = toMentionJid(targetJid) || normalizeUserJid(targetJid);

  // Ambil nomor saja untuk teks (WhatsApp render @628xxx → @Username)
  const userNumber = normalized ? normalized.split('@')[0] : null;

  let renderedText = String(textTemplate || '');

  if (userNumber) {
    // CRITICAL: ganti @user → @628xxx (bukan @user lagi!)
    renderedText = renderedText.replaceAll('@user', `@${userNumber}`);
  }
  // Jika JID tidak valid, biarkan @user sebagai teks biasa (graceful degradation)

  const mentions = normalized ? [normalized] : [];

  // Debug log
  logger.debug(
    {
      targetJid,
      normalized,
      renderedText,
      mentions
    },
    '[renderMentionText] mention debug'
  );

  return { text: renderedText, mentions };
}

// ---------------------------------------------------------------
// buildMentionText
// Untuk multi-target mention.
// Ganti @user secara berurutan untuk setiap target.
//
// @param {string} textTemplate
// @param {string|string[]} targets - array of JIDs
// @returns {{ text: string, mentions: string[] }}
// ---------------------------------------------------------------
function buildMentionText(textTemplate = '', targets = []) {
  const safeTargets = (Array.isArray(targets) ? targets : [targets])
    .map((t) => toMentionJid(typeof t === 'string' ? t : (t?.jid || '')))
    .filter(Boolean);

  const uniqueTargets = [...new Set(safeTargets)];

  let renderedText = String(textTemplate || '');

  if (uniqueTargets.length === 1) {
    // Satu target: ganti semua @user
    const num = uniqueTargets[0].split('@')[0];
    renderedText = renderedText.replaceAll('@user', `@${num}`);
  } else {
    // Multi target: ganti @user satu per satu berurutan
    for (const jid of uniqueTargets) {
      const num = jid.split('@')[0];
      renderedText = renderedText.replace('@user', `@${num}`);
    }
  }

  logger.debug(
    { uniqueTargets, renderedText, mentions: uniqueTargets },
    '[buildMentionText] mention debug'
  );

  return { text: renderedText, mentions: uniqueTargets };
}

function mentionTag(jid = '', fallback = 'user') {
  const normalized = toMentionJid(jid);
  const user = normalized ? normalized.split('@')[0] : null;
  return user ? `@${user}` : `@${fallback}`;
}

module.exports = { formatWrongExample, mentionTag, buildMentionText, renderMentionText };
