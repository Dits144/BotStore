'use strict';
/**
 * ocrService.js — OCR nominal Rupiah dari buffer gambar menggunakan tesseract.js
 * Strategy: tesseract.js → parser pola Rupiah → return nominal terbesar >= 1000
 * Fallback: regex dari teks caption jika tidak ada gambar
 */
const logger = require('../config/logger');

/**
 * Normalisasi string angka ke integer.
 * Contoh: "50.000" → 50000, "50,000" → 50000, "50000" → 50000
 */
function parseRupiahString(raw) {
  // Hilangkan karakter non-digit kecuali titik dan koma
  let clean = raw.replace(/[^0-9.,]/g, '');
  // Jika ada koma sebagai desimal (50,50) vs ribuan (50.000)
  // Heuristik: jika ada titik/koma di posisi ke-3 dari belakang → ribuan
  // Remove semua titik dan koma yang bukan desimal
  // Strategy: remove dots (thousand sep), remove commas (thousand sep)
  clean = clean.replace(/\./g, '').replace(/,/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

const MAX_AMOUNT = 5000000; // Rp 5.000.000 (Safe ceiling to avoid serial numbers/large noise)
const MIN_AMOUNT = 1000;    // Rp 1.000

/**
 * Ekstrak semua nominal Rupiah dari teks mentah OCR/caption
 * @param {string} text
 * @returns {number} nominal terbesar >= 1000 dan <= 5.000.000, atau 0 jika tidak ditemukan
 */
function extractAmountFromText(text) {
  if (!text) return 0;

  // Tier 1: Pola eksplisit dengan konteks nominal (Rp, IDR, total/jumlah dll.)
  const tier1Patterns = [
    // Rp50.000 / Rp 50.000 / Rp50,000
    /Rp\.?\s?([\d.,]+)/gi,
    // IDR 50.000 / IDR50000
    /IDR\.?\s?([\d.,]+)/gi,
    // total/jumlah/nominal/bayar/transfer: 50.000
    /(?:total|jumlah|nominal|bayar|transfer|nilai|harga|sebesar)[^\d]*([\d.,]{4,})/gi
  ];

  const tier1Candidates = [];
  for (const pattern of tier1Patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const captured = match[1] || match[0];
      let amount = parseRupiahString(captured);
      // Auto-scale if amount is in millions/tens of millions (due to OCR reading decimal .00 / ,00 as zeros)
      if (amount >= 1000000) {
        amount = Math.floor(amount / 100);
      }
      if (amount >= MIN_AMOUNT && amount <= MAX_AMOUNT) {
        tier1Candidates.push(amount);
      }
    }
  }

  // Jika ada kandidat Tier 1 dalam rentang valid, pilih yang terbesar dari Tier 1
  if (tier1Candidates.length > 0) {
    return Math.max(...tier1Candidates);
  }

  // Tier 2: Fallback bare numbers (kurang terpercaya, rentan no. rekening / no. hp / serial)
  // Batasi panjang angka bare untuk menghindari digit sangat panjang
  const tier2Patterns = [
    // Angka bare dengan separator ribuan (contoh: 50.000 atau 1,250,000)
    /\b([\d]{1,3}(?:[.,][\d]{3})+)\b/g,
    // Angka bare tanpa separator, dibatasi 4-7 digit saja (1000 s/d 9999999)
    /\b([\d]{4,7})\b/g
  ];

  const tier2Candidates = [];
  for (const pattern of tier2Patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const captured = match[1] || match[0];
      let amount = parseRupiahString(captured);
      // Auto-scale if amount is in millions/tens of millions (due to OCR reading decimal .00 / ,00 as zeros)
      if (amount >= 1000000) {
        amount = Math.floor(amount / 100);
      }
      if (amount >= MIN_AMOUNT && amount <= MAX_AMOUNT) {
        tier2Candidates.push(amount);
      }
    }
  }

  if (tier2Candidates.length > 0) {
    return Math.max(...tier2Candidates);
  }

  return 0;
}

/**
 * OCR gambar menggunakan tesseract.js
 * @param {Buffer} imageBuffer
 * @returns {Promise<{amount: number, raw: string}>}
 */
async function ocrImage(imageBuffer) {
  try {
    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'ind+eng',
      { logger: () => {} } // suppress tesseract verbose logs
    );
    const raw = text || '';
    const amount = extractAmountFromText(raw);
    logger.info({ amount, rawPreview: raw.slice(0, 200) }, '[ocrService] OCR result');
    return { amount, raw };
  } catch (err) {
    logger.warn({ err: err.message }, '[ocrService] tesseract OCR gagal, fallback ke 0');
    return { amount: 0, raw: '' };
  }
}

/**
 * Main entry: OCR gambar jika ada, fallback regex teks jika tidak ada gambar
 * @param {Buffer|null} imageBuffer
 * @param {string} captionText - teks caption/catatan transaksi
 * @returns {Promise<{amount: number, raw: string}>}
 */
async function extractAmount(imageBuffer, captionText = '') {
  if (imageBuffer && imageBuffer.length > 0) {
    const result = await ocrImage(imageBuffer);
    // Jika OCR berhasil ambil nominal, return
    if (result.amount > 0) return result;
    // Fallback ke caption text jika OCR 0
    const fallback = extractAmountFromText(captionText);
    return { amount: fallback, raw: result.raw };
  }
  // Tidak ada gambar — parse dari caption text
  const amount = extractAmountFromText(captionText);
  return { amount, raw: captionText };
}

module.exports = { extractAmount, extractAmountFromText, parseRupiahString };
