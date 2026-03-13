const { getGrammarTopic, getAllGrammarTopics } = require('../services/lessonService');

module.exports = {
  name: 'grammar',
  description: 'Materi grammar berdasarkan topik',
  async execute({ sock, jid, args }) {
    const topic = args.join(' ').trim().toLowerCase();
    if (!topic) {
      await sock.sendMessage(jid, {
        text: `Format: *.grammar <topik>*\nTopik tersedia: ${getAllGrammarTopics().join(', ')}`
      });
      return;
    }

    const data = getGrammarTopic(topic);
    if (!data) {
      await sock.sendMessage(jid, {
        text: `Topik tidak ditemukan. Topik tersedia: ${getAllGrammarTopics().join(', ')}`
      });
      return;
    }

    const exercises = data.exercises.map((x, i) => `${i + 1}. ${x}`).join('\n');
    const text = [
      `📚 *Grammar: ${data.title}*`,
      `Rumus: ${data.formula}`,
      `Dipakai saat: ${data.usage}`,
      `Contoh: ${data.example}`,
      '',
      'Latihan singkat:',
      exercises
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
