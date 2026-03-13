const fs = require('fs');
const path = require('path');
const { parseCommand } = require('../utils/parser');
const { ALLOWED_GROUP_ID } = require('../utils/constants');
const { getUser, incrementPracticeCount } = require('../services/userService');
const { getPracticeReply } = require('../services/chatPracticeService');
const { analyzeVoiceNote } = require('../services/speechService');

const commands = {};
const aliases = {};
const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, '..', 'commands', file));
  commands[cmd.name] = cmd;
  (cmd.aliases || []).forEach((alias) => {
    aliases[alias] = cmd.name;
  });
}

function getTextFromMessage(message) {
  return message?.conversation || message?.extendedTextMessage?.text || message?.imageMessage?.caption || message?.videoMessage?.caption || '';
}

function isVoiceNote(message) {
  return Boolean(message?.audioMessage?.ptt || message?.audioMessage);
}

async function handleMessage(sock, msg) {
  try {
    const message = msg.message;
    if (!message) return;

    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    if (msg.key.fromMe) return;

    const text = getTextFromMessage(message).trim();
    const parsed = parseCommand(text);

    if (jid !== ALLOWED_GROUP_ID) {
      if (parsed.isCommand) await sock.sendMessage(jid, { text: 'Bot hanya aktif di grup belajar yang ditentukan.' });
      return;
    }

    const user = getUser(sender);

    if (isVoiceNote(message)) {
      if (user.chatMode) {
        const voice = await analyzeVoiceNote();
        await sock.sendMessage(jid, { text: `🎙️ ${voice.message}` });
      }
      return;
    }

    if (!text) return;

    if (!parsed.isCommand && user.chatMode) {
      const now = Date.now();
      if (now - (user.lastPracticeResponseAt || 0) < 7000) return;
      const r = await getPracticeReply(text);
      incrementPracticeCount(sender);
      await sock.sendMessage(jid, {
        text: ['💬 *Chat Practice*', `Correct: ${r.correct}`, `Natural: ${r.natural}`, `Meaning: ${r.meaning}`, `Note: ${r.note}`].join('\n')
      });
      return;
    }

    if (!parsed.isCommand) return;

    const commandName = aliases[parsed.command] || parsed.command;
    const cmd = commands[commandName];
    if (!cmd) {
      await sock.sendMessage(jid, { text: 'Command tidak dikenali. Gunakan *.menu*' });
      return;
    }

    await cmd.execute({ sock, msg, jid, sender, args: parsed.args, text });
  } catch (error) {
    console.error('messageHandler error:', error);
  }
}

module.exports = { handleMessage };
