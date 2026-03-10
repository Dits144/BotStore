function formatWrongExample(example) {
  return `❌ Format salah\nContoh:\n${example}`;
}

function mentionTag(jid = '') {
  return `@${jid.split('@')[0]}`;
}

module.exports = { formatWrongExample, mentionTag };
