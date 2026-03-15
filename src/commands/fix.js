const { correctSentence } = require('../services/correctionService');

module.exports = {
  name: 'fix',
  aliases: ['correct'],
  description: 'Koreksi grammar AI',
  async execute({ sock, jid, args }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: '✏️ Contoh: *.fix I am go to school*' });
      return;
    }

    const r = await correctSentence(input);
    const text = [
      '✏️ *GRAMMAR CHECK* ✏️',
      `📝 Original: ${r.original}`,
      `✅ Corrected: ${r.corrected}`,
      `✨ Natural: ${r.natural}`,
      `🇮🇩 Meaning: ${r.meaning}`,
      `📘 Note: ${r.note}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
