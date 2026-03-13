const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const localizedFormat = require('dayjs/plugin/localizedFormat');
require('dayjs/locale/id');
const config = require('../config/env');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.locale('id');

function nowJakarta() {
  return dayjs().tz(config.timezone);
}

function formatDateTime(value) {
  return dayjs(value).tz(config.timezone).format('DD MMMM YYYY HH:mm:ss');
}

function formatDate(value) {
  return dayjs(value).tz(config.timezone).format('DD MMMM YYYY');
}

function formatTime(value) {
  return dayjs(value).tz(config.timezone).format('HH:mm:ss');
}

module.exports = { dayjs, nowJakarta, formatDateTime, formatDate, formatTime };
