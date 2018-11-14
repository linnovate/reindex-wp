'use strict';

var ElasticProvider = require('../providers/elastic');
var Elastic = ElasticProvider.getClient();


exports.bulk = function (data, cb) {

  Elastic.bulk({
    body: data
  }, function (err, response) {
    console.log('----------- ELASTIC BULK RESPONSE ---------------------');
    console[(err) ? 'error' : 'log']('ELASTIC BULK RESPONSE ERROR: ' + err);
    if (response && response.errors) {
      response.items.forEach(function (item) {
        if (item.index.status !== 201) console.log(JSON.stringify(item));
      });
    }
    console.log('--------------------------------------------------');
    cb(err);
  });
};


exports.updateByQuery = function (data) {
  return new Promise(function (done, error) {
    Elastic.updateByQuery(data, function (err, results) {
      if (err) return error(err);
      done(results);
    });
  });
};

exports.index = function (index, type, id, data, parent) {

  var options = {
    index: index,
    type: type,
    body: data,
  };

  console.log('******** IN ELASTIC.CREATE ***********', options);

  if (id) options.id = id;
  if (parent) options.parent = parent;

  return new Promise(function (done, error) {
    Elastic.index(options, function (err, response) {
      console.log('----------- ELASTIC RESPONSE ---------------------');
      console[(err) ? 'error' : 'log']('ELASTIC CREATE ERROR: ' + err);
      console.log('response: ' + response);
      if (err) return error(err);
      console.log('--------------------------------------------------');
      done(response);
    });
  });
};

exports.findById = function (index, type, id, routing) {
  return new Promise(function (done, error) {
    var query = {
      index,
      type,
      id
    };
    if (!type) query.type = '_all';
    if (routing) query['routing'] = routing;

    Elastic.get(query, function (err, res) {
      if (err) return error(err);
      done(res);
    });
  });
}

exports.delete = function (index, type, id, routing) {
  return new Promise(function (done, error) {
    var query = {
      index,
      type,
      id
    };
    if (routing) query['routing'] = routing;
    Elastic.delete(query, function (err, res) {
      if (err) return error(err);
      done(res);
    });
  });
};

exports.count = function (index, type) {
  return new Promise(function (done, error) {
    Elastic.count({
      index: index
    }, function (error, response) {
      if (error) return error(error);
      done(response.count);
    });
  });
};
