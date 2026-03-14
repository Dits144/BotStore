const { chatCompletion, isAIEnabled } = require('./aiService');
const { translateText } = require('./lessonService');

function detectLanguage(text) {
  const idHints = ['yang', 'dan', 'saya', 'kamu', 'belajar', 'apa', 'di', 'ke', 'terima', 'selamat'];
  const enHints = ['the', 'is', 'are', 'am', 'to', 'i', 'you', 'we', 'thank', 'good'];
  const lower = ` ${String(text || '').toLowerCase()} `;
  const idScore = idHints.reduce((n, w) => n + (lower.includes(` ${w} `) ? 1 : 0), 0);
  const enScore = enHints.reduce((n, w) => n + (lower.includes(` ${w} `) ? 1 : 0), 0);
  return idScore >= enScore ? 'id' : 'en';
}

async function translateWithAI(input, forceTarget = null) {
  const src = detectLanguage(input);
  const targetLang = forceTarget || (src === 'id' ? 'en' : 'id');
  const targetLabel = targetLang === 'en' ? 'English' : 'Bahasa Indonesia';

  const content = await chatCompletion({
    system: 'Kamu penerjemah ringkas. Balas JSON valid: {"translation":"...","natural":"..."}',
    user: `Terjemahkan ke ${targetLabel}: ${input}`,
    temperature: 0.2
  });

  try {
    const parsed = JSON.parse(content);
    return {
      original: input,
      targetLang,
      translation: parsed.translation || translateText(input),
      natural: parsed.natural || ''
    };
  } catch (_) {
    return { original: input, targetLang, translation: content || translateText(input), natural: '' };
  }
}

async function translateSmart(input, options = {}) {
  const forceTarget = options.forceTarget || null;

  if (!isAIEnabled()) {
    return {
      original: input,
      targetLang: forceTarget || (detectLanguage(input) === 'id' ? 'en' : 'id'),
      translation: translateText(input),
      natural: '',
      fallback: true,
      note: 'AI nonaktif, menggunakan terjemahan lokal dua arah.'
    };
  }

  try {
    return await translateWithAI(input, forceTarget);
  } catch (error) {
    console.error('[translate] AI gagal:', error.message);
    return {
      original: input,
      targetLang: forceTarget || (detectLanguage(input) === 'id' ? 'en' : 'id'),
      translation: translateText(input),
      natural: '',
      fallback: true,
      note: 'AI gagal sementara, fallback lokal aktif.'
    };
  }
}

module.exports = { detectLanguage, translateSmart };
