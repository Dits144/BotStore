const { resetProgress } = require('../services/userService');

module.exports = {
  name: 'resetprogress',
  description: 'Reset progress user',
  async execute({ sock, jid, sender }) {
    resetProgress(sender);
    await sock.sendMessage(jid, { text: '♻️ Progress kamu berhasil di-reset.' });
  }
};
