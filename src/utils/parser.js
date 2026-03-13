const { PREFIX } = require('./constants');

function parseCommand(text = '') {
  if (!text || typeof text !== 'string') {
    return { isCommand: false, command: null, args: [], raw: '' };
  }

  const trimmed = text.trim();
  if (!trimmed.startsWith(PREFIX)) {
    return { isCommand: false, command: null, args: [], raw: trimmed };
  }

  const body = trimmed.slice(PREFIX.length).trim();
  const [command = '', ...args] = body.split(/\s+/);

  return {
    isCommand: Boolean(command),
    command: command.toLowerCase(),
    args,
    raw: trimmed
  };
}

module.exports = {
  parseCommand
};
