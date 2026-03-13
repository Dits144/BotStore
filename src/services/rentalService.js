const rentalRepository = require('../repositories/rentalRepository');
const { dayjs, nowJakarta } = require('../utils/time');

async function refreshRentalStatus() {
  await rentalRepository.refreshStatus(nowJakarta().toISOString());
}

async function isGroupRentalActive(groupId) {
  await refreshRentalStatus();
  const row = await rentalRepository.getRental(groupId);
  if (!row) return false;
  return Number(row.is_active) === 1 && dayjs(row.expired_at).isAfter(nowJakarta());
}

function computeRenewalExpiry(existing, days) {
  const now = nowJakarta();
  if (existing && dayjs(existing.expired_at).isAfter(now)) {
    return dayjs(existing.expired_at).tz(now.tz()).add(days, 'day').toISOString();
  }
  return now.add(days, 'day').toISOString();
}

module.exports = { refreshRentalStatus, isGroupRentalActive, computeRenewalExpiry };
