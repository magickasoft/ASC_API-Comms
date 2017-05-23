/* eslint no-invalid-this:0 */

'use strict';

/**
 * This file loads a model from a Swagger definition
 */

// Modules loading
var path = require('path');
var RefParser = require('json-schema-ref-parser');

exports = module.exports = function(config) {
  // this is the swagger file
  var SWAGGER_FILE = path.join(__dirname, `../swagger/api/${config.SRV_NAME}.yaml`);

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:model:EmailTemplate`);

  var collection = {};

  // loading schema definition from Swagger file
  var parser = new RefParser()
    .bundle(SWAGGER_FILE)
    .then(function(schema) {

      var crypto = require('crypto');
      var mongoose = require('mongoose');
      var EmailTemplate;

      var swaggerMongoose = require('swaggering-mongoose');

      // schemas and modules compilation
      var definitions = swaggerMongoose.getDefinitions(schema);
      var schemas = swaggerMongoose.getSchemas(definitions);
      var EmailTemplateSchema = schemas.EmailTemplate;

      // createdAt, updatedAt timestamps
      EmailTemplateSchema.set('timestamps', true);

      /**
       * Additional Mongoose Validations
       */

      EmailTemplateSchema.path('name').validate(function(value, done) {
        EmailTemplate = EmailTemplate || mongoose.model('EmailTemplate');
        // Check if it already exists
        EmailTemplate.count({
          name: value
        }, function(err, count) {
          if (err) {
            return done(err);
          }

          // If `count` is greater than zero, 'invalidate'
          return done(count === 0);
        });
      }, 'A template with the same name already exists');

      var models = collection.model = swaggerMongoose.getModels(schemas);

    }).catch(function(error) {
      debug('Parser error:', error);
    });

  // promisify
  collection.then = parser.then.bind(parser);
  collection.catch = parser.catch.bind(parser);
  return collection;

};
