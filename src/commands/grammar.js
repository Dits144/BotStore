const { getGrammarTopic, getAllGrammarTopics } = require('../services/lessonService');

module.exports = {
  name: 'grammar',
  description: 'Materi grammar berdasarkan topik',
  async execute({ sock, jid, args }) {
    const topic = args.join(' ').trim().toLowerCase();
    const topics = getAllGrammarTopics();

    if (!topic) {
      await sock.sendMessage(jid, {
        text: `📘 Format: *.grammar <topik>*\n🧩 Topik tersedia: ${topics.join(', ')}`
      });
      return;
    }

    const data = getGrammarTopic(topic);
    if (!data) {
      await sock.sendMessage(jid, {
        text: `⚠️ Topik tidak ditemukan.\n🧩 Topik tersedia: ${topics.join(', ')}`
      });
      return;
    }

    const examples = Array.isArray(data.examples) ? data.examples.join(' | ') : (data.example || '-');
    const exercises = (data.exercises || []).map((x, i) => `${i + 1}. ${x}`).join('\n') || '-';
    const text = [
      `📘 *Grammar: ${data.title || topic}*`,
      `🧠 Pattern: ${data.pattern || data.formula || '-'}`,
      `🕒 Usage: ${data.usage || '-'}`,
      `💬 Examples: ${examples}`,
      '',
      '✏️ Latihan:',
      exercises
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
