const fs = require('fs');
const path = require('path');
const { parseCommand } = require('../utils/parser');
const { ALLOWED_GROUP_ID } = require('../utils/constants');
const { getUser } = require('../services/userService');
const { correctSentence } = require('../services/correctionService');

const commands = {};
const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, '..', 'commands', file));
  commands[cmd.name] = cmd;
}

function getTextFromMessage(message) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    ''
  );
}

async function handleMessage(sock, msg) {
  try {
    const message = msg.message;
    if (!message) return;

    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const fromMe = msg.key.fromMe;
    if (fromMe) return;

    if (jid !== ALLOWED_GROUP_ID) {
      const text = getTextFromMessage(message);
      const parsed = parseCommand(text);
      if (parsed.isCommand) {
        await sock.sendMessage(jid, { text: 'Bot hanya aktif di grup belajar yang ditentukan.' });
      }
      return;
    }

    const text = getTextFromMessage(message).trim();
    if (!text) return;

    const { isCommand, command, args } = parseCommand(text);

    const user = getUser(sender);

    if (!isCommand && user.chatMode) {
      const correction = correctSentence(text);
      const response = [
        '💬 *Chat Practice*',
        `Correct: ${correction.corrected}${correction.alternative ? ` / ${correction.alternative}` : ''}`,
        `Meaning: ${correction.meaning}`,
        `Note: ${correction.note}`
      ].join('\n');
      await sock.sendMessage(jid, { text: response });
      return;
    }

    if (!isCommand) return;

    const cmd = commands[command];
    if (!cmd) {
      await sock.sendMessage(jid, { text: 'Command tidak dikenali. Gunakan *.menu*' });
      return;
    }

    await cmd.execute({ sock, msg, jid, sender, args, text });
  } catch (error) {
    console.error('messageHandler error:', error);
  }
}

module.exports = {
  handleMessage
};
