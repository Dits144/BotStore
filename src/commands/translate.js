const { translateSmart } = require('../services/translateService');

module.exports = {
  name: 'translate',
  aliases: ['tr', 'tren', 'trid'],
  description: 'Translate otomatis atau paksa bahasa',
  async execute({ sock, jid, args, runtime }) {
    const input = args.join(' ').trim();
    if (!input) {
      await sock.sendMessage(jid, { text: '🌍 Contoh: *.tr halo apa kabar* | *.tren saya ingin belajar* | *.trid I want to learn English*' });
      return;
    }

    const mode = runtime?.rawCommand;
    const forceTarget = mode === 'tren' ? 'en' : mode === 'trid' ? 'id' : null;
    const result = await translateSmart(input, { forceTarget });
    const targetMark = (forceTarget || result.targetLang) === 'en' ? '🇬🇧' : '🇮🇩';

    const text = [
      '🌍 *TRANSLATE RESULT* 🌍',
      `📝 Original: ${result.original}`,
      `${targetMark} Translation: ${result.translation}`,
      result.natural ? `✨ Natural: ${result.natural}` : null,
      result.fallback ? '⚠️ Menggunakan fallback lokal.' : null,
      result.note ? `ℹ️ ${result.note}` : null
    ].filter(Boolean).join('\n');

    await sock.sendMessage(jid, { text });
  }
};
