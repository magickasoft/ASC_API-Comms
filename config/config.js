'use strict';

/*
  this file explicits the default for configuration variables
 */

var config = {

  APP_PORT: process.env.APP_PORT || 3900,
  APP_HOST: process.env.APP_HOST || '0.0.0.0',
  SRV_NAME: process.env.SRV_NAME || 'comms',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_HOST: process.env.MONGODB_HOST || '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || 'ASC-SECRET',
  JWT_DURATION: (process.env.JWT_DURATION || 10 * 24 * 60 * 60) * 1000, // seconds,
  EMAIL_PREFIX: process.env.EMAIL_PREFIX || '[Action Sports Community]',
  EMAIL_GENERIC_SENDER: process.env.EMAIL_GENERIC_SENDER || 'noreply@asc.com'
};

config.MONGODB_NAME = process.env.MONGODB_NAME || config.SRV_NAME;

if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') { // development and test specific
  config.DEBUG = process.env.DEBUG = '*'; // forcing debug output
}

// Node mailer SENDGRID configuration
config.mail = require('nodemailer-sendgrid-transport')({
  auth: {
    api_user: process.env.SENDGRID_USERNAME || ' ',
    api_key: process.env.SENDGRID_PASSWORD || ' '
  }
});

exports = module.exports = config;
