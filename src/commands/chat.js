const { updateUser } = require('../services/userService');

module.exports = {
  name: 'chat',
  description: 'Aktif/nonaktif chat practice',
  async execute({ sock, jid, sender, args }) {
    const mode = (args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(mode)) {
      await sock.sendMessage(jid, { text: 'Format: *.chat on* atau *.chat off*' });
      return;
    }

    const chatMode = mode === 'on';
    updateUser(sender, (user) => ({ ...user, chatMode }));
    await sock.sendMessage(jid, {
      text: chatMode
        ? '🟢 Chat practice aktif untuk kamu.'
        : '🔴 Chat practice nonaktif untuk kamu.'
    });
  }
};
