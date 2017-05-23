/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'comms'
};

var route = require('../../../routes/email/templates/put')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('../../lib/express-unit').run;
var setup = require('../../lib/express-unit-default-setup');
var util = require('util');


// loading mocked data
var newEmailTemplates = require('../../data/email_templates.json');

describe('comms-ms email template put handler', function() {
  var createdEmailTemplates;

  beforeEach(function(done) {
    mockgoose(mongoose).then(function() {
      mongoose.connect('mongodb://example.com/TestingDB', function(err) {
        // Load model
        require('../../../models/email_templates')(config).then(function() {
          // Create some data
          mongoose.model('EmailTemplate').create(newEmailTemplates, function(err, results) {
            createdEmailTemplates = results;
            done(err);
          });
        });
      });
    });
  });

  afterEach(function(done) {
    mockgoose.reset(function() {
      mongoose.disconnect(function() {
        mongoose.unmock(function() {
          delete mongoose.models.EmailTemplate;
          done();
        });
      });
    });
  });

  it('should update an email template', function(done) {

    var update = {
      from: 'newemail@newaddress.com'
    };

    var args = {
      params: {
        id: createdEmailTemplates[0]._id.toString()
      },
      body: update
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var emailTemplate = res.json.mostRecentCall.args[0];
      expect(emailTemplate.from).toEqual(update.from);
      expect(emailTemplate._id.toString()).toEqual(createdEmailTemplates[0]._id.toString());

      done();
    });
  });


  it('should not update an email template name if it already exists', function(done) {

    var update = {
      name: createdEmailTemplates[1].name
    };

    var args = {
      params: {
        id: createdEmailTemplates[0]._id.toString()
      },
      body: update
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();

      var error = res.json.mostRecentCall.args[0];
      expect(error.status).toEqual(500);
      expect(error.message).toBeDefined();

      done();
    });
  });
});
