function normalizeUserJid(input = '') {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  let user = raw;
  if (raw.includes('@')) user = raw.split('@')[0];
  user = user.split(':')[0].split('.')[0].replace(/[^0-9]/g, '');
  if (!user) return '';

  if (raw.endsWith('@lid')) {
    return `${user}@lid`;
  }
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

function getBotJids(sock) {
  const jids = new Set();
  
  // 1. Phone number based
  const id = sock?.user?.id || sock?.user?.jid || sock?.authState?.creds?.me?.id || '';
  if (id) {
    jids.add(normalizeUserJid(id));
  }
  
  // 2. LID based (WhatsApp LID system)
  const lid = sock?.user?.lid || sock?.authState?.creds?.me?.lid || '';
  if (lid) {
    jids.add(normalizeUserJid(lid));
  }
  
  return Array.from(jids).filter(Boolean);
}

module.exports = {
  normalizeUserJid,
  normalizeGroupJid,
  normalizeAnyJid,
  getSenderJid,
  getChatJid,
  jidToPhone,
  getBotJids,
  // backward compatibility aliases
  normalizeJid: normalizeAnyJid,
  toMentionJid: normalizeUserJid,
  toPhoneNumber: jidToPhone
};
