/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
Schema = mongoose.Schema;

var TooltipSchema = new Schema({  
  record: {
    type: Schema.Types.ObjectId,
    ref: 'Record'
  },
  coords: {
    type: Array
  },
  shape: {
    type: String,
    default: "rect"
  }
}, {
collection: 'tooltips'
});


mongoose.model('Tooltip', TooltipSchema);