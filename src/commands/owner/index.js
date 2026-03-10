const ownerRepository = require('../../repositories/ownerRepository');
const config = require('../../config/env');
const { formatWrongExample } = require('../../utils/messageFormatter');

async function claimOwner(ctx) {
  if (ctx.isGroup) return;

  if (ownerRepository.isOwner(ctx.sender)) {
    await ctx.send('✅ Kamu sudah terdaftar sebagai owner bot.');
    return;
  }

  ownerRepository.addOwner(ctx.sender, 0);
  await ctx.send('🎉 Claim owner berhasil!\nSekarang kamu terdaftar sebagai owner tambahan bot.');
}

async function handle(ctx, parsed) {
  if (!ctx.isOwner) {
    await ctx.send('❌ Command ini khusus owner bot.');
    return;
  }

  if (parsed.command === 'owner') {
    if (parsed.args.length !== 1) {
      await ctx.send(formatWrongExample('owner 62xxxx@s.whatsapp.net'));
      return;
    }
    const jid = parsed.args[0].toLowerCase();
    ownerRepository.addOwner(jid, 0);
    await ctx.send(`✅ Owner berhasil ditambahkan\n👤 ${jid}`);
    return;
  }

  if (parsed.command === 'delowner') {
    if (parsed.args.length !== 1) {
      await ctx.send(formatWrongExample('delowner 62xxxx@s.whatsapp.net'));
      return;
    }

    const jid = parsed.args[0].toLowerCase();
    if (jid === config.mainOwnerJid) {
      await ctx.send('⛔ Owner utama tidak bisa dihapus.');
      return;
    }

    ownerRepository.removeOwner(jid);
    await ctx.send(`🗑️ Owner tambahan berhasil dihapus\n👤 ${jid}`);
    return;
  }

  if (parsed.command === 'listowner') {
    const rows = ownerRepository.listOwners();
    const lines = rows.map((row, i) => `${i + 1}. ${row.jid} (${Number(row.is_main) ? 'Owner Utama' : 'Owner Tambahan'})`);
    await ctx.send(`┏━━〔 👑 LIST OWNER BOT 〕━━┓\n${lines.join('\n')}\n┗━━━━━━━━━━━━━━━━━━━━┛`);
  }
}

module.exports = { handle, claimOwner };
