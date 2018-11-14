'use stricts';

require('../models/landscape');

var mongoose = require('mongoose'),
  Landscape = mongoose.model('Landscape');

module.exports = {
  all: function(req, res, next) {

    Landscape.find().populate('record').exec((err, landscapes) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            landscapes: landscapes
            });
        }
    );
  },
  create: function(req, res, next) {
    const record = req.body.record;
    const coords = req.body.coords;

    const landscape = new Landscape({
        record,
        coords
    });

    landscape.save((err, landscape) => {
        console.log(err, landscape)
        if (err) {
            return next(err);
        }
        res.status(200).json({
            landscape: landscape
            });
        }
    );
  },
  get: function(req, res, next) {
    Landscape.findOne({_id: req.params.landscapeId}).populate('record').exec((err, landscape) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            landscape: landscape
            });
        }
    );
  },
  update: function(req, res,next) {
    Landscape.findOneAndUpdate({_id: req.params.landscapeId}, { $set: { coords: '4545,889,7978,544' }}, ((err, landscape)=> {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            landscape: landscape
            });
        })
    );
  }
};