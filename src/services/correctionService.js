const { chatCompletion, getAIReadiness } = require('./aiService');
const { detectLanguage } = require('./translateService');

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fallbackCorrection(text) {
  const lower = String(text || '').toLowerCase().trim();
  if (/^i am go to (.+)$/.test(lower)) {
    const place = lower.replace(/^i am go to /, '');
    return {
      original: text,
      corrected: `I am going to ${place}`,
      natural: `I'm going to ${place}`,
      meaning: 'Saya sedang pergi ke tempat tersebut.',
      note: 'Setelah "am" gunakan verb-ing.'
    };
  }

  return {
    original: text,
    corrected: capitalize(text),
    natural: capitalize(text),
    meaning: 'Arti Indonesia belum tersedia detail pada fallback.',
    note: 'Kalimat terlihat cukup baik.'
  };
}

async function correctWithAI(input) {
  const content = await chatCompletion({
    system: 'Kamu tutor English ringkas. Balas JSON valid saja dengan key: original, corrected, natural, meaning, note',
    user: `Koreksi kalimat ini: ${input}`,
    temperature: 0.2,
    task: 'grammar-correction'
  });

  const parsed = JSON.parse(content);
  return {
    original: parsed.original || input,
    corrected: parsed.corrected || input,
    natural: parsed.natural || parsed.corrected || input,
    meaning: parsed.meaning || '-',
    note: parsed.note || '-'
  };
}

async function correctSentence(input) {
  if (detectLanguage(` ${input} `) === 'id') {
    return {
      original: input,
      corrected: input,
      natural: input,
      meaning: 'Input terdeteksi Bahasa Indonesia. Gunakan .translate untuk menerjemahkan dulu.',
      note: 'Command .fix ideal untuk kalimat berbahasa Inggris.'
    };
  }

  const ai = getAIReadiness();
  if (!ai.ready) {
    console.warn('[AI] correction skipped: service not ready');
    const fallback = fallbackCorrection(input);
    return { ...fallback, note: `${fallback.note} (AI nonaktif)` };
  }

  try {
    return await correctWithAI(input);
  } catch (error) {
    console.error('[correction] AI gagal, fallback:', error.message);
    return fallbackCorrection(input);
  }
}

module.exports = { correctSentence, fallbackCorrection };
