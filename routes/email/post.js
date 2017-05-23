'use strict';

/**
 * this is an action for the microservice
 */

// Modules loading
var statuses = require('statuses');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var contemplate = require('contemplate').contemplate;
var extend = require('../../lib/tools').extend;

var EmailTemplate = null;

var ACCESS_FORBIDDEN = {
  status: 403,
  message: statuses[403]
};

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:email:post`);

  var transporter = nodemailer.createTransport(config.mail);
  var sendMail = transporter.sendMail.bind(transporter);

  return function(req, res) {

    debug('Post a new email');

    // simple data validations
    // 0. check if body exists
    if (!req || !req.body) {
      return res.status(400).json({
        message: 'Body is missing',
        status: 400
      });
    }
    // 1. body should have a message or a templateName
    if ((!req.body.message && !req.body.templateName) || (req.body.message && req.body.templateName)) {
      return res.status(400).json({
        message: 'Mail message or template name are required',
        status: 400
      });
    }
    // 2. check if the to address exists
    if (req.body.message && !req.body.to) {
      return res.status(400).json({
        message: 'To address are required',
        status: 400
      });
    }
    // 3. check if it is an authenticated request
    if (!req.identity) {
      return res.status(403).json(ACCESS_FORBIDDEN);
    }

    var email = null;

    if (req.body.message) {
      // message could be sent right away
      email = extend({}, req.body);
      email.replyTo = req.body.from || req.identity && req.identity.email;
      email.subject = `${config.EMAIL_PREFIX && (config.EMAIL_PREFIX + ' ') || ''}${req.body.subject || ''}`;
      email.from = config.EMAIL_GENERIC_SENDER;
      email[(email.messageType || 'text')] = email.message;
      delete email.message;
      delete email.messageType;
      return sendMail(email, function(err) {
        if (err) {
          debug('sendMail error', err);
          return res.status(500).json({
            message: err,
            status: 500
          });
        }
        return res.status(202).json({
          message: 'Accepted',
          status: 202
        });
      });
    }

    // search the template & render the email
    EmailTemplate = EmailTemplate || mongoose.model('EmailTemplate');

    EmailTemplate.findOne({name: req.body.templateName}).lean().exec(function(err, template) {
      if (err) {
        return res.status(500).json({
          message: err,
          status: 500
        });
      }
      if (!template) {
        return res.status(404).json({
          message: `Template ${req.body.templateName} not found`,
          status: 404
        });
      }
      var templateData = {
        data: req.body.templateData || {},
        identity: req.identity || {},
        config: config
      };
      email = extend({}, template); // get a copy of the template
      for (var k in email) { // render every mail field
        if (k !== '_id' && email.hasOwnProperty(k) && email[k] && email[k].replace) {
          email[k] = contemplate(email[k], templateData);
        }
      }
      email.replyTo = email.from;
      email.from = config.EMAIL_GENERIC_SENDER;
      email[(email.messageType || 'text')] = email.message;
      delete email.message;
      delete email.messageType;
      return sendMail(email, function(err) {
        if (err) {
          debug('sendMail error', err);
          return res.status(500).json({
            message: err,
            status: 500
          });
        }
        return res.status(202).json({
          message: 'Accepted',
          status: 202
        });
      });
    });
  };
};


