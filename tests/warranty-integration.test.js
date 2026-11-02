'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Set an isolated test database
const TEST_DB = path.join(__dirname, 'test-isolated.sqlite');
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
process.env.DB_PATH = TEST_DB;

const migrate = require('../src/database/migrate');
const { connectDatabase } = require('../src/database/connection');
const transactionRepository = require('../src/repositories/transactionRepository');
const adminCommand = require('../src/commands/admin/index');

async function runIntegration() {
  console.log('--- Running Warranty Integration Tests ---');

  // 1. Run migrations
  await migrate();
  const db = await connectDatabase();

  const columns = await db.all('PRAGMA table_info(transactions)');
  const colNames = columns.map(c => c.name);
  for (const requiredCol of [
    'payment_message_id',
    'duration_value',
    'duration_unit',
    'duration_label',
    'started_at',
    'expires_at',
    'done_at'
  ]) {
    assert(colNames.includes(requiredCol), `Missing column ${requiredCol}`);
  }
  console.log('✓ Migration added all warranty columns');

  // 2. Setup mock WhatsApp context
  const sentMessages = [];
  const mockSock = {
    groupMetadata: async () => ({
      subject: 'DitsStore Group',
      participants: [
        { id: adminJid, admin: 'admin' }
      ]
    }),
    sendMessage: async (jid, content) => {
      sentMessages.push({ jid, content });
      return { key: { id: `SENT-${Date.now()}` } };
    },
    sendMessageRaw: async () => {},
  };

  const groupId = '120363000000000000@g.us';
  const customerJid = '6289512345678@s.whatsapp.net';
  const adminJid = '6281234567890@s.whatsapp.net';
  const paymentProofMsgId = 'BAE500001234ABCD';

  // Seed user group access for dashboard query
  await db.run('INSERT INTO users (id, email, password, role, created_at) VALUES (1, "admin@test.com", "hash", "admin", "2026-11-01T00:00:00.000Z")');
  await db.run('INSERT INTO rentals (group_id, group_name, duration_days, expired_at, is_active, added_by, created_at, updated_at) VALUES (?, "DitsStore Group", 30, "2026-12-01T00:00:00.000Z", 1, "owner", "2026-11-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z")', [groupId]);
  await db.run('INSERT INTO user_groups (user_id, group_id, created_at) VALUES (1, ?, "2026-11-01T00:00:00.000Z")', [groupId]);

  // Helper to build context
  function makeCtx(cmdText, quotedMsgId, quotedText) {
    const parts = cmdText.trim().split(/\s+/);
    return {
      sock: mockSock,
      from: groupId,
      isGroup: true,
      sender: adminJid,
      msg: {
        key: { id: `CMD-${Date.now()}` },
        message: {
          extendedTextMessage: {
            text: cmdText,
            contextInfo: {
              stanzaId: quotedMsgId,
              participant: customerJid,
              quotedMessage: {
                conversation: quotedText
              }
            }
          }
        }
      },
      parsed: {
        raw: cmdText,
        command: parts[0].toLowerCase(),
        args: parts.slice(1)
      }
    };
  }

  // ── TEST 1: Admin replies "P" to Bukti TF with caption "CAPCUT PRO 1 BULAN" ──
  const ctxP = makeCtx('p', paymentProofMsgId, 'CAPCUT PRO 1 BULAN');
  await adminCommand.handle(ctxP, ctxP.parsed);

  assert.strictEqual(sentMessages.length, 1);
  const msg1 = sentMessages[0].content.text;
  assert(msg1.includes('📝 Produk : CAPCUT PRO 1 BULAN'), 'Receipt missing product line');
  assert(msg1.includes('⏳ Durasi : 1 Bulan'), 'Receipt missing duration line');
  assert(msg1.includes('Pesanan diproses'), 'Receipt missing processing status');
  assert(msg1.includes('LOADING... ⏳ Mohon tunggu'), 'Receipt missing pending footer');

  const trx1 = await db.get('SELECT * FROM transactions WHERE group_id = ? AND payment_message_id = ?', [groupId, paymentProofMsgId]);
  assert(trx1, 'Transaction not found in DB');
  assert.strictEqual(trx1.status, 'pending');
  assert.strictEqual(trx1.duration_label, '1 Bulan');
  assert.strictEqual(trx1.duration_value, 1);
  assert.strictEqual(trx1.duration_unit, 'month');
  assert(trx1.started_at, 'Missing started_at');
  assert(trx1.expires_at, 'Missing expires_at');
  assert.strictEqual(trx1.done_at, null, 'done_at must be null while pending');

  // Verify dashboard listWarranties returns 'not_completed' (Rule: Tanpa Pesanan Selesai Tidak bisa Di garansi)
  const warranties1 = await transactionRepository.listWarranties(1, false);
  assert.strictEqual(warranties1.length, 1);
  assert.strictEqual(warranties1[0].warranty_status, 'not_completed');
  console.log('✓ Test 1: P creates pending transaction with countdown & not_completed warranty');

  // ── TEST 2: Admin corrects duration by replying "P 7 Hari" to the same Bukti TF ──
  sentMessages.length = 0;
  const ctxP7 = makeCtx('p 7 Hari', paymentProofMsgId, 'CAPCUT PRO 1 BULAN');
  await adminCommand.handle(ctxP7, ctxP7.parsed);

  assert.strictEqual(sentMessages.length, 1);
  const msg2 = sentMessages[0].content.text;
  assert(msg2.includes('⏳ Durasi : 7 Hari'), 'Receipt did not update duration to 7 Hari');

  const trx2 = await db.get('SELECT * FROM transactions WHERE group_id = ? AND payment_message_id = ?', [groupId, paymentProofMsgId]);
  assert.strictEqual(trx2.trx_id, trx1.trx_id, 'Should update the SAME transaction row');
  assert.strictEqual(trx2.duration_label, '7 Hari');
  assert.strictEqual(trx2.duration_value, 7);
  assert.strictEqual(trx2.duration_unit, 'day');
  console.log('✓ Test 2: P 7 Hari overrides duration on the same transaction');

  // ── TEST 3: Admin marks Done by replying "D" to Bukti TF ──
  sentMessages.length = 0;
  const ctxD = makeCtx('d', paymentProofMsgId, 'CAPCUT PRO 1 BULAN');
  await adminCommand.handle(ctxD, ctxD.parsed);

  assert(sentMessages.length >= 1);
  const msg3 = sentMessages[0].content.text;
  assert(msg3.includes('✅ Pesanan Selesai'), 'Receipt missing Pesanan Selesai text');
  assert(msg3.includes('⏳ Durasi : 7 Hari'), 'Receipt missing duration on Done');
  assert(msg3.includes('THANK YOU'), 'Receipt missing done footer');

  const trx3 = await db.get('SELECT * FROM transactions WHERE trx_id = ?', [trx1.trx_id]);
  assert.strictEqual(trx3.status, 'done');
  assert(trx3.done_at, 'done_at must be filled when done');

  // Verify dashboard listWarranties is now 'eligible' (garansi aktif)
  const warranties3 = await transactionRepository.listWarranties(1, false);
  assert.strictEqual(warranties3[0].warranty_status, 'eligible');
  console.log('✓ Test 3: D completes transaction and activates warranty');

  // ── TEST 4: Expiration check ──
  // If expires_at is set to the past, warranty_status becomes 'expired'
  await db.run('UPDATE transactions SET expires_at = ? WHERE trx_id = ?', ['2020-01-01T00:00:00.000Z', trx1.trx_id]);
  const warranties4 = await transactionRepository.listWarranties(1, false);
  assert.strictEqual(warranties4[0].warranty_status, 'expired');
  console.log('✓ Test 4: Past expires_at correctly transitions to expired');

  // Cleanup test DB
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  console.log('\nAll integration scenarios passed cleanly!');
}

runIntegration().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
