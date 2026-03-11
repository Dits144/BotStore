const { normalizeJid } = require('./jid');

function formatWrongExample(example) {
  return `❌ Format salah\nContoh:\n${example}`;
}

function mentionTag(jid = '') {
  const normalized = normalizeJid(jid);
  return `@${normalized.split('@')[0]}`;
}

module.exports = { formatWrongExample, mentionTag };
