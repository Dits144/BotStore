const { toTitle, bulletList, commandItem } = require('../utils/formatter');

module.exports = {
  name: 'menu',
  description: 'Menampilkan semua command',
  async execute({ sock, jid }) {
    const items = [
      commandItem('menu', 'Lihat daftar command'),
      commandItem('daily', 'Materi belajar harian'),
      commandItem('quiz', 'Ambil quiz random'),
      commandItem('answer <jawaban>', 'Jawab quiz aktif'),
      commandItem('translate/.tr <kalimat>', 'Terjemahkan AI ID/EN'),
      commandItem('fix/.correct <kalimat>', 'Koreksi grammar AI'),
      commandItem('arti <kata/kalimat>', 'Jelaskan arti + breakdown sederhana'),
      commandItem('grammar <topik>', 'Materi grammar'),
      commandItem('vocab', 'Vocab random'),
      commandItem('pronounce <teks>', 'Panduan pengucapan'),
      commandItem('chat on|off', 'Aktif/nonaktif chat practice'),
      commandItem('leaderboard/.top', 'Top 10 learner'),
      commandItem('rank', 'Peringkat kamu'),
      commandItem('reminder on|off|status', 'Kontrol reminder (owner)'),
      commandItem('health', 'Health check (owner)'),
      commandItem('debugcmd', 'Debug command registry (owner)'),
      commandItem('score', 'Lihat score, xp, level'),
      commandItem('streak', 'Lihat streak belajar'),
      commandItem('resetprogress', 'Reset progress akunmu')
    ];

    const text = `${toTitle('English Learning Bot Menu')}\n\n${bulletList(items)}`;
    await sock.sendMessage(jid, { text });
  }
};
