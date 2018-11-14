/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  validator = require('validator'),
  isEmail = validator.isEmail;



var ContactSchema = new Schema({
 name: {
    type: String,
    // required: true,
  },
  phone: {
    type: String,
    // required: true
  },
  email: {
    type: String,
    validate: [isEmail, 'invalid email']
  },
}, {
  collection: 'contacts'
});


mongoose.model('Contact', ContactSchema);
