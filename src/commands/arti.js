const { explainMeaning } = require('../services/lessonService');

module.exports = {
  name: 'arti',
  description: 'Jelaskan arti kata/kalimat',
  async execute({ sock, jid, args }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: 'Format: *.arti <kata/kalimat>*' });
      return;
    }

    const result = explainMeaning(input);
    await sock.sendMessage(jid, {
      text: `🧠 *Arti & Breakdown*\nInput: ${input}\nArti: ${result.translation}\n\nBreakdown:\n${result.breakdown}`
    });
  }
};
