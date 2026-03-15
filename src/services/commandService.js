const fs = require('fs');
const path = require('path');

function loadCommands() {
  const commands = {};
  const aliases = {};
  const commandsDir = path.join(__dirname, '..', 'commands');
  const files = fs.readdirSync(commandsDir).filter((file) => file.endsWith('.js'));

  for (const file of files) {
    const cmd = require(path.join(commandsDir, file));
    if (!cmd?.name || typeof cmd.execute !== 'function') {
      // skip invalid modules safely
      continue;
    }

    const name = cmd.name.toLowerCase();
    commands[name] = cmd;

    for (const alias of cmd.aliases || []) {
      aliases[String(alias).toLowerCase()] = name;
    }
  }

  return {
    commands,
    aliases,
    totalCommands: Object.keys(commands).length
  };
}

module.exports = {
  loadCommands
};
