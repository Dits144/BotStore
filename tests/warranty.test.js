'use strict';

const assert = require('assert');
const {
  parseDuration,
  durationForCommand,
  expiryFrom,
  warrantyStatus
} = require('../src/services/warrantyService');

async function runTests() {
  console.log('--- Testing warrantyService Unit Tests ---');

  // 1. parseDuration
  const p1 = parseDuration('CAPCUT PRO 1 BULAN');
  assert.deepStrictEqual(p1, { value: 1, unit: 'month', label: '1 Bulan' });

  const p2 = parseDuration('CANVA PRO 7 HARI');
  assert.deepStrictEqual(p2, { value: 7, unit: 'day', label: '7 Hari' });

  const p3 = parseDuration('NETFLIX 3 BULAN PRIVATE');
  assert.deepStrictEqual(p3, { value: 3, unit: 'month', label: '3 Bulan' });

  const p4 = parseDuration('VPN 2 MINGGU');
  assert.deepStrictEqual(p4, { value: 2, unit: 'week', label: '2 Minggu' });

  const p5 = parseDuration('YOUTUBE 1 TAHUN');
  assert.deepStrictEqual(p5, { value: 1, unit: 'year', label: '1 Tahun' });

  const pNone = parseDuration('MOBILE LEGENDS 86 DM');
  assert.strictEqual(pNone, null);

  console.log('✓ parseDuration passed');

  // 2. durationForCommand
  // Case A: Admin types "P" only -> inferred from quoted caption
  const dAuto = durationForCommand('', 'CAPCUT PRO 1 BULAN');
  assert.deepStrictEqual(dAuto, { value: 1, unit: 'month', label: '1 Bulan' });

  // Case B: Admin types "P 7 Hari" -> overrides quoted caption
  const dOverride = durationForCommand('7 Hari', 'CAPCUT PRO 1 BULAN');
  assert.deepStrictEqual(dOverride, { value: 7, unit: 'day', label: '7 Hari' });

  // Case C: Invalid duration string
  assert.throws(
    () => durationForCommand('halo tes', 'CAPCUT'),
    /Format durasi tidak valid/
  );

  console.log('✓ durationForCommand passed');

  // 3. expiryFrom
  const start = '2026-11-01T01:05:25.000Z';
  const expMonth = expiryFrom(start, { value: 1, unit: 'month', label: '1 Bulan' });
  assert.strictEqual(expMonth, '2026-12-01T01:05:25.000Z');

  const expDays = expiryFrom(start, { value: 7, unit: 'day', label: '7 Hari' });
  assert.strictEqual(expDays, '2026-11-08T01:05:25.000Z');

  // End of month edge case (e.g. Jan 31 -> Feb 28)
  const jan31 = '2026-01-31T12:00:00.000Z';
  const expFeb = expiryFrom(jan31, { value: 1, unit: 'month', label: '1 Bulan' });
  assert.strictEqual(expFeb, '2026-02-28T12:00:00.000Z');

  console.log('✓ expiryFrom passed');

  // 4. warrantyStatus
  const now = Date.parse('2026-11-15T12:00:00.000Z');

  // Rule 1: Tanpa Pesanan Selesai (status 'pending') -> not_completed
  const trxPending = {
    status: 'pending',
    started_at: '2026-11-01T01:05:25.000Z',
    expires_at: '2026-12-01T01:05:25.000Z',
    done_at: null,
  };
  assert.strictEqual(warrantyStatus(trxPending, now), 'not_completed');

  // Rule 2: Pesanan Selesai (status 'done') & belum expired -> eligible
  const trxDone = {
    status: 'done',
    started_at: '2026-11-01T01:05:25.000Z',
    expires_at: '2026-12-01T01:05:25.000Z',
    done_at: '2026-11-01T01:10:00.000Z',
  };
  assert.strictEqual(warrantyStatus(trxDone, now), 'eligible');

  // Rule 3: Pesanan Selesai tetapi masa aktif sudah habis -> expired
  const nowFuture = Date.parse('2026-12-05T12:00:00.000Z');
  assert.strictEqual(warrantyStatus(trxDone, nowFuture), 'expired');

  // Rule 4: Transaksi batal atau refund -> void
  const trxRefund = {
    status: 'refund',
    started_at: '2026-11-01T01:05:25.000Z',
    expires_at: '2026-12-01T01:05:25.000Z',
    done_at: null,
  };
  assert.strictEqual(warrantyStatus(trxRefund, now), 'void');

  // Rule 5: Transaksi selesai tanpa durasi -> unknown_duration
  const trxNoDuration = {
    status: 'done',
    started_at: '2026-11-01T01:05:25.000Z',
    expires_at: null,
    done_at: '2026-11-01T01:10:00.000Z',
  };
  assert.strictEqual(warrantyStatus(trxNoDuration, now), 'unknown_duration');

  console.log('✓ warrantyStatus passed');

  console.log('\nAll 15 warranty unit assertions passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
