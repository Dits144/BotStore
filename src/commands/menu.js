const { commandItem } = require('../utils/formatter');

module.exports = {
  name: 'menu',
  description: 'Menampilkan semua command',
  async execute({ sock, jid }) {
    const lines = [
      '╭───📚 *ENGLISH LEARNING BOT* 📚───',
      '│',
      `├ ${commandItem('daily', '📖 materi harian')}`,
      `├ ${commandItem('quiz', '🧠 quiz bahasa Inggris')}`,
      `├ ${commandItem('answer <jawaban>', '✏️ jawab quiz')}`,
      `├ ${commandItem('tr <teks>', '🌍 translate otomatis')}`,
      `├ ${commandItem('tren <teks>', '🇬🇧 paksa ke English')}`,
      `├ ${commandItem('trid <teks>', '🇮🇩 paksa ke Indonesia')}`,
      `├ ${commandItem('arti <teks>', '🔎 arti kata/kalimat')}`,
      `├ ${commandItem('grammar <topik>', '📘 belajar grammar')}`,
      `├ ${commandItem('vocab', '📝 vocab random')}`,
      `├ ${commandItem('chat on/off', '💬 latihan AI')}`,
      `├ ${commandItem('fix / correct <kalimat>', '✅ koreksi grammar')}`,
      `├ ${commandItem('pronounce <teks>', '🗣️ bantuan pengucapan')}`,
      `├ ${commandItem('leaderboard / top', '🏆 ranking grup')}`,
      `├ ${commandItem('rank', '🎯 rank kamu')}`,
      `├ ${commandItem('score', '🎯 skor belajar')}`,
      `├ ${commandItem('streak', '🔥 streak belajar')}`,
      `├ ${commandItem('resetprogress', '♻️ reset progres')}`,
      `├ ${commandItem('claimowner <password>', '👑 klaim owner')}`,
      `├ ${commandItem('reminder on/off/status', '⚙️ kontrol reminder')}`,
      `├ ${commandItem('health', '🩺 status bot (owner)')}`,
      `├ ${commandItem('debugcmd', '🛠️ debug parser (owner)')}`,
      '│',
      '╰────────────────────────'
    ];

    await sock.sendMessage(jid, { text: lines.join('\n') });
  }
};
