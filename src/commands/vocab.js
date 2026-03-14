const { getRandomVocab } = require('../services/lessonService');

module.exports = {
  name: 'vocab',
  description: 'Vocab random',
  async execute({ sock, jid }) {
    const [item] = getRandomVocab(1);
    if (!item) {
      await sock.sendMessage(jid, { text: 'Data vocabulary kosong. Tambahkan data di data/vocab.json.' });
      return;
    }

    await sock.sendMessage(jid, {
      text: `🗂️ *Vocabulary Random*\nWord: ${item.word}\nArti: ${item.meaning}\nExample: ${item.example || '-'}`
    });
  }
};
