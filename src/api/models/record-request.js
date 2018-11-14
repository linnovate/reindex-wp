/**
 * Module dependencies.
 */
require('./record');

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('lodash'),
  Elastic = require('../controllers/elastic'),
  config = require('../config'),
  validator = require('validator'),
  isEmail = validator.isEmail,
  Constants = require('../config/constants'),
  Record = mongoose.model('Record');


var RecordRequestSchema = new Schema({
  record: {
    type: Schema.Types.ObjectId,
    ref: 'Record'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sender: {
    fname: {
      type: String,
      required: true
    },
    lname: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      validate: [isEmail, 'invalid email']
    },
    phone: String
  },
  type: { // update or create
    type: String,
    required: true
  },
  data: {
    first_name: String,
    last_name: String,
    business_name: String,
    business_description: String,
    business_website: String,
    address_street_name: String,
    address_street_number: String,
    address_street_entrance: String,
    address_additional_info: String,
    address_neighborhood: String,
    address_city: String,
    phone: String,
    phone_2: String,
    phone_3: String,
    uk1: String,
    uk2: String,
    uk3: String,
    phone_landline: String,
    email: String,
    website: String,
    Timestamp_1: String,
    listing_type_2: Number,
    listing_type_1: {
      type: Number,
      default: 2
    },
    multipurpose1: String,
    empty_1: String,
    Empty_2: String,
    tags: String,
    categories: [String],
    is_deleted_checked: Boolean,
    reason_not_relevant: String,
    score_value: Number,
    logo: String,
    score: {
      options: [String],
      value: Number
    }
    },
  created: {
    type: Date,
    default: Date.now()
  },
  updated: {
    type: Date,
    default: Date.now()
  },
  approved: {
    val: {
      type: Boolean,
      default: false
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }
});

RecordRequestSchema.pre('save', function (next) {
  var data = this.data,
    record = this.record,
    err;

  if ((data[Constants.RECORD_MODEL_TYPE_FIELD] === Constants.PEOPLE_TYPE) && (!data.first_name || !data.last_name))
    return next(new Error('first_name or last_name are missing'));
  else if ((data[Constants.RECORD_MODEL_TYPE_FIELD] === Constants.BUSINESSES_TYPE) && (!data.business_name))
    return next(new Error('business_name is missing'));
  this.data.phone ? this.data.phone = this.data.phone.replace('-',''):null;
  this.data.phone_2 ? this.data.phone_2 = this.data.phone_2.replace('-',''):null;
  this.data.phone_3 ? this.data.phone_3 = this.data.phone_3.replace('-',''):null;
  this.updated = new Date();

  if (data.is_deleted_checked) {
    Record.findOneAndUpdate({
      _id: record
    }, {
      $set: {
        is_deleted_checked: true,
      }
    }).exec(function (err, result) {
      console.log('update record is_deleted_checked field', err, result);
    });
  }



  next();
});

mongoose.model('RecordRequest', RecordRequestSchema);
