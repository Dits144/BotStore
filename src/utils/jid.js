function normalizeJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.endsWith('@g.us')) {
    const user = raw.split('@')[0].replace(/[^0-9]/g, '');
    return user ? `${user}@g.us` : '';
  }

  let user = raw;
  if (raw.includes('@')) {
    user = raw.split('@')[0];
  }

  user = user.split(':')[0].replace(/[^0-9]/g, '');
  if (!user) return '';

  return `${user}@s.whatsapp.net`;
}

function toMentionJid(input = '') {
  return normalizeJid(input);
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
