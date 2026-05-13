const config = require('../config/env');
const { refreshRentalStatus } = require('./rentalService');
const rentalRepository = require('../repositories/rentalRepository');
const { dayjs, nowJakarta, formatDateTime } = require('../utils/time');
const logger = require('../config/logger');

// Track warned groups to avoid duplicate notifications per cycle
const warnedH1 = new Set();   // groups already warned for H-1
const notifiedExpired = new Set(); // groups already notified as expired

function startRentalScheduler(getSock) {
  refreshRentalStatus().catch((error) => {
    logger.error({ err: error }, 'gagal refresh status sewa awal');
  });

  // Run initial check after 10s (wait for connection to stabilize)
  setTimeout(() => {
    checkRentalWarnings(getSock()).catch((err) => {
      logger.error({ err }, 'gagal cek peringatan sewa awal');
    });
  }, 10_000);

  setInterval(async () => {
    try {
      await refreshRentalStatus();
      await checkRentalWarnings(getSock());
    } catch (error) {
      logger.error({ err: error }, 'gagal refresh status sewa');
    }
  }, Math.max(10, config.rentalRefreshSeconds) * 1000);
}

async function checkRentalWarnings(sock) {
  if (!sock) return;

  const rows = await rentalRepository.listRentals();
  const now = nowJakarta();

  for (const rental of rows) {
    const expiredAt = dayjs(rental.expired_at).tz(config.timezone);
    const hoursLeft = expiredAt.diff(now, 'hour', true);
    const groupId = rental.group_id;
    const isActive = Number(rental.is_active) === 1;

    // ─── H-1 Warning (between 0 and 24 hours left) ───
    if (isActive && hoursLeft > 0 && hoursLeft <= 24 && !warnedH1.has(groupId)) {
      warnedH1.add(groupId);
      try {
        const hoursDisplay = Math.floor(hoursLeft);
        const minutesDisplay = Math.floor((hoursLeft - hoursDisplay) * 60);

        await sock.sendMessage(groupId, {
          text:
            `┌─── ⚠️ 𝗣𝗘𝗥𝗜𝗡𝗚𝗔𝗧𝗔𝗡 𝗦𝗘𝗪𝗔 ⚠️ ───┐\n` +
            `│\n` +
            `│ ⏰ Masa sewa grup ini akan habis\n` +
            `│    dalam *${hoursDisplay} jam ${minutesDisplay} menit* lagi!\n` +
            `│\n` +
            `│ 📛 Grup : ${rental.group_name}\n` +
            `│ 📅 Expired : ${formatDateTime(rental.expired_at)}\n` +
            `│\n` +
            `│ 💡 Hubungi owner bot untuk\n` +
            `│    memperpanjang masa sewa.\n` +
            `│\n` +
            `│ ❗ Bot akan otomatis berhenti\n` +
            `│    merespon setelah sewa habis.\n` +
            `│\n` +
            `└────────────────────────────────┘`
        });

        logger.info({ groupId, hoursLeft: hoursLeft.toFixed(1) }, '[scheduler] H-1 warning sent');
      } catch (err) {
        logger.error({ err, groupId }, '[scheduler] gagal kirim H-1 warning');
        warnedH1.delete(groupId); // retry next cycle
      }
    }

    // ─── Expired Notification ───
    if (hoursLeft <= 0 && !notifiedExpired.has(groupId) && warnedH1.has(groupId)) {
      notifiedExpired.add(groupId);
      try {
        await sock.sendMessage(groupId, {
          text:
            `┌─── 🔴 𝗦𝗘𝗪𝗔 𝗕𝗘𝗥𝗔𝗞𝗛𝗜𝗥 🔴 ───┐\n` +
            `│\n` +
            `│ ⛔ Masa sewa grup ini telah habis.\n` +
            `│\n` +
            `│ 📛 Grup : ${rental.group_name}\n` +
            `│ 📅 Expired : ${formatDateTime(rental.expired_at)}\n` +
            `│\n` +
            `│ 🤖 Bot tidak akan merespon perintah\n` +
            `│    di grup ini sampai sewa diperpanjang.\n` +
            `│\n` +
            `│ 💬 Hubungi owner bot untuk perpanjang.\n` +
            `│\n` +
            `└────────────────────────────────┘`
        });

        logger.info({ groupId }, '[scheduler] expiry notification sent');
      } catch (err) {
        logger.error({ err, groupId }, '[scheduler] gagal kirim notifikasi expired');
        notifiedExpired.delete(groupId); // retry next cycle
      }
    }

    // ─── Cleanup: reset tracking when rental is renewed ───
    if (isActive && hoursLeft > 24) {
      warnedH1.delete(groupId);
      notifiedExpired.delete(groupId);
    }
  }
}

module.exports = { startRentalScheduler };
