/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'comms'
};

var route = require('../../../routes/email/templates/post')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('../../lib/express-unit').run;
var setup = require('../../lib/express-unit-default-setup');
var util = require('util');
var async = require('async');

// loading mocked data
var newEmailTemplates = require('../../data/email_templates.json');

describe('comms-ms email template post handler', function() {

  beforeEach(function(done) {
    mockgoose(mongoose).then(function() {
      mongoose.connect('mongodb://example.com/TestingDB', function(err) {
        require('../../../models/email_templates')(config).then(done).catch(done);
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

  it('should create a new email template', function(done) {

    var args = {
      body: newEmailTemplates[0]
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).toHaveBeenCalled();

      var emailTemplate = res.json.mostRecentCall.args[0];
      expect(emailTemplate.from).toEqual(newEmailTemplates[0].from);
      expect(emailTemplate.name.toString()).toEqual(newEmailTemplates[0].name);
      done();
    });
  });

  it('should create multiple email templates', function(done) {

    async.map(newEmailTemplates, function(newEmailTemplate, cb) {
      var args = {
        body: newEmailTemplate
      };

      run(setup(args), route, function(err, req, res) {
        expect(err).toBeNull();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
        expect(res.location).toHaveBeenCalled();

        var emailTemplate = res.json.mostRecentCall.args[0];
        expect(emailTemplate.name).toEqual(newEmailTemplate.name);
        cb(null, emailTemplate);
      });
    }, function(err, results) {
      expect(err).toBeNull();
      expect(results.length).toEqual(newEmailTemplates.length);
      var emailTemplate = results[1];
      expect(emailTemplate.name).toEqual(newEmailTemplates[1].name);
      done(err);
    });
  });

  it('should not create two email templates with the same name', function(done) {
    var emailTemplateTwins = [{
      'from': 'user1@example.com',
      'to': 'user2@example.com',
      'message': 'hey!',
      'name': 'test template'
    }, {
      'from': 'user2@example.com',
      'to': 'user1@example.com',
      'message': 'hey!',
      'name': 'test template'
    }];

    async.mapSeries(emailTemplateTwins, function(newEmailTemplate, cb) {
      var args = {
        body: newEmailTemplate
      };

      run(setup(args), route, function(err, req, res) {
        var status = res.status.mostRecentCall.args[0];
        if (status === 500) { // this is an error
          return cb(res.json.mostRecentCall.args[0]);
        }
        return cb(null, res.json.mostRecentCall.args[0]);
      });
    }, function(err, results) {
      expect(err).toBeDefined();
      var emailTemplates = results.filter(function(res) {
        return res;
      });
      expect(emailTemplates.length).toEqual(1);

      // check the database
      mongoose.model('EmailTemplate').find({
        name: emailTemplateTwins[0].name
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(1);
        done();
      });

    });
  });

  it('should not accept request with no data', function(done) {

    var args = {
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).not.toHaveBeenCalled();

      // check the database
      mongoose.model('EmailTemplate').find({
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(0);
        done();
      });
    });
  });

  it('should not create a new email template with no name', function(done) {

    var args = {
      body: {
        'from': 'user2@example.com',
        'to': 'user1@example.com',
        'message': 'hey!',
        'name': ''
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).not.toHaveBeenCalled();

      // check the database
      mongoose.model('EmailTemplate').find({
        from: args.body.from
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(0);
        done();
      });
    });
  });

});
