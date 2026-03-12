function normalizeJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.includes('@')) {
    const [userPart, serverPart] = raw.split('@');
    const user = userPart.split(':')[0].replace(/[^0-9]/g, '');
    if (!user) return '';

    const server = String(serverPart || '').trim();
    if (server === 'g.us') return `${user}@g.us`;
    return `${user}@c.us`;
  }

  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return `${digits}@c.us`;
}

function toMentionJid(input = '') {
  const normalized = normalizeJid(input);
  if (!normalized || normalized.endsWith('@g.us')) return normalized;
  return `${normalized.split('@')[0]}@s.whatsapp.net`;
}

function toPhoneNumber(jid = '') {
  return normalizeJid(jid).split('@')[0] || '-';
}

function getSenderJid(msg = {}) {
  const key = msg.key || {};
  const remoteJid = String(key.remoteJid || '').trim();

  if (remoteJid.endsWith('@g.us')) {
    const participant =
      key.participant ||
      msg.message?.extendedTextMessage?.contextInfo?.participant ||
      msg.message?.imageMessage?.contextInfo?.participant ||
      msg.message?.videoMessage?.contextInfo?.participant ||
      msg.message?.documentMessage?.contextInfo?.participant ||
      '';

    return normalizeJid(participant);
  }

  return normalizeJid(remoteJid);
}

module.exports = { normalizeJid, toMentionJid, toPhoneNumber, getSenderJid };
