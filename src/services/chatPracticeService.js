const { detectLanguage, translateSmart } = require('./translateService');
const { correctSentence } = require('./correctionService');

async function getPracticeReply(text) {
  const lang = detectLanguage(` ${text} `);
  if (lang === 'id') {
    const tr = await translateSmart(text);
    return {
      mode: 'translate',
      correct: tr.translation,
      natural: tr.natural || tr.translation,
      meaning: text,
      note: 'Input Indonesia diterjemahkan ke English.'
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
