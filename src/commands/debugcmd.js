function normalizePhone(input = '') {
  return input.replace(/[^0-9]/g, '');
}

function isOwner(sender) {
  const owner = normalizePhone(process.env.OWNER_NUMBER || '');
  const senderPhone = normalizePhone((sender || '').split('@')[0]);
  return Boolean(owner && senderPhone.endsWith(owner));
}

module.exports = {
  name: 'debugcmd',
  description: 'Owner-only command debug',
  async execute({ sock, jid, sender, runtime }) {
    if (!isOwner(sender)) {
      await sock.sendMessage(jid, { text: 'Khusus owner.' });
      return;
    }

    const text = [
      '🛠️ *Command Debug*',
      `Total: ${runtime?.totalCommands || 0}`,
      `Scheduler started: ${runtime?.schedulerStarted ? 'yes' : 'no'}`,
      `List: ${(runtime?.commands || []).join(', ') || '-'}`
    ].join('\n');

    await sock.sendMessage(jid, { text });
  }
};
