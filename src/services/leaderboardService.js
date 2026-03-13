const { getLeaderboard, getRank, getUser } = require('./userService');

function shortJid(jid = '') {
  return jid.split('@')[0];
}

function formatLeaderboard(limit = 10) {
  const users = getLeaderboard(limit);
  if (!users.length) return 'Belum ada data leaderboard.';

  const lines = users.map((u, i) => `${i + 1}. ${shortJid(u.userId)} | XP ${u.xp} | Score ${u.score} | Streak ${u.streak}`);
  return `🏅 *Leaderboard Top ${Math.min(limit, users.length)}*\n${lines.join('\n')}`;
}

function formatMyRank(userId) {
  const me = getUser(userId);
  const rank = getRank(userId);
  return `📊 *Peringkat Kamu*\nRank: #${rank.rank}/${rank.total}\nXP: ${me.xp}\nScore: ${me.score}\nStreak: ${me.streak}`;
}

module.exports = { formatLeaderboard, formatMyRank };
