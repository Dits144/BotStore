const pino = require('pino');
const config = require('./env');

module.exports = pino({ level: config.logLevel });
