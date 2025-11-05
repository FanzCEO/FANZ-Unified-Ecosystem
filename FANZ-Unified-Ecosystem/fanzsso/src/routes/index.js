/**
 * FANZ SSO Routes Index
 * Main routing configuration for the SSO service
 */

const auth = require('./auth');
const profile = require('./profile');
const admin = require('./admin');

module.exports = {
  auth,
  profile,
  admin
};