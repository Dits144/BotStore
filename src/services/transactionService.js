'use strict';
/**
 * transactionService.js — Orchestrator untuk proses transaksi OCR
 */
const crypto = require('crypto');
const { extractAmount } = require('./ocrService');
const transactionRepository = require('../repositories/transactionRepository');
const logger = require('../config/logger');
const { nowJakarta } = require('../utils/time');

/**
 * Proses transaksi: OCR gambar → simpan ke DB
 * @param {object} opts
 * @param {Buffer|null} opts.imageBuffer
 * @param {string} opts.captionText - teks caption/catatan
 * @param {string} opts.groupId
 * @param {string} opts.groupName
 * @param {string} opts.customerJid
 * @param {string} opts.adminJid
 * @param {string} opts.product - nama produk dari teks
 * @param {string} opts.status - 'pending'|'done'|'refund'|'batal'
 * @returns {Promise<{trxId: string, amount: number, ocrRaw: string}>}
 */
async function processTransaction(opts) {
  const {
    imageBuffer,
    captionText = '',
    groupId,
    groupName = '',
    customerJid,
    adminJid = '',
    product = '',
    status = 'pending',
  } = opts;

  // 1. OCR
  const { amount, raw: ocrRaw } = await extractAmount(imageBuffer, captionText);
  logger.info({ groupId, customerJid, amount, status }, '[transactionService] OCR done');

  // 2. Generate trxId
  const now = nowJakarta();
  const trxId = `TRX-${now.format('YYYYMMDD')}-${crypto.randomInt(1000, 9999)}`;

  // 3. Simpan ke DB
  await transactionRepository.create({
    trxId,
    groupId,
    groupName,
    customerJid,
    adminJid,
    product,
    amount,
    status,
    ocrRaw,
    createdAt: now.toISOString(),
  });

  return { trxId, amount, ocrRaw };
}

module.exports = { processTransaction };
