const logger = require('../config/logger');
const { parseCommand, normalizeText } = require('../utils/parser');
const { canRunGroupCommand } = require('../middlewares/rentalGuard');
const { isBotOwner } = require('../services/roleService');
const { getSenderJid } = require('../utils/jid');
const ownerCommands = require('../commands/owner');
const rentalCommands = require('../commands/rental');
const groupCommands = require('../commands/group');
const catalogueCommands = require('../commands/catalogue');
const config = require('../config/env');

async function routeMessage(sock, msg) {
  const body = extractMessageText(msg);
  if (!body) return;

  const remoteJid = String(msg.key?.remoteJid || '').trim();
  const participant = String(msg.key?.participant || '').trim();
  const sender = getSenderJid(msg);
  const isGroup = remoteJid.endsWith('@g.us');
  const isOwner = await isBotOwner(sender);

  logger.debug({ remoteJid, participant, senderNormalized: sender, isGroup }, 'incoming message context');

  const context = {
    sock,
    msg,
    body,
    from: remoteJid,
    sender,
    isGroup,
    isOwner,
    send: async (text, options = {}) => sock.sendMessage(remoteJid, { text, ...options }, { quoted: msg })
  };

  const isClaimOwnerText = normalizeText(body) === normalizeText(config.ownerClaimCode);
  if (isClaimOwnerText) {
    if (isGroup) {
      await context.send('❌ Claim Owner hanya bisa dilakukan di chat pribadi bot.');
      return;
    }

    await ownerCommands.claimOwner(context);
    return;
  }

  const parsed = parseCommand(body);
  if (!parsed.command) return;

  if (['owner', 'delowner', 'listowner', 'cekrole', 'myrole'].includes(parsed.command)) {
    await ownerCommands.handle(context, parsed);
    return;
  }

  if (['addsewa', 'renewsewa', 'delsewa', 'listsewa', 'ceksewa'].includes(parsed.command)) {
    await rentalCommands.handle(context, parsed);
    return;
  }

  if (['info', 'infogrup'].includes(parsed.command)) {
    await groupCommands.info(context);
    return;
  }

  if (isGroup && !(await canRunGroupCommand({ isGroup, isOwner, groupId: remoteJid }))) {
    logger.debug({ command: parsed.command, groupId: remoteJid, sender }, 'command ditolak karena sewa grup tidak aktif');
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
