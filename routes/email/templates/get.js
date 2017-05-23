'use strict';

/**
 * this is a microservice action
 */

var mongoose = require('mongoose');

var EmailTemplate = null;

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:email:template:get`);

  return function(req, res) {
    EmailTemplate = EmailTemplate || mongoose.model('EmailTemplate');

    req.params = req.params || {};
    debug((req.params.id) ? `Get an email template by ID ${req.params.id}` : req.query && `Query email templates by ${require('util').inspect(req.query)}` || '');

    var query;
    if (req.filterOwner) { // owner based filtering
      debug('Filtering by', req.filterOwner);
      req.filterOwner.$and = [(req.params.id) ? { _id: req.params.id } : req.query ];
      query = (req.params.id) ? EmailTemplate.findOne(req.filterOwner) : EmailTemplate.find(req.filterOwner);
    } else {
      query = (req.params.id) ? EmailTemplate.findById(req.params.id) : EmailTemplate.find(req.query);
    }

    query.lean().exec(function(err, result) {
      if (err) {
        res.status(500).json({
          message: err,
          status: 500
        });
      } else {
        res.status(200).json(result);
      }
    });
  };
};
