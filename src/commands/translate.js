const { translateSmart } = require('../services/translateService');

module.exports = {
  name: 'translate',
  aliases: ['tr'],
  description: 'Translate AI ID/EN',
  async execute({ sock, jid, args }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: 'Format: *.translate <kalimat>* atau *.tr <kalimat>*' });
      return;
    }

    const result = await translateSmart(input);
    const text = [
      '🌐 *Translate*',
      `Original: ${result.original}`,
      `Translation: ${result.translation}`,
      result.natural ? `Natural: ${result.natural}` : null,
      result.fallback ? `_AI fallback ke lokal_` : null,
      result.note ? `Note: ${result.note}` : null
    ].filter(Boolean).join('\n');

    await sock.sendMessage(jid, { text });
  }
};
