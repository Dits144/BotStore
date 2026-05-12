async function allmenu(ctx) {
  await ctx.send(
    `┏━━〔 📚 ALL MENU 〕━━┓\n` +
    `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
    `╭──〔 👑 OWNER MENU 〕──╮\n` +
    `┃ • addsewa\n┃ • renewsewa\n┃ • delsewa\n┃ • listsewa\n┃ • ceksewa\n┃ • owner\n┃ • delowner\n┃ • listowner\n╰────────────────────╯\n\n` +
    `╭──〔 🛠 ADMIN MENU 〕──╮\n` +
    `┃ • addlist\n┃ • updatelist\n┃ • dellist\n┃ • welcome on\n┃ • welcome off\n┃ • setwelcome\n┃ • h\n┃ • p\n┃ • d\n┃ • r\n┃ • b\n┃ • group close\n┃ • group open\n╰────────────────────╯\n\n` +
    `╭──〔 📦 USER MENU 〕──╮\n` +
    `┃ • list\n┃ • info\n┃ • myrole\n┃ • allmenu\n┃ • ketik nama produk\n╰────────────────────╯`
  );
}

module.exports = { allmenu };
