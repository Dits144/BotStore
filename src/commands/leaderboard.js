const { formatLeaderboard } = require('../services/leaderboardService');

module.exports = {
  name: 'leaderboard',
  aliases: ['top'],
  description: 'Top user grup',
  async execute({ sock, jid }) {
    await sock.sendMessage(jid, { text: formatLeaderboard(10) });
  }
};
