const groupSettingsRepository = require('../../repositories/groupSettingsRepository');
const { formatDateTime } = require('../../utils/time');
const { toMentionJid } = require('../../utils/jid');
const { renderMentionText } = require('../../utils/messageFormatter');
const logger = require('../../config/logger');
const { sans } = require('../../utils/styledText');

async function info(ctx) {
  if (!ctx.isGroup) {
    await ctx.send(
      `┏━━〔 ℹ️ INFO BOT 〕━━┓\n` +
      `┗━━━━━━━━━━━━━━━━━━┛\n` +
      `📌 Command info grup hanya tersedia saat dipakai di grup.\n` +
      `💡 Gunakan command ini di grup untuk melihat detail metadata grup.`
    );
    return;
  }

  try {
    const meta = await ctx.sock.groupMetadata(ctx.from);
    const owner = meta.owner || 'tidak diketahui';
    const created = meta.creation
      ? formatDateTime(new Date(Number(meta.creation) * 1000).toISOString())
      : 'tidak diketahui';
    const adminCount = (meta.participants || []).filter(
      (p) => p.admin === 'admin' || p.admin === 'superadmin'
    ).length;

    let invite = 'tidak tersedia';
    try {
      const code = await ctx.sock.groupInviteCode(ctx.from);
      if (code) invite = `https://chat.whatsapp.com/${code}`;
    } catch {
      invite = 'tidak tersedia';
    }

    await ctx.send(
      `┏━━〔 📌 INFO GRUP 〕━━┓\n` +
      `┃ ✦ Detail Grup WhatsApp\n` +
      `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
      `📛 Nama Group : ${meta.subject || 'tidak diketahui'}\n` +
      `🔗 Link Group : ${invite}\n` +
      `🆔 ID Group : ${ctx.from}\n` +
      `👑 Owner Group : ${owner}\n` +
      `📅 Tanggal Dibuat : ${created}\n` +
      `👥 Total Member : ${(meta.participants || []).length}\n` +
      `🛡️ Jumlah Admin : ${adminCount}\n\n` +
      `✅ Gunakan info ini dengan bijak.`
    );
  } catch {
    await ctx.send(`❌ ${sans('Gagal mengambil info grup. Coba lagi beberapa saat.')}`);
  }
}

// ---------------------------------------------------------------
// welcomeNewMembers
//
// Dipanggil dari bindMessageEvents saat event group-participants.update
// dengan action === 'add'.
//
// Participant JID dari update bisa berupa:
//   - string JID langsung: "628xxx@s.whatsapp.net"
//   - object: { id: "628xxx@s.whatsapp.net", ... }
//
// toMentionJid() akan normalize keduanya ke format yang benar.
// renderMentionText() ganti @user → @628xxx dan isi mentions array.
// ---------------------------------------------------------------
async function welcomeNewMembers(sock, update) {
  const { id, participants = [], action } = update;

  if (action !== 'add') return;
  if (!id || !id.endsWith('@g.us')) return;

  const setting = await groupSettingsRepository.get(id);
  if (!setting || Number(setting.welcome_enabled) !== 1) return;

  let meta;
  try {
    meta = await sock.groupMetadata(id);
  } catch (err) {
    logger.warn({ err, groupId: id }, '[welcome] gagal ambil groupMetadata');
    return;
  }
  const groupName = meta.subject || 'Group';

  for (const rawJid of participants) {
    // Resolve JID dengan benar:
    // rawJid bisa berupa string atau object tergantung versi Baileys
    const resolvedRaw = typeof rawJid === 'string' ? rawJid : (rawJid?.id || rawJid?.jid || '');

    // Normalize ke format 628xxx@s.whatsapp.net
    const userJid = toMentionJid(resolvedRaw);

    if (!userJid) {
      logger.warn({ rawJid, resolvedRaw }, '[welcome] tidak bisa resolve JID participant, skip');
      continue;
    }

    // Template: ambil dari DB atau pakai default
    const textTemplate =
      setting.welcome_message ||
      'Halo @user\nSelamat datang di grup *{group}* ✨\n\nSemoga betah di sini, jangan lupa baca deskripsi grup dan ikuti aturan yang berlaku yaa.';

    // Ganti {group} dulu, lalu baru render @user → @nomor + mentions
    const bodyRaw = textTemplate.replaceAll('{group}', groupName);
    const mention = renderMentionText(bodyRaw, userJid);

    // Debug log wajib
    logger.info(
      {
        groupId: id,
        groupName,
        rawJid,
        resolvedRaw,
        targetJid: userJid,
        renderedText: mention.text,
        mentions: mention.mentions
      },
      '[welcome] mention debug'
    );

    const caption =
      `┏━━〔 👋 SELAMAT DATANG 〕━━┓\n` +
      `┗━━━━━━━━━━━━━━━━━━━━┛\n\n` +
      `${mention.text}`;

    try {
      // Coba kirim dengan foto profil member baru
      const ppUrl = await sock.profilePictureUrl(userJid, 'image');
      await sock.sendMessage(id, {
        image: { url: ppUrl },
        caption,
        mentions: mention.mentions  // ← JID target ada di sini → mention aktif
      });
    } catch {
      // Fallback: kirim teks biasa jika foto profil tidak tersedia
      await sock.sendMessage(id, {
        text: caption,
        mentions: mention.mentions  // ← tetap ada mentions meski teks biasa
      });
    }
  }
}

module.exports = { info, welcomeNewMembers };
