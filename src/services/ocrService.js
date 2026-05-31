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

/**
 * Ekstrak semua nominal Rupiah dari teks mentah OCR/caption
 * @param {string} text
 * @returns {number} nominal terbesar >= 1000, atau 0 jika tidak ditemukan
 */
function extractAmountFromText(text) {
  if (!text) return 0;

  const patterns = [
    // Rp50.000 / Rp 50.000 / Rp50,000
    /Rp\.?\s?([\d.,]+)/gi,
    // IDR 50.000 / IDR50000
    /IDR\.?\s?([\d.,]+)/gi,
    // Total: 50.000 / Total 50.000
    /(?:total|jumlah|nominal|bayar|transfer)[^\d]*([\d.,]{4,})/gi,
    // Bare numbers 4+ digits (fallback)
    /\b([\d]{1,3}(?:[.,][\d]{3})+)\b/g,
    /\b([\d]{5,})\b/g,
  ];

  const candidates = [];

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const captured = match[1] || match[0];
      const amount = parseRupiahString(captured);
      if (amount >= 1000) candidates.push(amount);
    }
  }

  if (candidates.length === 0) return 0;
  return Math.max(...candidates);
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
