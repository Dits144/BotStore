const rentalRepository = require('../../repositories/rentalRepository');
const { formatWrongExample } = require('../../utils/messageFormatter');
const { dayjs, nowJakarta, formatDateTime } = require('../../utils/time');
const { computeRenewalExpiry, refreshRentalStatus } = require('../../services/rentalService');
const { isBotOwner } = require('../../services/roleService');
const logger = require('../../config/logger');
const { normalizeJid } = require('../../utils/jid');
const { styled } = require('../../utils/styledText');

async function handle(ctx, parsed) {
  const senderJid = normalizeJid(ctx.sender);
  const owner = await isBotOwner(senderJid);
  logger.info({
    command: parsed.command,
    remoteJid: ctx.msg?.key?.remoteJid || '',
    participant: ctx.msg?.key?.participant || '',
    senderDetected: ctx.sender,
    senderNormalized: senderJid,
    roleResolved: owner ? 'bot_owner' : 'user'
  }, 'rental command permission check');

  if (!owner) {
    logger.warn({ command: parsed.command, senderJid, reason: 'not_owner' }, 'rental command denied');
    await ctx.send(`❌ ${styled('Akses ditolak')}\n${styled('Perintah ini khusus untuk Owner Bot.')}`);
    return;
  }

  await refreshRentalStatus();

  if (parsed.command === 'addsewa') return addSewa(ctx, parsed.args);
  if (parsed.command === 'renewsewa') return renewSewa(ctx, parsed.args);
  if (parsed.command === 'delsewa') return delSewa(ctx, parsed.args);
  if (parsed.command === 'listsewa') return listSewa(ctx);
  if (parsed.command === 'ceksewa') return cekSewa(ctx, parsed.args);
}

async function addSewa(ctx, args) {
  if (args.length !== 2 || Number.isNaN(Number(args[1])) || Number(args[1]) <= 0) {
    await ctx.send(formatWrongExample('addsewa 1203630xxxx@g.us 90'));
    return;
  }

  const groupId = args[0];
  const duration = Number(args[1]);
  const groupName = await resolveGroupName(ctx.sock, groupId);
  const expiredAt = nowJakarta().add(duration, 'day').toISOString();

  await rentalRepository.upsertRental({
    group_id: groupId,
    group_name: groupName,
    duration_days: duration,
    expired_at: expiredAt,
    is_active: 1,
    added_by: ctx.sender
  });

  await ctx.send(
    `✅ ${styled('Grup berhasil ditambahkan ke daftar sewa')}\n` +
    `📛 ${styled('Group')} : ${groupName}\n` +
    `🆔 ${styled('Group ID')} : ${groupId}\n` +
    `⏳ ${styled('Durasi')} : ${duration} ${styled('Hari')}\n` +
    `📅 ${styled('Expired')} : ${formatDateTime(expiredAt)}`
  );
}

async function renewSewa(ctx, args) {
  if (args.length !== 2 || Number.isNaN(Number(args[1])) || Number(args[1]) <= 0) {
    await ctx.send(formatWrongExample('renewsewa 1203630xxxx@g.us 30'));
    return;
  }

  const groupId = args[0];
  const duration = Number(args[1]);
  const existing = await rentalRepository.getRental(groupId);
  const expiredAt = computeRenewalExpiry(existing, duration);
  const groupName = await resolveGroupName(ctx.sock, groupId);

  await rentalRepository.upsertRental({
    group_id: groupId,
    group_name: groupName,
    duration_days: duration,
    expired_at: expiredAt,
    is_active: 1,
    added_by: ctx.sender
  });

  await ctx.send(
    `♻️ ${styled('Masa sewa berhasil diperpanjang')}\n` +
    `📛 ${styled('Group')} : ${groupName}\n` +
    `🆔 ${styled('Group ID')} : ${groupId}\n` +
    `⏳ ${styled('Penambahan')} : ${duration} ${styled('Hari')}\n` +
    `📅 ${styled('Expired Baru')} : ${formatDateTime(expiredAt)}`
  );
}

async function delSewa(ctx, args) {
  if (args.length !== 1) {
    await ctx.send(formatWrongExample('delsewa 1203630xxxx@g.us'));
    return;
  }

  const groupId = args[0];
  const existing = await rentalRepository.getRental(groupId);
  await rentalRepository.deleteRental(groupId);

  await ctx.send(
    `🗑️ ${styled('Grup berhasil dihapus dari daftar sewa')}\n` +
    `📛 ${styled('Group')} : ${existing?.group_name || styled('tidak diketahui')}\n` +
    `🆔 ${styled('Group ID')} : ${groupId}`
  );
}

async function listSewa(ctx) {
  const rows = await rentalRepository.listRentals();
  if (!rows.length) {
    await ctx.send(`📭 ${styled('Belum ada grup yang terdaftar sewa.')}`);
    return;
  }

  const content = rows.map((r, i) => {
    const status = dayjs(r.expired_at).isAfter(nowJakarta()) && Number(r.is_active) === 1 ? 'aktif' : 'expired';
    return `${i + 1}. ${r.group_name}\n🆔 ${r.group_id}\n📅 ${formatDateTime(r.expired_at)}\n🔖 ${status}`;
  }).join('\n\n');

  await ctx.send(`┏━━〔 📦 LIST SEWA GRUP 〕━━┓\n${content}\n┗━━━━━━━━━━━━━━━━━━━━┛`);
}

async function cekSewa(ctx, args) {
  if (args.length !== 1) {
    await ctx.send(formatWrongExample('ceksewa 1203630xxxx@g.us'));
    return;
  }

  const row = await rentalRepository.getRental(args[0]);
  if (!row) {
    await ctx.send(`❌ ${styled('Data sewa grup tidak ditemukan.')}`);
    return;
  }

  const status = dayjs(row.expired_at).isAfter(nowJakarta()) && Number(row.is_active) === 1 ? 'aktif' : 'expired';
  await ctx.send(
    `📛 Group : ${row.group_name}\n` +
    `🆔 Group ID : ${row.group_id}\n` +
    `⏳ Durasi : ${row.duration_days} Hari\n` +
    `📅 Expired : ${formatDateTime(row.expired_at)}\n` +
    `🔖 Status : ${status}`
  );
}

async function resolveGroupName(sock, groupId) {
  try {
    const meta = await sock.groupMetadata(groupId);
    return meta.subject || 'Unknown Group';
  } catch (error) {
    return 'Unknown Group';
  }
}

module.exports = { handle };
