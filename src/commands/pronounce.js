const { getPronunciationGuide } = require('../services/pronunciationService');
const { incrementPronunciationRequests } = require('../services/userService');

module.exports = {
  name: 'pronounce',
  description: 'Helper pengucapan teks',
  async execute({ sock, jid, sender, args }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: 'Format: *.pronounce <kata/kalimat>*' });
      return;
    }

    incrementPronunciationRequests(sender);
    const guides = getPronunciationGuide(input);
    const lines = guides.map((x) => `${x.word} → ${x.pronounce}`);
    await sock.sendMessage(jid, { text: `🔊 *Pronunciation Helper*\n${lines.join('\n')}` });
  }
};
