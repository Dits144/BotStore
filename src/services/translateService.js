const { chatCompletion, getAIReadiness } = require('./aiService');
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
    system: 'You are a translation assistant. Detect the language automatically and translate.',
    user: `${input}\n\nTarget language: ${targetLabel}. Return concise JSON: {"translation":"...","natural":"..."}`,
    temperature: 0.2,
    task: 'translate'
  });

  try {
    const parsed = JSON.parse(content);
    return {
      original: input,
      targetLang,
      translation: parsed.translation || translateText(input),
      natural: parsed.natural || ''
    };
  } catch {
    return {
      original: input,
      targetLang,
      translation: content || translateText(input),
      natural: ''
    };
  }
}

async function translateSmart(input, options = {}) {
  const forceTarget = options.forceTarget || null;
  const ai = getAIReadiness();

  console.log('[AI] translate invoked');

  if (!ai.ready) {
    console.warn('[AI] translate skipped: service not ready');
    return {
      original: input,
      targetLang: forceTarget || (detectLanguage(input) === 'id' ? 'en' : 'id'),
      translation: translateText(input),
      natural: '',
      fallback: true,
      note: 'AI nonaktif, menggunakan fallback lokal.'
    };
  }

  try {
    return await translateWithAI(input, forceTarget);
  } catch (error) {
    console.error('[AI] request failed:', error.message);
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
