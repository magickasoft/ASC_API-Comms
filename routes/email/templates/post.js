'use strict';

/**
 * this is an action for the microservice
 */

// Modules loading
var statuses = require('statuses');
var mongoose = require('mongoose');

var EmailTemplate = null;

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:email:template:post`);

  return function(req, res) {
    EmailTemplate = EmailTemplate || mongoose.model('EmailTemplate');

    debug('Creating a new email template');

    // simple data validations
    // 0. check if body exists
    if (!req || !req.body) {
      return res.status(400).json({
        message: 'Body is missing',
        status: 400
      });
    }
    // 1. owner can create its email template only
    if (req.filterOwner) {
      var ownerKey = Object.keys(req.filterOwner)[0];
      if (!req.body[ownerKey]) { // autopopulate the field
        req.body[ownerKey] = req.filterOwner[ownerKey];
      } else if (req.body[ownerKey] !== req.filterOwner[ownerKey]) {
        return res.status(403).json(ACCESS_FORBIDDEN);
      }
    }
    // 2. body should have a name
    if (!req.body.name) {
      return res.status(400).json({
        message: 'The template name is required',
        status: 400
      });
    }

    EmailTemplate.create(req.body, function(err, emailTemplate) {
      if (err || !emailTemplate) {
        return res.status(500).json({
          message: err,
          status: 500
        });
      }

      emailTemplate = emailTemplate.toObject();

      return res.status(201).location('./' + emailTemplate._id.toString()).json(emailTemplate);
    });
  };
};


