const { detectLanguage, translateSmart } = require('./translateService');
const { correctSentence } = require('./correctionService');

async function getPracticeReply(text) {
  console.log('[AI] chat tutor invoked');

  const lang = detectLanguage(` ${text} `);
  if (lang === 'id') {
    const tr = await translateSmart(text);
    return {
      mode: 'translate',
      correct: tr.translation,
      natural: tr.natural || tr.translation,
      meaning: text,
      note: tr.fallback ? 'Fallback lokal aktif untuk chat mode.' : 'Terjemahan AI berhasil.'
    };
  }

  const fix = await correctSentence(text);
  return {
    mode: 'correct',
    correct: fix.corrected,
    natural: fix.natural,
    meaning: fix.meaning,
    note: fix.note
  };
}

module.exports = { getPracticeReply };
