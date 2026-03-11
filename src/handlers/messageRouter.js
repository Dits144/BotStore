const { parseCommand, normalizeText } = require('../utils/parser');
const { canRunGroupCommand } = require('../middlewares/rentalGuard');
const { isBotOwner } = require('../services/roleService');
const ownerCommands = require('../commands/owner');
const rentalCommands = require('../commands/rental');
const groupCommands = require('../commands/group');
const catalogueCommands = require('../commands/catalogue');
const config = require('../config/env');

async function routeMessage(sock, msg) {
  const body = extractMessageText(msg);
  if (!body) return;

  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const isOwner = await isBotOwner(sender);

  const context = {
    sock,
    msg,
    body,
    from,
    sender,
    isGroup,
    isOwner,
    send: async (text, options = {}) => sock.sendMessage(from, { text, ...options }, { quoted: msg })
  };

  if (!isGroup && normalizeText(body) === normalizeText(config.ownerClaimCode)) {
    await ownerCommands.claimOwner(context);
    return;
  }

  const parsed = parseCommand(body);
  if (!parsed.command) return;

  if (['owner', 'delowner', 'listowner'].includes(parsed.command)) {
    await ownerCommands.handle(context, parsed);
    return;
  }

  if (['addsewa', 'renewsewa', 'delsewa', 'listsewa', 'ceksewa'].includes(parsed.command)) {
    await rentalCommands.handle(context, parsed);
    return;
  }

  if (isGroup && !(await canRunGroupCommand({ isGroup, isOwner, groupId: from }))) {
    return;
  }

  if (parsed.command === 'infogrup') {
    await groupCommands.infoGroup(context);
    return;
  }

  if (['list', 'addlist', 'dellist', 'updatelist'].includes(parsed.command)) {
    await catalogueCommands.handle(context, parsed);
    return;
  }

  if (isGroup) {
    await catalogueCommands.productTrigger(context, body);
  }
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
