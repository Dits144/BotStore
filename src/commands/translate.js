const { translateSmart } = require('../services/translateService');

module.exports = {
  name: 'translate',
  aliases: ['tr', 'tren', 'trid'],
  description: 'Translate otomatis atau paksa bahasa',
  async execute({ sock, jid, args, runtime }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: '🌍 Format: *.tr <kalimat>* | *.tren <kalimat>* | *.trid <kalimat>*' });
      return;
    }

    const mode = runtime?.rawCommand;
    const forceTarget = mode === 'tren' ? 'en' : mode === 'trid' ? 'id' : null;
    const result = await translateSmart(input, { forceTarget });

    const text = [
      '🌍 *TRANSLATE RESULT* 🌍',
      `📝 Original: ${result.original}`,
      `✨ Translation: ${result.translation}`,
      result.natural ? `💬 Natural: ${result.natural}` : null,
      result.fallback ? '⚠️ Menggunakan fallback lokal.' : null,
      result.note ? `ℹ️ ${result.note}` : null
    ].filter(Boolean).join('\n');

    await sock.sendMessage(jid, { text });
  }
};
