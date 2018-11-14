'use stricts';

require('../models/tooltip');

var mongoose = require('mongoose'),
  Tooltips = mongoose.model('Tooltip');

module.exports = {
    
  all: function(req, res, next) { 
    Tooltips.find().populate('record','business_name business_description founder').exec((err, tooltips) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            tooltips: tooltips
            });
        }
    );
  },
  create: function(req, res, next) {
    const record = req.body.record;
    const coords = req.body.coords;
    const tooltips = new Tooltips({
        record,
        coords
    });

    tooltips.save((err, tooltips) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            tooltips: tooltips
            });
        }
    );
  },
  get: function(req, res, next) {
    Tooltips.findOne({_id: req.params.tooltipId}).populate('record').exec((err, tooltips) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            tooltips: tooltips
            });
        }
    );
  },
  update: function(req, res,next) {
    Tooltips.findOneAndUpdate({_id: req.params.tooltipId}, { $set: { coords: req.body.coords,record:req.body.record }}, ((err, tooltips)=> {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            tooltips: tooltips
            });
        })
    );
  },
  delete: function(req, res,next) { 
    Tooltips.remove({_id: req.params.tooltipId}, ((err, tooltips)=> {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            tooltips: tooltips
            });
        })
    );
  }
};