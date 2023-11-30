// src/auth/index.js
const logger = require('../logger');
// Prefer Amazon Cognito
// eslint-disable-next-line no-undef
if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  module.exports = require('./cognito');
  logger.info(`[Authorization strategy] Cognito`);
}
// Also allow for an .htpasswd file to be used, but not in production
// eslint-disable-next-line no-undef
else if (process.env.HTPASSWD_FILE && process.NODE_ENV !== 'production') {
  module.exports = require('./basic-auth');
  logger.info(`[Authorization strategy] Basic Auth`);
}
// In all other cases, we need to stop now and fix our config
else {
  throw new Error('missing env vars: no authorization configuration found');
}
