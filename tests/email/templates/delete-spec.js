/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'comms'
};

var route = require('../../../routes/email/templates/delete')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('../../lib/express-unit').run;
var setup = require('../../lib/express-unit-default-setup');
var util = require('util');


// loading mocked data
var newEmailTemplates = require('../../data/email_templates.json');

describe('comms-ms email template delete handler', function() {
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

  it('should remove an email template', function(done) {

    var args = {
      params: {
        id: createdEmailTemplates[0]._id.toString()
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalled();

      var emailTemplate = res.json.mostRecentCall.args[0];
      expect(util.isArray(emailTemplate)).toBe(false);
      expect(emailTemplate.status).toBe(204);

      // check the database
      mongoose.model('EmailTemplate').findById(args.params.id)
        .lean().exec(function(_err, dbResults) {
          expect(_err).toBeNull();
          expect(dbResults).toBeNull();

          // check if the other data are still there
          mongoose.model('EmailTemplate').find({_id: createdEmailTemplates[1]._id.toString()})
            .lean().exec(function(__err, _dbResults) {
              expect(__err).toBeNull();
              expect(_dbResults.length).toEqual(1);
              done();
            });
        });
    });
  });

});
