const { getUser } = require('../services/userService');

module.exports = {
  name: 'score',
  description: 'Lihat score user',
  async execute({ sock, jid, sender }) {
    const user = getUser(sender);
    await sock.sendMessage(jid, {
      text: `🏆 *Progress Kamu*\nScore: ${user.score}\nXP: ${user.xp}\nLevel: ${user.level}\nTotal Benar: ${user.totalCorrect}`
    });
  }
};
