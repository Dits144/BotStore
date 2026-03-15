const { formatMyRank } = require('../services/leaderboardService');

module.exports = {
  name: 'rank',
  description: 'Cek peringkat sendiri',
  async execute({ sock, jid, sender }) {
    await sock.sendMessage(jid, { text: formatMyRank(sender) });
  }
};
