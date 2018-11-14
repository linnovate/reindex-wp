/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
Schema = mongoose.Schema;

var LandscapeSchema = new Schema({  
  record: {
    type: Schema.Types.ObjectId,
    ref: 'Record'
  },
  coords: {
    type: String
  },
  shape: {
    type: String,
    default: "rect"
  },
  title:{
    type:String
  }
}, {
collection: 'landscape'
});


mongoose.model('Landscape', LandscapeSchema);