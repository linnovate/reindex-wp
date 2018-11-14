'use strict';

var mongoose = require('mongoose'),
  Record = mongoose.model('RecordRequest'),
  elastic = require('../providers/elastic').getClient(),
  config = require('../config'),
  recordsIndex = config.records.index,
  recordsType = config.records.type,
  _ = require('lodash');

var find = true;
var isEqual = true;
var actionKeys = {
  elastic: (find) ? 'search' : 'deleteByQuery',
  mongo: (find) ? 'find' : 'remove'
};



var test = exports.test = function () {
  var data = {};
  findMongo(data).then(function (_data) {
    console.log(JSON.stringify(_data));
    // if (find) {
    //   _data.mongoIds.forEach(function (id) {
    //     if (_data.elasticIds.indexOf(id.toString()) === -1) {
    //       console.log(id, 'id is missing');
    //       isEqual = false;
    //     }
    //   });
    //   console.log('isEqual', isEqual);
    // }
  }).catch((err) => console.log(err));
};

function findMongo(data) {
  return new Promise(function (resolve, reject) {
    Record[actionKeys.mongo]({
      'data.tags': new RegExp(/גמ\"חים/gi)
    }).populate('record').exec(function (err, records) {
      if (err) return reject(err);
      if (find) {
        data.mongoCount = records.length;
        data.records = records;
        // data.mongoIds = records.map((hit) => {return {record: hit.record, name: hit.data.business_name}});
      } else data.mongoRes = records;
      resolve(data);
    });
  });
}

function findElastic(data) {
  return new Promise(function (resolve, reject) {
    var body = {
      from: 0,
      size: 7000,
      query: {
        match: {
          tags: {
            query: 'גמ\"חים',
          }
        }
      }
    };

    var search = {};
    search.type = recordsType;
    search.index = recordsIndex;
    search.body = body;

    elastic[actionKeys.elastic](search, function (error, response, status) {

      if (error) {
        return reject(error);
      } else {
        if (find) {
          data.elasticCount = response.hits.total;
          data.elasticIds = response.hits.hits.map((hit) => hit._id);
        } else data.elasticRes = response;
        return resolve(data);
      }
    });


  });
}

test();
