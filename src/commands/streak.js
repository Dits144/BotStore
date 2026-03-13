const { getUser } = require('../services/userService');

module.exports = {
  name: 'streak',
  description: 'Lihat streak belajar',
  async execute({ sock, jid, sender }) {
    const user = getUser(sender);
    await sock.sendMessage(jid, {
      text: `🔥 *Streak Belajar*\nStreak saat ini: ${user.streak} hari\nTerakhir aktif: ${user.lastActiveDate || '-'}`
    });
  }
};
