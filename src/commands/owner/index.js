const ownerRepository = require('../../repositories/ownerRepository');
const config = require('../../config/env');
const logger = require('../../config/logger');
const { formatWrongExample } = require('../../utils/messageFormatter');
const { normalizeJid, toPhoneNumber } = require('../../utils/jid');
const { isBotOwner, isGroupAdmin, getUserRole } = require('../../services/roleService');
const { isGroupRentalActive } = require('../../services/rentalService');

async function claimOwner(ctx) {
  if (ctx.isGroup) return;

  const senderJid = normalizeJid(ctx.sender);
  if (!senderJid) {
    await ctx.send('❌ Gagal membaca nomor pengirim. Coba kirim ulang dari chat pribadi.');
    return;
  }

  if (await isBotOwner(senderJid)) {
    await ctx.send('ℹ️ Kamu sudah terdaftar sebagai Owner Bot.');
    return;
  }

  await ownerRepository.addOwner(senderJid, 0);
  logger.info({ senderJid }, 'owner claimed from private chat');

  await ctx.send(
    `┏━━〔 🛡️ OWNER BOT 〕━━┓\n` +
    `┗━━━━━━━━━━━━━━━━━━┛\n` +
    `✅ Owner Bot berhasil diklaim\n\n` +
    `📱 Nomor : ${toPhoneNumber(senderJid)}\n` +
    `🆔 Role : Owner Bot\n\n` +
    `Sekarang kamu bisa memakai command owner seperti:\n` +
    `• addsewa\n` +
    `• renewsewa\n` +
    `• delsewa\n` +
    `• listsewa`
  );
}

async function handle(ctx, parsed) {
  if (parsed.command === 'cekrole' || parsed.command === 'myrole') {
    await showRole(ctx);
    return;
  }

  const senderJid = normalizeJid(ctx.sender);
  const owner = await isBotOwner(senderJid);
  logger.info({ command: parsed.command, senderDetected: ctx.sender, senderNormalized: senderJid, roleResolved: owner ? 'bot_owner' : 'user' }, 'owner command permission check');

  if (!owner) {
    await ctx.send('❌ Akses ditolak\nPerintah ini khusus untuk Owner Bot.');
    return;
  }

  if (parsed.command === 'owner') {
    if (parsed.args.length !== 1) {
      await ctx.send(formatWrongExample('owner 62xxxx@s.whatsapp.net'));
      return;
    }

    const jid = normalizeJid(parsed.args[0]);
    if (!jid) {
      await ctx.send(formatWrongExample('owner 62xxxx@s.whatsapp.net'));
      return;
    }

    await ownerRepository.addOwner(jid, 0);
    await ctx.send(`✅ Owner berhasil ditambahkan\n👤 ${jid}`);
    return;
  }

  if (parsed.command === 'delowner') {
    if (parsed.args.length !== 1) {
      await ctx.send(formatWrongExample('delowner 62xxxx@s.whatsapp.net'));
      return;
    }

    const jid = normalizeJid(parsed.args[0]);
    if (!jid) {
      await ctx.send(formatWrongExample('delowner 62xxxx@s.whatsapp.net'));
      return;
    }

    if (jid === normalizeJid(config.mainOwnerJid)) {
      await ctx.send('⛔ Owner utama tidak bisa dihapus.');
      return;
    }

    await ownerRepository.removeOwner(jid);
    await ctx.send(`🗑️ Owner tambahan berhasil dihapus\n👤 ${jid}`);
    return;
  }

  if (parsed.command === 'listowner') {
    const rows = await ownerRepository.listOwners();
    const lines = rows.map((row, i) => `${i + 1}. ${row.jid} (${Number(row.is_main) ? 'Owner Utama' : 'Owner Tambahan'})`);
    await ctx.send(`┏━━〔 👑 LIST OWNER BOT 〕━━┓\n${lines.join('\n')}\n┗━━━━━━━━━━━━━━━━━━━━┛`);
    return;
  }

}

async function showRole(ctx) {
  const role = await getUserRole({
    sock: ctx.sock,
    groupId: ctx.from,
    senderJid: ctx.sender,
    isGroup: ctx.isGroup
  });

  let roleLabel = 'User';
  if (role === 'bot_owner') roleLabel = 'Owner Bot';
  if (role === 'group_admin') roleLabel = 'Admin Grup';

  const admin = ctx.isGroup ? await isGroupAdmin(ctx.sock, ctx.from, ctx.sender) : false;
  const rentalActive = ctx.isGroup ? await isGroupRentalActive(ctx.from) : false;

  await ctx.send(
    `┏━━〔 👤 ROLE SAYA 〕━━┓\n` +
    `┗━━━━━━━━━━━━━━━━━━┛\n` +
    `📱 Nomor : ${toPhoneNumber(ctx.sender)}\n` +
    `🆔 JID : ${normalizeJid(ctx.sender)}\n` +
    `🛡️ Role : ${roleLabel}\n` +
    `💬 Chat : ${ctx.isGroup ? 'Group' : 'Private'}\n` +
    `👥 Admin Grup : ${admin ? 'Ya' : 'Tidak'}\n` +
    `🏷️ Grup Aktif : ${rentalActive ? 'Ya' : 'Tidak'}`
  );
}

module.exports = { handle, claimOwner };
