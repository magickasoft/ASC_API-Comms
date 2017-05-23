/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'comms'
};

var route = require('../../../routes/email/templates/get')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('../../lib/express-unit').run;
var setup = require('../../lib/express-unit-default-setup');
var util = require('util');


// loading mocked data
var newEmailTemplates = require('../../data/email_templates.json');

describe('comms-ms email template get handler', function() {
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

  it('should get all email templates', function(done) {

    var args = {
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var emailTemplates = res.json.mostRecentCall.args[0];
      expect(util.isArray(emailTemplates)).toBe(true);
      expect(createdEmailTemplates.length).toBe(emailTemplates.length);

      done();
    });
  });

  it('should get one email template', function(done) {

    var args = {
      params: {
        id: createdEmailTemplates[0]._id.toString()
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var emailTemplate = res.json.mostRecentCall.args[0];
      expect(util.isArray(emailTemplate)).toBe(false);
      expect(createdEmailTemplates[0]._id.toString()).toEqual(emailTemplate._id.toString());

      done();
    });
  });

  it('should select one email template', function(done) {

    var args = {
      query: {
        'name': createdEmailTemplates[0].name
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var emailTemplates = res.json.mostRecentCall.args[0];
      expect(util.isArray(emailTemplates)).toBe(true);
      expect(emailTemplates.length).toBe(1);
      expect(createdEmailTemplates[0]._id.toString()).toEqual(emailTemplates[0]._id.toString());

      done();
    });
  });

  it('should not select any email templates', function(done) {

    var args = {
      query: {
        'name': 'thisdoesnotexist'
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var emailTemplates = res.json.mostRecentCall.args[0];
      expect(util.isArray(emailTemplates)).toBe(true);
      expect(emailTemplates.length).toBe(0);

      done();
    });
  });

});
