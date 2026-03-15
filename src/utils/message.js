function getMessageText(message = {}) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    message?.documentMessage?.caption ||
    message?.buttonsResponseMessage?.selectedButtonId ||
    message?.buttonsResponseMessage?.selectedDisplayText ||
    message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    message?.listResponseMessage?.title ||
    message?.templateButtonReplyMessage?.selectedId ||
    message?.templateButtonReplyMessage?.selectedDisplayText ||
    ''
  ).trim();
}

function isVoiceNote(message = {}) {
  return Boolean(message?.audioMessage?.ptt || message?.audioMessage);
}

module.exports = {
  getMessageText,
  isVoiceNote
};
