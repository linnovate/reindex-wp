/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  timestamps = require("mongoose-times"),
  Schema = mongoose.Schema,
  _ = require('lodash'),
  Elastic = require('../controllers/elastic'),
  config = require('../config'),
  Constants = require('../config/constants');

var RecordSchema = new Schema({
  reindexId: String,
  reindexTitle: String,
  reindexDescription: String,
  reindexLocationString: String,
  reindexLocationPoints: [Number],
  reindexTags: String,
  created: {
    type: Date,
    default: Date.now()
  },
  updated: {
    type: Date,
    default: Date.now()
  },
  requests: [{
    type: Schema.Types.ObjectId,
    ref: 'RecordRequest'
  }]
}, {
  strict: false
});

RecordSchema.pre('save', function (next) {
  var data = this,
    err;

  if ((data[Constants.RECORD_MODEL_TYPE_FIELD] === Constants.PEOPLE_TYPE) && (!data.first_name || !data.last_name))
    return next(new Error('first_name or last_name are missing'));
  else if ((data[Constants.RECORD_MODEL_TYPE_FIELD] === Constants.BUSINESSES_TYPE) && (!data.business_name))
    return next(new Error('business_name is missing'));

  this.updated = new Date();
  next();
});

RecordSchema.post('save', function (doc) {
  var _doc = JSON.parse(JSON.stringify(doc));
  delete _doc._id;
  Elastic.index(config.records.index, config.records.type, doc._id.toString(), _doc).then(function (data) {}, function (error) {});
});

RecordSchema.plugin(timestamps);

mongoose.model('Record', RecordSchema);
