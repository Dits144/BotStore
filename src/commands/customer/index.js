// ─────────────────────────────────────────────────────────────────────────────
// customerLevel — Fitur Level Customer
//
// Command:
//   level              → cek level kamu sendiri
//   level cek <nomor>  → cek level customer tertentu (admin/owner)
//   level on           → aktifkan fitur level di grup (admin/owner)
//   level off          → nonaktifkan fitur level di grup (admin/owner)
//   levelboard         → leaderboard top 10 customer
//
// Level berdasarkan total transaksi sukses kumulatif:
//   Baru    🆕 : 0 transaksi
//   Bronze  🥉 : 1 – 24
//   Silver  🥈 : 25 – 99
//   Gold    🥇 : 100 – 499
//   Platinum💎 : 500+
// ─────────────────────────────────────────────────────────────────────────────

const customerRepository = require('../../repositories/customerRepository');
const { canManageCatalogue } = require('../../middlewares/roleGuard');
const { sendMinimalError, sendMinimalSuccess, reactLoading, reactSuccess, reactError } = require('../../utils/chatUx');
const { normalizeUserJid, toMentionJid } = require('../../utils/jid');
const { styled, sans } = require('../../utils/styledText');
const logger = require('../../config/logger');

// ─── Level render helper ──────────────────────────────────────────────────────

function buildLevelBar(total) {
  const tiers = customerRepository.LEVEL_TIERS;
  // Cari posisi di tier sekarang
  const currentTier = customerRepository.resolveLevel(total);
  const currentIdx  = tiers.findIndex((t) => t.name === currentTier.name);
  const nextTier    = currentIdx > 0 ? tiers[currentIdx - 1] : null;

  let progressLine = '';
  if (nextTier) {
    const needed = nextTier.min - total;
    progressLine = `\n📈 ${sans('Butuh')} ${needed} ${sans('transaksi lagi ke')} ${nextTier.emoji} ${sans(nextTier.name)}`;
  } else {
    progressLine = `\n🏆 ${sans('Level Tertinggi! Luar biasa!')}`;
  }
  return progressLine;
}

function formatLevelCard(jidDisplay, total, tier) {
  const progressLine = buildLevelBar(total);
  return (
    `${tier.emoji} ${styled(tier.name)}\n` +
    `${'━'.repeat(20)}\n` +
    `👤 ${sans('Customer')} : ${jidDisplay}\n` +
    `🛒 ${sans('Transaksi')} : ${total} ${sans('kali sukses')}\n` +
    `🎖️ ${sans('Level')}     : ${tier.emoji} ${sans(tier.name)}` +
    progressLine
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

async function handle(ctx, parsed) {
  if (!ctx.isGroup) {
    await sendMinimalError(ctx.sock, ctx.from, `⚠️ ${sans('Command ini hanya bisa dipakai di grup.')}`);
    return;
  }

  const sub = String(parsed.args[0] || '').toLowerCase();

  // ── Toggle: level on / level off (hanya admin/owner) ──
  if (sub === 'on' || sub === 'off') {
    const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
    if (!canManage) {
      await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Akses ditolak. Hanya Admin Grup atau Owner Bot.')}`);
      return;
    }
    await reactLoading(ctx.sock, ctx.msg);
    await customerRepository.setLevelEnabled(ctx.from, sub === 'on');
    await reactSuccess(ctx.sock, ctx.msg);
    await sendMinimalSuccess(
      ctx.sock, ctx.from,
      sub === 'on'
        ? `✅ ${sans('Fitur Level Customer')} ${styled('diaktifkan')} 🎖️`
        : `✅ ${sans('Fitur Level Customer')} ${styled('dinonaktifkan')} 🔕`
    );
    return;
  }

  // ── Cek apakah fitur aktif sebelum perintah lainnya ──
  const enabled = await customerRepository.isLevelEnabled(ctx.from);
  if (!enabled) {
    await sendMinimalError(ctx.sock, ctx.from, `🔕 ${sans('Fitur Level Customer sedang nonaktif.')}`);
    return;
  }

  // ── Cek level orang lain: level cek <nomor> (hanya admin/owner) ──
  if (sub === 'cek') {
    const canManage = await canManageCatalogue(ctx.sock, ctx.from, ctx.sender);
    if (!canManage) {
      await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Akses ditolak. Hanya Admin Grup atau Owner Bot.')}`);
      return;
    }

    const rawTarget = String(parsed.args[1] || '').replace(/\D/g, '');
    if (!rawTarget) {
      await sendMinimalError(ctx.sock, ctx.from, `❌ ${sans('Format')}: level cek 628xxx`);
      return;
    }

    const targetJid = `${rawTarget}@s.whatsapp.net`;
    const { total, tier } = await customerRepository.getCustomerLevel(ctx.from, targetJid);
    await ctx.sock.sendMessage(ctx.from, {
      text: `🔍 ${styled('Cek Level Customer')}\n${'━'.repeat(20)}\n` + formatLevelCard(`+${rawTarget}`, total, tier)
    });
    return;
  }

  // ── Leaderboard ──
  if (sub === 'board' || parsed.command === 'levelboard') {
    const rows = await customerRepository.getLeaderboard(ctx.from, 10);
    if (!rows.length) {
      await sendMinimalError(ctx.sock, ctx.from, `📭 ${sans('Belum ada transaksi sukses di grup ini.')}`);
      return;
    }

    const lines = rows.map((r, i) => {
      const tier  = customerRepository.resolveLevel(r.total);
      const phone = r.customer_jid.split('@')[0];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      return `${medal} +${phone} — ${tier.emoji} ${sans(tier.name)} (${r.total}x)`;
    });

    await ctx.sock.sendMessage(ctx.from, {
      text:
        `🏆 ${styled('Level Leaderboard')}\n` +
        `${'━'.repeat(22)}\n` +
        lines.join('\n')
    });
    return;
  }

  // ── Cek level sendiri (default: ketik "level") ──
  const { total, tier } = await customerRepository.getCustomerLevel(ctx.from, ctx.sender);
  const phone = ctx.sender.split('@')[0];

  await ctx.sock.sendMessage(ctx.from, {
    text:
      `🎖️ ${styled('Level Kamu')}\n` +
      `${'━'.repeat(20)}\n` +
      formatLevelCard(`+${phone}`, total, tier) + '\n\n' +
      `${sans('Ketik')} d ${sans('pada nota transaksi untuk tambah poin.')}`
  });
}

// ─── Helper dipanggil dari transactionNote saat status "Done" ─────────────────
// Dipanggil oleh adminCommands setelah transaksi Done berhasil dicatat
async function recordSuccess(groupId, customerJid) {
  try {
    const enabled = await customerRepository.isLevelEnabled(groupId);
    if (!enabled) return null;

    await customerRepository.addSuccessTransaction(groupId, customerJid);
    const { total, tier } = await customerRepository.getCustomerLevel(groupId, customerJid);
    return { total, tier };
  } catch (err) {
    logger.warn({ err, groupId, customerJid }, '[customerLevel] recordSuccess failed');
    return null;
  }
}

module.exports = { handle, recordSuccess };
