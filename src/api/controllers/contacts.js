'use stricts';
require('../models/contact');
var mongoose = require('mongoose'),
Contact = mongoose.model('Contact'),
async = require('async'),
_ = require('lodash');




module.exports = {
  save: function (req, res, next) {
      async.forEachOf(req.body, function (value, key, callback) {
        if (value.email) {
          var gnr = new Contact(value);
          var promise = gnr.save();
          promise.then(function (doc) {
            callback();
          });
        }
      }, function (err) {
        if (err) return res.send(err);
        res.send('contacts updated');
      });
   
  }
}
  
  
  
  
  
  
  
  