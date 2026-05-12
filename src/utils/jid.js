function normalizeUserJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  let user = raw;
  if (raw.includes('@')) user = raw.split('@')[0];
  user = user.split(':')[0].replace(/[^0-9]/g, '');
  if (!user) return '';

  return `${user}@s.whatsapp.net`;
}

function normalizeGroupJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';
  const user = raw.split('@')[0].replace(/[^0-9-]/g, '');
  if (!user) return '';
  return `${user}@g.us`;
}

function normalizeAnyJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.endsWith('@g.us')) return normalizeGroupJid(raw);
  return normalizeUserJid(raw);
}

function getChatJid(msg = {}) {
  return normalizeAnyJid(msg?.key?.remoteJid || '');
}

function getSenderJid(msg = {}) {
  const key = msg.key || {};
  const chatJid = String(key.remoteJid || '').trim().toLowerCase();

  if (chatJid.endsWith('@g.us')) {
    const participant =
      key.participant ||
      msg.message?.extendedTextMessage?.contextInfo?.participant ||
      msg.message?.imageMessage?.contextInfo?.participant ||
      msg.message?.videoMessage?.contextInfo?.participant ||
      msg.message?.documentMessage?.contextInfo?.participant ||
      '';
    return normalizeUserJid(participant);
  }

  return normalizeUserJid(chatJid);
}

function jidToPhone(jid = '') {
  return normalizeUserJid(jid).split('@')[0] || '-';
}

module.exports = {
  normalizeUserJid,
  normalizeGroupJid,
  normalizeAnyJid,
  getSenderJid,
  getChatJid,
  jidToPhone,
  // backward compatibility aliases
  normalizeJid: normalizeAnyJid,
  toMentionJid: normalizeUserJid,
  toPhoneNumber: jidToPhone
};
