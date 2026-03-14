const path = require('path');
const fs = require('fs');
const { DATA_DIR } = require('../utils/constants');

const vocabPath = path.resolve(DATA_DIR, 'vocab.json');
const grammarPath = path.resolve(DATA_DIR, 'grammar.json');

const FALLBACK_VOCAB = [
  { word: 'confident', meaning: 'percaya diri', example: 'I want to speak English more confidently.' },
  { word: 'improve', meaning: 'meningkatkan', example: 'I improve my English every day.' },
  { word: 'habit', meaning: 'kebiasaan', example: 'Reading is a good habit for learners.' },
  { word: 'schedule', meaning: 'jadwal', example: 'I follow a study schedule every morning.' },
  { word: 'mistake', meaning: 'kesalahan', example: 'Making mistakes is part of learning.' }
];

const LOCAL_DICT = {
  'apa kabar': 'how are you',
  'halo apa kabar': 'hello, how are you',
  'saya mau belajar bahasa inggris': 'i want to learn english',
  'selamat pagi': 'good morning',
  'terima kasih': 'thank you',
  'sampai jumpa': 'see you later',
  'i am happy': 'saya senang',
  'i am going to campus': 'saya sedang pergi ke kampus',
  'thank you': 'terima kasih',
  'how are you': 'apa kabar',
  'good morning': 'selamat pagi'
};

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error('[data-loader] failed to read JSON:', filePath, error.message);
    return fallback;
  }
}

function loadArray(filePath, { validator, fallback }) {
  const parsed = safeReadJson(filePath, fallback);
  if (!Array.isArray(parsed) || !parsed.length) return fallback;
  const filtered = parsed.filter(validator);
  return filtered.length ? filtered : fallback;
}

function randomItem(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadVocabulary() {
  return loadArray(vocabPath, {
    fallback: FALLBACK_VOCAB,
    validator: (item) => item && item.word && item.meaning && item.example
  });
}

function getRandomVocab(count = 1) {
  const vocab = loadVocabulary();
  const clone = [...vocab];
  const picked = [];
  while (picked.length < Math.min(count, clone.length)) {
    const index = Math.floor(Math.random() * clone.length);
    picked.push(clone.splice(index, 1)[0]);
  }
  return picked;
}

function getDailyLesson() {
  const vocab = loadVocabulary();
  const limit = Math.max(3, Math.min(5, vocab.length));
  const daySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const words = [];
  for (let i = 0; i < limit; i += 1) {
    words.push(vocab[(daySeed + i) % vocab.length]);
  }

  const quizWord = words[0] || randomItem(vocab);
  const challengeWord = words[1] || words[0] || randomItem(vocab);

  return {
    words,
    quiz: `Apa arti dari kata "${quizWord.word}"?`,
    quizAnswer: quizWord.meaning,
    challenge: `Buat 1 kalimat pakai kata "${challengeWord.word}".`
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
  if (LOCAL_DICT[lower]) return LOCAL_DICT[lower];

  const reverse = Object.entries(LOCAL_DICT).find(([, value]) => value === lower);
  if (reverse) return reverse[0];

  return `Terjemahan lokal belum ditemukan untuk: "${text}"`;
}

function explainMeaning(text) {
  const translation = translateText(text);
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const breakdown = words.map((word, index) => `${index + 1}. ${word}`).join('\n');
  return { translation, breakdown: breakdown || '-' };
}

function getDataStats() {
  return {
    vocabCount: loadVocabulary().length,
    grammarTopicCount: getAllGrammarTopics().length
  };
}

module.exports = {
  getRandomVocab,
  getDailyLesson,
  getGrammarTopic,
  getAllGrammarTopics,
  translateText,
  explainMeaning,
  safeReadJson,
  loadArray,
  loadVocabulary,
  getDataStats,
  LOCAL_DICT
};
