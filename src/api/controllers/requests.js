'use strict';

require('../models/record-request');

var Elastic = require('../controllers/elastic'),
  mongoose = require('mongoose'),
  RecordRequest = mongoose.model('RecordRequest'),
  _ = require('lodash'),
  messages = require('../config/messages'),
  recordsCtrl = require('./records')(),
  uneditableFields = ['_id', '__v', 'created', 'updated', 'score_value' , 'score'];

function createRequest(data) {
  uneditableFields.forEach(function (field) {
    delete data[field];
  });
  return new Promise(function (done, error) {
    var recordRequest = new RecordRequest(data);
    recordRequest.data = data;
    recordRequest.save(function (err, doc) {
        if (err) return error(err);
        done(doc);
      });
    });
  }


function update(req, res) {
  var request = req.body;
  request.record = req.record;
  request.type = 'update';
  createRequest(request)
    .then(saveRecordRequests)
    .then(function (data) {
      res.send(messages.successes.createRequest);
    }, function (err) {
      res.status(400).send(messages.errors.createRequest);
    });
}

function saveRecordRequests(request) {
  return new Promise(function (done, error) {
    var record = request.record;
    record.requests.push(request);
    record.save(function (err, doc) {
      if (err) return error(err);
      done(doc);
    });
  });
}

function create(req, res) {
  var request = req.body;
  request.type = 'create';
  createRequest(request)
    .then(function (data) {
      res.send(messages.successes.createRequest);
    }, function (err) {
      res.status(400).send(messages.errors.createRequest);
    });
}

function approve(req, res) {
  var request = req.request;
  recordsCtrl[request.type](request).then(function (data) {
    request.approved.val = true;
    // request.approved.by = 'admin';
    request.save(function (err, doc) {
      console.log('approve request err', err);
      if (err) return res.status(400).send(messages.errors.createRequest);
      res.send(messages.successes.createRequest);
    });
  }, function (error) {
    console.log('approve request err', error);
    return res.status(400).send(messages.errors.createRequest);
  });
}

function request(req, res, next) {
  RecordRequest.findOne({
    _id: req.params.requestId
  }).then(function (request) {
    if (!request) return res.status(400).send('request isn\'t found');
    req.request = request;
    next();
  }).catch(function (err) {
    return res.status(500).send(err);
  });
}

function find(req, res) {
  RecordRequest.find({
    'approved.val': false
  }).sort({
    updated: 1
  }).populate('record').then(function (requests) {
    res.send(requests)
  }, function (err) {
    res.status(500).send(err);
  });
}

function _delete(req, res) {
  req.request.remove(function (err) {
    if (err) return res.status(500).send(messages.errors.createRequest);
    res.send(messages.successes.createRequest);
  });
}

function findOne(req, res) {
  return res.send(req.request);
}

function updateRequest(req, res) {
  var request = req.request,
    data = req.body;
  request.data = _.extend(request.data, data);
  request.save(function (err, r) {
    if (err) return res.status(500).send(err);
    res.send(r);
  });
}

module.exports = function RequestsActions(params) {
  return {
    request: request,
    update: update,
    create: create,
    approve: approve,
    find: find,
    delete: _delete,
    findOne: findOne,
    updateRequest: updateRequest,
  }
};
