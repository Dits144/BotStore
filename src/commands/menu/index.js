const { getUserRole } = require('../../services/roleService');

async function allmenu(ctx) {
  const role = await getUserRole({
    sock: ctx.sock,
    groupId: ctx.from,
    senderJid: ctx.sender,
    isGroup: ctx.isGroup
  });

  const roleLabel = role === 'bot_owner' ? 'Owner Bot' : role === 'group_admin' ? 'Admin Grup' : 'User';

  let ownerMenu = '';
  let adminMenu = '';

  if (role === 'bot_owner') {
    ownerMenu =
      `\n╭──〔 👑 OWNER MENU 〕──╮\n` +
      `┃ • addsewa\n┃ • renewsewa\n┃ • delsewa\n┃ • listsewa\n┃ • ceksewa\n┃ • owner\n┃ • delowner\n┃ • listowner\n╰────────────────────╯\n`;
  }

  if (role === 'bot_owner' || role === 'group_admin') {
    adminMenu =
      `\n╭──〔 🛠 ADMIN MENU 〕──╮\n` +
      `┃ • addlist\n┃ • updatelist\n┃ • dellist\n┃ • welcome on/off\n┃ • setwelcome\n┃ • h (pesan)\n┃ • p / d / r / b (reply transaksi)\n╰────────────────────╯\n`;
  }

  await ctx.send(
    `┏━━〔 📚 ALL MENU 〕━━┓\n` +
    `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
    `👤 Role Kamu : ${roleLabel}\n` +
    `${ownerMenu}` +
    `${adminMenu}` +
    `\n╭──〔 📦 USER MENU 〕──╮\n` +
    `┃ • list\n┃ • info\n┃ • allmenu\n┃ • myrole\n┃ • ketik nama produk untuk lihat detail\n╰────────────────────╯`
  );
}

module.exports = { allmenu };
