const { normalizeJid } = require('./jid');

function formatWrongExample(example) {
  return `❌ Format salah\nContoh:\n${example}`;
}

function mentionTag(jid = '', fallback = 'user') {
  const normalized = normalizeJid(jid);
  const user = normalized.split('@')[0];
  return user ? `@${fallback}` : `@${fallback}`;
}

function renderMentionText(textTemplate = '', targetJid = '', targetName = 'user') {
  const normalized = normalizeJid(targetJid);
  const safeName = String(targetName || 'user').trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || 'user';
  const renderedText = String(textTemplate || '').replaceAll('@user', `@${safeName}`);

  return {
    text: renderedText,
    mentions: normalized ? [normalized] : []
  };
}

module.exports = { formatWrongExample, mentionTag, renderMentionText };
