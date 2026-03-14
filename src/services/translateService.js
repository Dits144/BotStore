const { chatCompletion, isAIEnabled } = require('./aiService');
const { translateText } = require('./lessonService');

function detectLanguage(text) {
  const idHints = ['yang', 'dan', 'saya', 'kamu', 'belajar', 'apa', 'di', 'ke'];
  const enHints = ['the', 'is', 'are', 'am', 'to', 'i', 'you', 'we'];
  const lower = String(text || '').toLowerCase();
  const idScore = idHints.reduce((n, w) => n + (lower.includes(` ${w} `) || lower.startsWith(`${w} `) ? 1 : 0), 0);
  const enScore = enHints.reduce((n, w) => n + (lower.includes(` ${w} `) || lower.startsWith(`${w} `) ? 1 : 0), 0);
  return idScore >= enScore ? 'id' : 'en';
}

async function translateWithAI(input) {
  const src = detectLanguage(` ${input} `);
  const target = src === 'id' ? 'English' : 'Bahasa Indonesia';
  const content = await chatCompletion({
    system: 'Kamu penerjemah ringkas. Balas JSON valid saja: {"translation":"...","natural":"..."}',
    user: `Terjemahkan ke ${target}: ${input}`,
    temperature: 0.2
  });

  try {
    const parsed = JSON.parse(content);
    return {
      original: input,
      translation: parsed.translation || translateText(input),
      natural: parsed.natural || ''
    };
  } catch (_) {
    return { original: input, translation: content || translateText(input), natural: '' };
  }
}

async function translateSmart(input) {
  if (!isAIEnabled()) {
    return {
      original: input,
      translation: translateText(input),
      natural: '',
      fallback: true,
      note: 'AI nonaktif (AI_API_KEY belum di-set), menggunakan terjemahan lokal.'
    };
  }

  try {
    return await translateWithAI(input);
  } catch (error) {
    console.error('translateSmart error:', error.message);
    return {
      original: input,
      translation: translateText(input),
      natural: '',
      fallback: true,
      note: 'AI sedang gagal, menggunakan fallback lokal.'
    };
  }
}

module.exports = { detectLanguage, translateSmart };
