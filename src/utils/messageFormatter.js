const { normalizeJid, toMentionJid } = require('./jid');

function formatWrongExample(example) {
  return `❌ Format salah\nContoh:\n${example}`;
}

function mentionTag(jid = '', fallback = 'user') {
  const normalized = normalizeJid(jid);
  const user = normalized.split('@')[0];
  return user ? `@${fallback}` : `@${fallback}`;
}

function buildMentionText(textTemplate = '', targets = []) {
  const safeTargets = (Array.isArray(targets) ? targets : [targets])
    .map((t) => toMentionJid(typeof t === 'string' ? t : t?.jid || ''))
    .filter(Boolean);

  let renderedText = String(textTemplate || '');
  for (const _t of safeTargets) {
    renderedText = renderedText.replace('@user', '@user');
  }

  return { text: renderedText, mentions: [...new Set(safeTargets)] };
}

function renderMentionText(textTemplate = '', targetJid = '') {
  const normalized = toMentionJid(targetJid);
  const userNumber = normalized ? normalized.split('@')[0] : 'user';
  
  // Mengganti @user menjadi @nomor agar WhatsApp otomatis mengubahnya menjadi @Username
  const renderedText = String(textTemplate || '').replaceAll('@user', `@${userNumber}`);

  return {
    text: renderedText,
    mentions: normalized ? [normalized] : []
  };
}

module.exports = { formatWrongExample, mentionTag, buildMentionText, renderMentionText };
