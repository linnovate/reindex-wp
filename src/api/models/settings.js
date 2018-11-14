/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
Schema = mongoose.Schema;

var SettingsSchema = new Schema({
  key: {
    type: String,
    require: true
  },
  value: {
    type: Object
  },
}, {
collection: 'settings'
});


mongoose.model('Settings', SettingsSchema);