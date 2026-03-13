const { getRandomVocab } = require('../services/lessonService');

module.exports = {
  name: 'vocab',
  description: 'Vocab random',
  async execute({ sock, jid }) {
    const [item] = getRandomVocab(1);
    await sock.sendMessage(jid, {
      text: `🗂️ *Vocabulary Random*\nWord: ${item.word}\nArti: ${item.meaning}\nExample: ${item.example}`
    });
  }
};
