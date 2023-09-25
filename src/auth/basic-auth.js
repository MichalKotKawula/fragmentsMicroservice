// src/auth/basic-auth.js

// Configure HTTP Basic Auth strategy for Passport, see:
// https://github.com/http-auth/http-auth-passport

const auth = require('http-auth');
const passport = require('passport');
const authPassport = require('http-auth-passport');

// We expect HTPASSWD_FILE to be defined.
// eslint-disable-next-line no-undef
if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

module.exports.strategy = () =>
  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  authPassport(
    auth.basic({
      // eslint-disable-next-line no-undef
      file: process.env.HTPASSWD_FILE,
    })
  );

module.exports.authenticate = () => passport.authenticate('http', { session: false });
