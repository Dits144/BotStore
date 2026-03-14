const fs = require('fs');
const path = require('path');

const vocabPath = path.join(process.cwd(), 'data', 'vocab.json');
const grammarPath = path.join(process.cwd(), 'data', 'grammar.json');

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('safeReadJson error:', filePath, error.message);
    return fallback;
  }
}

function randomItem(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomVocab(count = 1) {
  const vocab = safeReadJson(vocabPath, []);
  if (!Array.isArray(vocab) || !vocab.length) return [];

  const clone = [...vocab];
  const picked = [];
  while (picked.length < Math.min(count, clone.length)) {
    const index = Math.floor(Math.random() * clone.length);
    picked.push(clone.splice(index, 1)[0]);
  }
  return picked;
}

function getDailyLesson() {
  const vocab = safeReadJson(vocabPath, []);
  if (!vocab.length) {
    return {
      words: [],
      quiz: 'Data vocabulary belum tersedia.',
      quizAnswer: '-',
      challenge: 'Tambahkan data vocabulary ke data/vocab.json'
    };
  }

  const daySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const words = [];
  for (let i = 0; i < Math.min(5, vocab.length); i += 1) {
    words.push(vocab[(daySeed + i) % vocab.length]);
  }

  const target = words[0] || randomItem(vocab);
  return {
    words,
    quiz: `Apa arti kata "${target.word}"?`,
    quizAnswer: target.meaning,
    challenge: `Buat 1 kalimat pakai kata "${target.word}".`
  };
}

function normalizeTopic(topic = '') {
  return topic.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getGrammarTopic(topic) {
  const grammar = safeReadJson(grammarPath, {});
  const normalized = normalizeTopic(topic);
  if (grammar[normalized]) return grammar[normalized];

  const keys = Object.keys(grammar);
  const looseMatch = keys.find((key) => key.includes(normalized) || normalized.includes(key));
  return looseMatch ? grammar[looseMatch] : null;
}

function getAllGrammarTopics() {
  const grammar = safeReadJson(grammarPath, {});
  return Object.keys(grammar);
}

function translateText(text) {
  const lower = String(text || '').toLowerCase().trim();
  const dict = {
    'apa kabar': 'how are you',
    'halo apa kabar': 'hello, how are you',
    'saya mau belajar bahasa inggris': 'i want to learn english',
    'selamat pagi': 'good morning',
    'i am happy': 'saya senang',
    'i am going to campus': 'saya sedang pergi ke kampus',
    'thank you': 'terima kasih'
  };

  if (dict[lower]) return dict[lower];
  return `Terjemahan lokal belum ditemukan untuk: "${text}"`;
}

function explainMeaning(text) {
  const translation = translateText(text);
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const breakdown = words.map((word, index) => `${index + 1}. ${word}`).join('\n');
  return { translation, breakdown: breakdown || '-' };
}

module.exports = {
  getRandomVocab,
  getDailyLesson,
  getGrammarTopic,
  getAllGrammarTopics,
  translateText,
  explainMeaning,
  safeReadJson
};
