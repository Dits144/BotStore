const fs = require('fs');
const path = require('path');

const vocabPath = path.join(process.cwd(), 'data', 'vocab.json');
const grammarPath = path.join(process.cwd(), 'data', 'grammar.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomVocab(count = 1) {
  const vocab = readJson(vocabPath);
  const clone = [...vocab];
  const picked = [];
  while (picked.length < Math.min(count, clone.length)) {
    const index = Math.floor(Math.random() * clone.length);
    picked.push(clone.splice(index, 1)[0]);
  }
  return picked;
}

function getDailyLesson() {
  const words = getRandomVocab(5);
  const target = randomItem(words);
  return {
    words,
    quiz: `Apa arti kata "${target.word}"?`,
    quizAnswer: target.meaning,
    challenge: `Buat 1 kalimat pakai kata "${target.word}".`
  };
}

function getGrammarTopic(topic) {
  const grammar = readJson(grammarPath);
  return grammar[topic.toLowerCase()] || null;
}

function getAllGrammarTopics() {
  const grammar = readJson(grammarPath);
  return Object.keys(grammar);
}

function translateText(text) {
  const lower = text.toLowerCase();
  const dict = {
    'apa kabar': 'how are you',
    'saya mau belajar bahasa inggris': 'i want to learn english',
    'selamat pagi': 'good morning',
    'i am happy': 'saya senang',
    'i am going to campus': 'saya sedang pergi ke kampus',
    'thank you': 'terima kasih'
  };

  if (dict[lower]) {
    return dict[lower];
  }

  return `Terjemahan sederhana belum ditemukan untuk: "${text}"`;
}

function explainMeaning(text) {
  const translation = translateText(text);
  const words = text.split(/\s+/).filter(Boolean);
  const breakdown = words.map((word, index) => `${index + 1}. ${word}`).join('\n');

  return {
    translation,
    breakdown: breakdown || '-'
  };
}

module.exports = {
  getRandomVocab,
  getDailyLesson,
  getGrammarTopic,
  getAllGrammarTopics,
  translateText,
  explainMeaning
};
