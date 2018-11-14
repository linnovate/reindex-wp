'use strict';

var Score = require('../services/score'),
  _ = require('lodash');


function calc(req, res, next) {
  if (!req.body.rating || req.body.rating === null) return next();
  var options = req.body.rating,
    value = 0;
  options.forEach(function (o) {
    var r = _.find(Score, {
      key: o
    });
    if (!r) return;
    value += r.value;
  });
  req.updatedRecord = req.updatedRecord || {};
  req.updatedRecord.score = req.record.score || {};
  req.updatedRecord.score.value = value;
  req.updatedRecord.score.options = options;
  req.updatedRecord.score_value = value;
  next();
}

function get(req, res, next) {
  var score = _.map(Score, function (s) {
    return {
      key: s.key,
      name: s.name
    }
  });
  res.send(score);
}

module.exports = {
  calc: calc,
  get: get,
};
