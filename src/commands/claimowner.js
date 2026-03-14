const { claimOwner, hasOwner } = require('../services/ownerService');

const OWNER_CLAIM_PASSWORD = 'botengress144';

module.exports = {
  name: 'claimowner',
  description: 'Klaim owner bot',
  async execute({ sock, jid, sender, args }) {
    if (hasOwner()) {
      await sock.sendMessage(jid, {
        text: '⚠️ Bot ini sudah memiliki owner dari konfigurasi.\nJika ingin memakai .claimowner, kosongkan OWNER_NUMBER di file .env lalu restart bot.'
      });
      return;
    }

    const password = args.join(' ').trim();
    if (password !== OWNER_CLAIM_PASSWORD) {
      await sock.sendMessage(jid, {
        text: '❌ Password salah!\n\nGunakan format:\n.claimowner <password>'
      });
      return;
    }

    const result = claimOwner(sender);
    if (!result.ok) {
      await sock.sendMessage(jid, { text: '⚠️ Klaim owner gagal, coba lagi.' });
      return;
    }

    await sock.sendMessage(jid, {
      text: [
        '👑 *OWNER CLAIMED* 👑',
        '',
        'Selamat! Kamu sekarang adalah owner bot ini 🎉',
        '',
        '⚙️ Command admin yang bisa dipakai:',
        '🔧 .reminder on',
        '🔧 .reminder off',
        '🔧 .reminder status',
        '🔧 .health',
        '🔧 .debugcmd',
        '',
        'Gunakan dengan bijak ya 😎'
      ].join('\n')
    });
  }
};
