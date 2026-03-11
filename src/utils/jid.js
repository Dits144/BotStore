function normalizeJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.includes('@')) {
    const [userPart, serverPart] = raw.split('@');
    const user = userPart.split(':')[0].replace(/[^0-9]/g, '');
    if (!user) return '';

    const server = String(serverPart || '').trim();
    if (server === 'g.us') return `${user}@g.us`;
    return `${user}@s.whatsapp.net`;
  }

  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return `${digits}@s.whatsapp.net`;
}

function toPhoneNumber(jid = '') {
  return normalizeJid(jid).split('@')[0] || '-';
}

function getSenderJid(msg = {}) {
  const key = msg.key || {};
  const from = normalizeJid(key.remoteJid || '');

  if (from.endsWith('@g.us')) {
    return normalizeJid(key.participant || '');
  }

  return from;
}

module.exports = { normalizeJid, toPhoneNumber, getSenderJid };
