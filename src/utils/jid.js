function normalizeJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.includes('@')) {
    const [userPart, server] = raw.split('@');
    const user = userPart.split(':')[0].replace(/[^0-9]/g, '');
    if (!user) return '';
    return `${user}@${server}`;
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
  const participant = normalizeJid(key.participant || '');

  if (from.endsWith('@g.us')) {
    return participant || from;
  }

  return participant || from;
}

module.exports = { normalizeJid, toPhoneNumber, getSenderJid };
