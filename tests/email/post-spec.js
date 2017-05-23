/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'comms',
  EMAIL_PREFIX: '',
  EMAIL_GENERIC_SENDER: 'asc@example.com'
};

// setup a mockedEmailTransport
var mockedEmailTransport = require('nodemailer-mock-transport')();
config.mail = mockedEmailTransport;

var route = require('../../routes/email/post')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('../lib/express-unit').run;
var setup = require('../lib/express-unit-default-setup');
var util = require('util');

// loading mocked data
var newEmailTemplates = require('../data/email_templates.json');

describe('comms-ms email post handler', function() {
  var createdEmailTemplates;

  beforeEach(function(done) {
    // reset the mocked transport stats
    mockedEmailTransport.sentMail.length = 0;
    mockgoose(mongoose).then(function() {
      mongoose.connect('mongodb://example.com/TestingDB', function(err) {
        // Load model
        require('../../models/email_templates')(config).then(function() {
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

  it('should post a "direct" text email', function(done) {

    var args = {
      body: {
        message: 'hi!',
        to: 'user1@example.com'
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(1);

      var email = mockedEmailTransport.sentMail[0].data;
      expect(email.to).toEqual(args.body.to);
      expect(email.text).toEqual(args.body.message);
      expect(email.subject).toBe('');
      expect(email.html).toBeUndefined();
      expect(email.from).toEqual(config.EMAIL_GENERIC_SENDER);

      done();
    });
  });

  it('should post a "direct" html email', function(done) {

    var args = {
      body: {
        message: '<html><body>hi!</body></html>',
        to: 'user1@example.com',
        messageType: 'html'
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(1);

      var email = mockedEmailTransport.sentMail[0].data;
      expect(email.to).toEqual(args.body.to);
      expect(email.text).toBeUndefined();
      expect(email.subject).toBe('');
      expect(email.html).toEqual(args.body.message);
      expect(email.from).toEqual(config.EMAIL_GENERIC_SENDER);

      done();
    });
  });

  it('should override the sender of a direct email', function(done) {

    var args = {
      body: {
        message: 'hi!',
        to: 'user1@example.com',
        from: 'user2@example.com'
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(1);

      var email = mockedEmailTransport.sentMail[0].data;
      expect(email.to).toEqual(args.body.to);
      expect(email.text).toEqual(args.body.message);
      expect(email.subject).toBe('');
      expect(email.from).toEqual(config.EMAIL_GENERIC_SENDER);
      expect(email.replyTo).toEqual(args.body.from);

      done();
    });
  });

  it('should use a template', function(done) {

    var args = {
      body: {
        templateName: createdEmailTemplates[0].name
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(1);

      var email = mockedEmailTransport.sentMail[0].data;
      expect(email.to).toEqual(createdEmailTemplates[0].to);
      expect(email.text).toEqual(createdEmailTemplates[0].message);
      expect(email.subject).toBe(createdEmailTemplates[0].subject);
      expect(email.from).toEqual(config.EMAIL_GENERIC_SENDER);
      expect(email.replyTo).toBe(createdEmailTemplates[0].from);

      done();
    });
  });

  it('should render a template', function(done) {
    var contemplate = require('contemplate').contemplate;

    var args = {
      body: {
        templateName: createdEmailTemplates[1].name,
        templateData: {
          name: 'test'
        }
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(1);

      var email = mockedEmailTransport.sentMail[0].data;
      expect(email.to).toEqual(createdEmailTemplates[1].to);
      expect(email.text).not.toEqual(createdEmailTemplates[1].message);
      expect(email.text).toEqual(contemplate(createdEmailTemplates[1].message, {data: args.body.templateData}));
      expect(email.subject).toBe(createdEmailTemplates[1].subject);
      expect(email.from).toEqual(config.EMAIL_GENERIC_SENDER);
      expect(email.replyTo).toBe(createdEmailTemplates[1].from);

      done();
    });
  });

  it('should forbid a request with no identity', function(done) {

    var args = {
      body: {
        templateName: createdEmailTemplates[0].name,
        templateData: {
          name: 'test'
        }
      },
      identity: null
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(0);

      done();
    });
  });

  it('should return an error if no template found', function(done) {

    var args = {
      body: {
        templateName: createdEmailTemplates[1].name + '_does_not_exist',
        templateData: {
          name: 'test'
        }
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(0);

      done();
    });
  });

  it('should return an error if neither a template or a message are passed', function(done) {

    var args = {
      body: {
        to: 'user1@example.com',
        templateData: {
          name: 'test'
        }
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(0);

      done();
    });
  });

  it('should not send an email without a recevier', function(done) {

    var args = {
      body: {
        message: 'hi!',
        to: '',
        from: 'user2@example.com'
      },
      identity: {}
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(mockedEmailTransport.sentMail.length).toEqual(0);

      done();
    });
  });

});
