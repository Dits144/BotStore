const { commandItem } = require('../utils/formatter');

module.exports = {
  name: 'menu',
  description: 'Menampilkan semua command',
  async execute({ sock, jid }) {
    const lines = [
      '╭───📚 *ENGLISH LEARNING BOT* 📚───',
      '│',
      `├ ${commandItem('daily', '📖 materi English harian')}`,
      `├ ${commandItem('quiz', '🧠 quiz bahasa Inggris')}`,
      `├ ${commandItem('answer <jawaban>', '✏️ jawab quiz')}`,
      `├ ${commandItem('tr / tren / trid', '🌍 translate otomatis/manual')}`,
      `├ ${commandItem('arti <teks>', '🔎 arti kata/kalimat')}`,
      `├ ${commandItem('grammar <topik>', '📘 belajar grammar')}`,
      `├ ${commandItem('chat on/off', '💬 latihan chat')}`,
      `├ ${commandItem('leaderboard / top', '🏆 ranking grup')}`,
      `├ ${commandItem('score', '🎯 skor belajar')}`,
      `├ ${commandItem('streak', '🔥 streak belajar')}`,
      `├ ${commandItem('claimowner <password>', '👑 klaim owner bot')}`,
      '│',
      '╰──────────────────'
    ];

    await sock.sendMessage(jid, { text: lines.join('\n') });
  }
};
