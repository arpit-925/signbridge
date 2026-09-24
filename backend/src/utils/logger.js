const morgan = require('morgan');

const requestLogger = morgan((tokens, req, res) => {
  return [
    `[${new Date().toISOString()}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ');
});

const logger = {
  info: (msg, meta) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? meta : ''),
  warn: (msg, meta) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? meta : ''),
  error: (msg, meta) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta ? meta : ''),
};

module.exports = { requestLogger, logger };
