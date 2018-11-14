'use strict';

var mongoose = require('mongoose'),
  Record = mongoose.model('Record'),
  ElasticProvider = require('../providers/elastic'),
  //   Elastic = ElasticProvider.getClient(),
  Elastic = require('../controllers/elastic'),
  config = require('../config'),
  recordsIndex = config.records.index,
  recordsType = config.records.type,
  producer = require('../producers'),
  _ = require('lodash');


module.exports = function (message, error, done) {
 
  var d = new Date();
  var minutes = message.params.minutes || 15;
  d.setMinutes(d.getMinutes() - minutes);
  var data = {
    d: d
  };

  findMongo(data)
    .then(unsetRoutes)
    .then(updateMongo)
    .then(updateElastic).then(function (res) {
      console.log(res);
      done();
    }).catch(function (err) {
      console.log('CLEAN VIRTUAL NUMBERS ERR', err);
      error();
    });
};

function findMongo(data) {
  return new Promise(function (resolve, reject) {

    var query = {
      'virtual_number.created': {
        $lte: data.d
      },'constant_virtual_number':{$ne: true}
    };
    Record.find(query, {
      virtual_number: 1
    }).exec(function (err, results) {
      if (err) return reject(err);
      data.results = results;
      resolve(data);
    });
  });
}

function unsetRoutes(data) {
  return new Promise(function (resolve, reject) {
    data.results.forEach(function (res) {
      producer.createJob('unset-route-reindex', res);
    });
    resolve(data);
  });
}


function updateMongo(data) {
  return new Promise(function (resolve, reject) {

    var query = {
      //   'virtual_number.created': {
      //     $lte: data.d
      //   }
      _id: {
        $in: _.map(data.results, '_id')
      }
    };
    Record.update(query, {
      $unset: {
        virtual_number: 1
      },
    }, {
      multi: true
    }).exec(function (err, results) {
      if (err) return reject(err);
      data.mongoResults = results;
      resolve(data);
    });
  });
}

function updateElastic(data) {
  return new Promise(function (resolve, reject) {
    var search = {
      index: recordsIndex,
      type: recordsType,
      body: {
        from: 0,
        size: 1000,
        query: {
          bool: {
            must: [{
              range: {
                'virtual_number.created': {
                  lte: data.d,
                }
              }
            }],
            must_not: [{
                  "term": {
                      "constant_virtual_number": true
                  }
              }]
          }
        },
        script: {
          inline: "ctx._source.remove('virtual_number')"
        }
      }
    };

    Elastic.updateByQuery(search).then(function (results) {
      data.elasticResults = results;
      resolve(data);
    }, function (err) {
      reject(err);
    });
  });
}


