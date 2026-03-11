const groupSettingsRepository = require('../../repositories/groupSettingsRepository');
const { formatDateTime } = require('../../utils/time');
const { normalizeJid } = require('../../utils/jid');
const { renderMentionText } = require('../../utils/messageFormatter');

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
    const created = meta.creation ? formatDateTime(new Date(Number(meta.creation) * 1000).toISOString()) : 'tidak diketahui';
    const adminCount = (meta.participants || []).filter((p) => p.admin === 'admin' || p.admin === 'superadmin').length;

    let invite = 'tidak tersedia';
    try {
      const code = await ctx.sock.groupInviteCode(ctx.from);
      if (code) invite = `https://chat.whatsapp.com/${code}`;
    } catch (error) {
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
    await ctx.send('❌ Gagal mengambil info grup. Coba lagi beberapa saat.');
  }
}

async function welcomeNewMembers(sock, update) {
  const { id, participants = [], action } = update;
  if (action !== 'add' || !id.endsWith('@g.us')) return;

  const setting = await groupSettingsRepository.get(id);
  if (!setting || Number(setting.welcome_enabled) !== 1) return;

  const meta = await sock.groupMetadata(id);
  const groupName = meta.subject || 'Group';

  for (const rawJid of participants) {
    const userJid = normalizeJid(rawJid);
    const textTemplate = setting.welcome_message ||
      'Halo @user\nSelamat datang di grup *{group}* ✨\n\nSemoga betah di sini, jangan lupa baca deskripsi grup dan ikuti aturan yang berlaku yaa.';

    const bodyRaw = textTemplate.replaceAll('{group}', groupName);
    const mention = renderMentionText(bodyRaw, userJid, 'user');
    const caption = `┏━━〔 👋 SELAMAT DATANG 〕━━┓\n┗━━━━━━━━━━━━━━━━━━━━┛\n\n${mention.text}`;

    try {
      const ppUrl = await sock.profilePictureUrl(userJid, 'image');
      await sock.sendMessage(id, { image: { url: ppUrl }, caption, mentions: mention.mentions });
    } catch {
      await sock.sendMessage(id, { text: caption, mentions: mention.mentions });
    }
  }
}

module.exports = { info, welcomeNewMembers };
