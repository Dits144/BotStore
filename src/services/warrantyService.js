'use strict';

// Only explicit units are accepted; never infer a warranty from a product without a duration.
function parseDuration(input = '') {
  const match = String(input).match(/\b(\d{1,3})\s*(hari|hr|day|days|minggu|week|weeks|bulan|bln|month|months|tahun|thn|year|years)\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isInteger(value) || value < 1 || value > 120) return null;
  const raw = match[2].toLowerCase();
  const unit = /^(hari|hr|day|days)$/.test(raw) ? 'day' : /^(minggu|week|weeks)$/.test(raw) ? 'week' : /^(bulan|bln|month|months)$/.test(raw) ? 'month' : 'year';
  return { value, unit, label: `${value} ${unit === 'day' ? 'Hari' : unit === 'week' ? 'Minggu' : unit === 'month' ? 'Bulan' : 'Tahun'}` };
}

function durationForCommand(args, quotedText) {
  const override = String(args || '').trim();
  if (override && !/^\d{1,3}\s*(?:hari|hr|day|days|minggu|week|weeks|bulan|bln|month|months|tahun|thn|year|years)$/i.test(override)) {
    throw new Error('Format durasi tidak valid. Contoh: P 7 Hari atau P 1 Bulan.');
  }
  const duration = parseDuration(override || quotedText);
  if (override && !duration) throw new Error('Durasi tidak valid (maksimal 120 unit).');
  return duration;
}

// Calendar months and years, clamped to the final day when necessary.
function expiryFrom(start, duration) {
  if (!duration) return null;
  const date = new Date(start);
  if (!Number.isFinite(date.getTime())) return null;
  const { value, unit } = duration;
  if (unit === 'day' || unit === 'week') date.setUTCDate(date.getUTCDate() + value * (unit === 'week' ? 7 : 1));
  else {
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    if (unit === 'month') date.setUTCMonth(date.getUTCMonth() + value);
    else date.setUTCFullYear(date.getUTCFullYear() + value);
    const end = new Date(date);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    date.setUTCDate(Math.min(originalDay, end.getUTCDate()));
  }
  return date.toISOString();
}

function warrantyStatus(transaction, now = Date.now()) {
  if (['refund', 'batal'].includes(transaction.status)) return 'void';
  if (transaction.status !== 'done' || !transaction.done_at) return 'not_completed';
  if (!transaction.expires_at || !transaction.started_at) return 'unknown_duration';
  return Date.parse(transaction.expires_at) > now ? 'eligible' : 'expired';
}

module.exports = { parseDuration, durationForCommand, expiryFrom, warrantyStatus };
