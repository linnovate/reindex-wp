'use strict';

var mongoose = require('mongoose'),
  Record = mongoose.model('Record'),
  elastic = require('../providers/elastic').getClient(),
  config = require('../config'),
  recordsIndex = config.records.index,
  recordsType = config.records.type,
  _ = require('lodash');

// var find = true;
var isEqual = true;
var actionKeys = {

};



var test = exports.test = function (find, objFind, cb) {

  actionKeys = {
    elastic: (find) ? 'search' : 'deleteByQuery',
    mongo: (find) ? 'find' : 'remove'
  };


  var data = {};
  findMongo(actionKeys, data, find, objFind).then(findElastic(actionKeys, data, find, objFind)).then(function (_data) {
    if (find) {
      if (_data.mongoCount !== _data.elasticCount) {
        isEqual = false;
      }
       cb(isEqual);
    }
     if (!find) {
          cb();
     }
    //   } else {
    //     _data.mongoIds.forEach(function (id) {
    //       console.log('rivka',id)
    //       if (_data.elasticIds.indexOf(id.toString()) === -1) {
    //         console.log(id, 'id is missing');
    //         isEqual = false;
    //       }
    //     });
    //     console.log('isEqual', isEqual);
    //     cb(isEqual);
    //   }
    // }
   
  }).catch((err) => console.log(err));
};

function findMongo(actionKeys, data, find, objFind) {
  var tmpObj = JSON.parse(JSON.stringify(objFind));
  if (objFind.cat) {
    delete tmpObj.cat;
  } 
  console.log('find in mongo', actionKeys, objFind)
  return new Promise(function (resolve, reject) {
    Record[actionKeys.mongo](tmpObj).exec(function (err, records) {
      if (err) return reject(err);
      if (find) {
        data.mongoCount = records.length;
        console.log(data.mongoCount, 'mongo----------')
        data.mongoIds = records.map((hit) => hit._id);
      } else data.mongoRes = records;
      resolve(data);
    });
  });
}

function findElastic(actionKeys, data, find, objFind) {
  return new Promise(function (resolve, reject) {


    var query = {
      bool: {
        must: [],
       should:[],
       minimum_should_match: 1
      }
    }

    query.bool.must.push({
      match: {
        listing_type_1: objFind.listing_type_1
      }
    });
    query.bool.must.push({
      match: {
        'address_city.notanalyzed': objFind.address_city
      }
    })
    if (objFind.listing_type_1 !== 1) {

      query.bool.should.push({
      match: {
        ['tags.plain']: {
          query: objFind.cat.replace(/['"]/gi, ''),
          operator: 'and'
        }
      }
    });
    query.bool.should.push({
      match: {
        ['tags.raw']: {
          query: objFind.cat,
          operator: 'and',
        }
      }
    });
     query.bool.should.push({
        term: {
          ['categories.raw']: objFind.cat,
          //  operator: 'or',
        }
      });
    }



    var body = {
      from: 0,
      size: 7000,
      query: query
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
          console.log(data.elasticCount, 'es===')
          data.elasticIds = response.hits.hits.map((hit) => hit._id);
        } else data.elasticRes = response;
        return resolve(data);
      }
    });


  });
}


