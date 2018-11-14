'use stricts';

require('../models/settings');

var mongoose = require('mongoose'),
  Settings = mongoose.model('Settings');

module.exports = {
  all: function(req, res, next) {

    Settings.find().exec((err, settings) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            settings: settings
            });
        }
    );
  },
  create: function(req, res, next) {
    Settings.update({key: req.body.key}, { $set: { value: req.body.value }}, {upsert: true, setDefaultsOnInsert: true}, ((err, setting)=> {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            setting: setting
            });
        })
    );
  },
  get: function(req, res, next) {
    Settings.findOne({key: req.params.key}).exec((err, setting) => {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            setting: setting
            });
        }
    );
  },
  update: function(req, res,next) {
    Settings.findOneAndUpdate({key: req.params.key}, { $set: { value: req.body.value }}, ((err, setting)=> {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            setting: setting
            });
        })
    );
  }
};