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
      commandItem('translate <kalimat>', 'Terjemahkan kalimat ID/EN'),
      commandItem('arti <kata/kalimat>', 'Jelaskan arti + breakdown sederhana'),
      commandItem('grammar <topik>', 'Materi grammar (present simple, dll)'),
      commandItem('vocab', 'Vocab random'),
      commandItem('chat on|off', 'Aktif/nonaktif chat practice'),
      commandItem('score', 'Lihat score, xp, level'),
      commandItem('streak', 'Lihat streak belajar'),
      commandItem('resetprogress', 'Reset progress akunmu')
    ];

    const text = `${toTitle('English Learning Bot Menu')}\n\n${bulletList(items)}`;
    await sock.sendMessage(jid, { text });
  }
};
