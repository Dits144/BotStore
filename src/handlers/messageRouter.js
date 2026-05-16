const logger = require('../config/logger');
const { parseCommand, normalizeText } = require('../utils/parser');
const { canRunGroupCommand } = require('../middlewares/rentalGuard');
const { isBotOwner, getUserRole } = require('../services/roleService');
const { getSenderJid, getChatJid } = require('../utils/jid');
const { sendText, replyText, sendMentionText, deleteForEveryone } = require('../utils/messageActions');
const ownerCommands = require('../commands/owner');
const rentalCommands = require('../commands/rental');
const groupCommands = require('../commands/group');
const catalogueCommands = require('../commands/catalogue');
const adminCommands = require('../commands/admin');
const groupAdminCommands = require('../commands/admin/groupAdmin');
const menuCommands = require('../commands/menu');
const customerCommands = require('../commands/customer');
const config = require('../config/env');
const { sans } = require('../utils/styledText');

const commandRegistry = {
  owner: ownerCommands.handle,
  delowner: ownerCommands.handle,
  listowner: ownerCommands.handle,
  myrole: ownerCommands.handle,
  cekrole: ownerCommands.handle,
  addsewa: rentalCommands.handle,
  renewsewa: rentalCommands.handle,
  delsewa: rentalCommands.handle,
  listsewa: rentalCommands.handle,
  ceksewa: rentalCommands.handle,
  info: groupCommands.info,
  infogrup: groupCommands.info,
  allmenu: menuCommands.allmenu,
  welcome: adminCommands.handle,
  setwelcome: adminCommands.handle,
  h: adminCommands.handle,
  hall: adminCommands.handle,
  wptagall: adminCommands.handle,
  everyone: adminCommands.handle,
  p: adminCommands.handle,
  d: adminCommands.handle,
  r: adminCommands.handle,
  b: adminCommands.handle,
  list: catalogueCommands.handle,
  addlist: catalogueCommands.handle,
  updatelist: catalogueCommands.handle,
  dellist: catalogueCommands.handle,
  clone: adminCommands.handle,
  level: customerCommands.handle,
  levelboard: customerCommands.handle,
  group: groupAdminCommands.handle
};

// Command yang boleh jalan meski sewa tidak aktif / di luar grup
const BYPASS_RENTAL_COMMANDS = new Set([
  'addsewa', 'renewsewa', 'delsewa', 'listsewa', 'ceksewa',
  'owner', 'delowner', 'listowner', 'myrole', 'cekrole',
  'info', 'infogrup', 'allmenu'
]);

async function routeMessage(sock, msg) {
  const body = extractMessageText(msg);
  if (!body) return;

  const chatJid = getChatJid(msg);
  const senderJid = getSenderJid(msg);
  const isGroup = chatJid.endsWith('@g.us');
  const role = await getUserRole({ sock, chatJid, senderJid, isGroup });
  const isOwner = role === 'bot_owner';

  logger.debug({ chatJid, senderJid, role, bodyPreview: body.slice(0, 30) }, 'message context');

  const ctx = {
    sock,
    msg,
    body,
    chatJid,
    senderJid,
    isGroup,
    role,
    isOwner,
    // backward compatible aliases
    from: chatJid,
    sender: senderJid,
    sendText: (text, options = {}) => sendText(sock, chatJid, text, options),
    replyText: (text, options = {}) => replyText(sock, chatJid, msg, text, options),
    sendMentionText: (text, mentionJids = [], options = {}) => sendMentionText(sock, chatJid, text, mentionJids, options),
    deleteForEveryone: () => deleteForEveryone(sock, msg),
    send: (text, options = {}, sendOptions = {}) => sock.sendMessage(chatJid, { text, ...options }, sendOptions),
    reply: (text, options = {}) => replyText(sock, chatJid, msg, text, options)
  };

  const isClaimOwnerText = normalizeText(body) === normalizeText(config.ownerClaimCode);
  if (isClaimOwnerText) {
    if (isGroup) {
      await ctx.sendText(`❌ ${sans('Claim Owner hanya bisa dilakukan di chat pribadi bot.')}`);
      return;
    }
    await ownerCommands.claimOwner(ctx);
    return;
  }

  const parsed = parseCommand(body);
  if (!parsed.command) {
    if (isGroup) {
      const rentalOk = await canRunGroupCommand({ isGroup, isOwner, groupId: chatJid });
      if (rentalOk) await catalogueCommands.productTrigger(ctx, body);
    }
    return;
  }

  const handler = commandRegistry[parsed.command];
  if (!handler) {
    if (isGroup) {
      const rentalOk = await canRunGroupCommand({ isGroup, isOwner, groupId: chatJid });
      if (rentalOk) await catalogueCommands.productTrigger(ctx, body);
    }
    return;
  }

  if (isGroup && !BYPASS_RENTAL_COMMANDS.has(parsed.command)) {
    const allowed = await canRunGroupCommand({ isGroup, isOwner, groupId: chatJid });
    if (!allowed) return;
  }

  await handler(ctx, parsed);
}

function extractMessageText(msg) {
  const m = msg.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  ).trim();
}

module.exports = { routeMessage };
