const { readDb, writeDb } = require('../database/db');

function normalizePhone(input = '') {
  return String(input).replace(/[^0-9]/g, '');
}

function getOwnerNumber() {
  const db = readDb();
  const dbOwner = normalizePhone(db?.global?.ownerNumber || '');
  const envOwner = normalizePhone(process.env.OWNER_NUMBER || '');
  return dbOwner || envOwner || '';
}

function hasOwner() {
  return Boolean(getOwnerNumber());
}

function isOwnerJid(sender = '') {
  const owner = getOwnerNumber();
  if (!owner) return false;
  const senderPhone = normalizePhone(String(sender).split('@')[0]);
  return senderPhone.endsWith(owner);
}

function claimOwner(sender = '') {
  const senderPhone = normalizePhone(String(sender).split('@')[0]);
  if (!senderPhone) return { ok: false, reason: 'invalid_sender' };

  const db = readDb();
  const current = normalizePhone(db?.global?.ownerNumber || process.env.OWNER_NUMBER || '');
  if (current) {
    return { ok: false, reason: 'owner_exists', ownerNumber: current };
  }

  db.global.ownerNumber = senderPhone;
  writeDb(db);
  return { ok: true, ownerNumber: senderPhone };
}

module.exports = {
  normalizePhone,
  getOwnerNumber,
  hasOwner,
  isOwnerJid,
  claimOwner
};
