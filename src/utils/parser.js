const config = require('../config/env');

function parseCommand(text = '') {
  const raw = String(text || '').trim();
  if (!raw) return { raw: '', command: '', args: [] };

  const msg = config.commandPrefix && raw.startsWith(config.commandPrefix)
    ? raw.slice(config.commandPrefix.length)
    : raw;

  const parts = msg.trim().split(/\s+/);
  if (!parts.length) return { raw, command: '', args: [] };

  return {
    raw,
    command: parts[0].toLowerCase(),
    args: parts.slice(1)
  };
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

module.exports = { parseCommand, normalizeText };
