const { parseCommand } = require('../utils/parser');
const { ALLOWED_GROUP_ID } = require('../utils/constants');
const { getUser, incrementPracticeCount } = require('../services/userService');
const { getPracticeReply } = require('../services/chatPracticeService');
const { analyzeVoiceNote } = require('../services/speechService');
const { loadCommands } = require('../services/commandService');
const { getMessageText, isVoiceNote } = require('../utils/message');

const registry = loadCommands();

async function handleMessage(sock, msg, runtime = {}) {
  try {
    const message = msg?.message;
    if (!message) return;

    const jid = msg?.key?.remoteJid;
    const sender = msg?.key?.participant || msg?.key?.remoteJid;
    if (!jid || !sender || msg?.key?.fromMe) return;

    const text = getMessageText(message);
    const parsed = parseCommand(text);

    if (jid !== ALLOWED_GROUP_ID) {
      if (parsed.isCommand) {
        await sock.sendMessage(jid, { text: 'Bot hanya aktif di grup belajar yang ditentukan.' });
      }
      return;
    }

    const user = getUser(sender);

    if (isVoiceNote(message)) {
      if (user.chatMode || parsed.command === 'pronounce') {
        const voice = await analyzeVoiceNote(message);
        await sock.sendMessage(jid, { text: `🎙️ ${voice.message}` });
      }
      return;
    }

    if (!text) {
      console.log('[CHAT_MODE] skipped: empty text');
      return;
    }

    if (!parsed.isCommand && user.chatMode) {
      const now = Date.now();
      if (now - (user.lastPracticeResponseAt || 0) < 7000) {
        console.log('[CHAT_MODE] skipped: cooldown active');
        return;
      }
      console.log(`[CHAT_MODE] processing sender=${sender.split('@')[0]}`);
      const response = await getPracticeReply(text);
      incrementPracticeCount(sender);
      await sock.sendMessage(jid, {
        text: [
          '💬 *ENGLISH PRACTICE* 💬',
          `Correct: ${response.correct}`,
          `Natural: ${response.natural}`,
          `Meaning: ${response.meaning}`,
          `Note: ${response.note}`
        ].join('\n')
      });
      return;
    }

    if (!parsed.isCommand) {
      console.log('[CHAT_MODE] skipped: not enabled for sender');
      return;
    }

    const commandName = registry.aliases[parsed.command] || parsed.command;
    const cmd = registry.commands[commandName];
    if (!cmd) {
      await sock.sendMessage(jid, { text: 'Command tidak dikenali. Gunakan *.menu*' });
      return;
    }

    await cmd.execute({
      sock,
      msg,
      jid,
      sender,
      args: parsed.args,
      text,
      runtime: { ...runtime, rawText: text, parsedCommand: parsed.command, parsedArgs: parsed.args, isAllowedGroup: jid === ALLOWED_GROUP_ID, rawCommand: parsed.command, totalCommands: registry.totalCommands, commands: Object.keys(registry.commands).sort() }
    });
  } catch (error) {
    console.error('messageHandler error:', error.message);
  }
}

function getCommandRegistryInfo() {
  return {
    totalCommands: registry.totalCommands,
    commands: Object.keys(registry.commands).sort()
  };
}

module.exports = { handleMessage, getCommandRegistryInfo };
