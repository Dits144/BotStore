const { translateText } = require('../services/lessonService');

module.exports = {
  name: 'translate',
  description: 'Translate sederhana ID/EN',
  async execute({ sock, jid, args }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: 'Format: *.translate <kalimat>*' });
      return;
    }

    const translated = translateText(input);
    await sock.sendMessage(jid, {
      text: `🌐 *Translate*\nInput: ${input}\nOutput: ${translated}`
    });
  }
};
