function toTitle(title) {
  return `📘 *${title}*`;
}

function bulletList(items = []) {
  return items.map((item) => `• ${item}`).join('\n');
}

function commandItem(command, description) {
  return `.${command} — ${description}`;
}

function compactLines(lines = []) {
  return lines.filter(Boolean).join('\n');
}

module.exports = {
  toTitle,
  bulletList,
  commandItem,
  compactLines
};
