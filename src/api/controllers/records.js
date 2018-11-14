'use strict';

require('../models/record');

var Elastic = require('../controllers/elastic'),
esClientCtrl = require('./esClient'),
mongoose = require('mongoose'),
Record = mongoose.model('Record'),
_ = require('lodash'),
messages = require('../config/messages'),
config = require('../config'),
recordsIndex = config.records.index,
hierarchyCategoriesIndex = config.hierarchyCategories.index,
payCallCtrl = require('./paycall'),
NodeGeocoder = require('node-geocoder'),
config = require('../config'),
options = config.gepCoderOptions,
geocoder = NodeGeocoder(options);


function updateMongoCategories(data) {
  data.action = data.action || 'add'; // action = add or remove
  var by = data.updateBy || 'ids';
  var ids, query = {},
  update = {},
  updateTerm = data.action === 'add' ? '$addToSet' : '$pullAll';
  if (data.action == 'add')
   updateTerm = '$addToSet';
  else if (data.action == 'remove')
          updateTerm = '$pullAll';
        else if (data.action == 'score')
               updateTerm = '$set';
  return new Promise(function (done, error) {
    if (by === 'ids') {
      ids = data.data.map(function (obj) {
        return obj._id;
      });
      query = {
        _id: {
          $in: ids
        }
      };
      if( data.action != 'score')
        update = {
          [updateTerm]: {
            categories: {}
          }
        };
      if (data.action === 'add') update[updateTerm].categories.$each = data.categories;
      else if (data.action === 'remove') update[updateTerm].categories = data.categories;
      else if (data.action === 'score') {
        let score = {options: ['last'],value: -999}
        update = {
          ['$set']: {
            'score':score,
            'score_value': -999
          }
        }
      }
      Record.update(query, update, {
        multi: true ,upsert: true
      }).exec(function (err, res) {
        console.log('mongo error', err);
        if (err) return error(err);
        console.log('mongo res', res);
        data.mongoRes = res;
        return done(data);
      });
      
    } else {
      query = {
        categories: {
          $all: data.oldCategories
        }
      }
      update = [{
        $pullAll: {
          categories: data.oldCategories
        }
      }, {
        $addToSet: {
          categories: {
            $each: data.newCategories
          }
        }
      }]
      Record.find(query, {
        _id: 1
      }).exec(function (err, records) {
        if (err) return error(err);
        var ids = _.map(records, '_id');
        query = {
          _id: {
            $in: ids
          }
        };
        var bulk = Record.collection.initializeOrderedBulkOp();
        bulk.find(query).update(update[0]);
        bulk.find(query).update(update[1]);
        bulk.execute(function (err, res) {
          console.log('updateMongoCategories error', err);
          if (err) return error(err);
          console.log('updateMongoCategories res', res);
          data.mongoRes = res;
          return done(data);
        });
      });
    }
  });
}

function updateElastiCategories(data) {
  data.action = data.action || 'add';
  var by = data.updateBy || 'ids',
  updateTerm = data.action === 'add' ? '+' : '-';
  return new Promise(function (done, error) {
    if (by === 'ids' && data.action !== 'score') {
      data.searchObj.body.script = {
        inline: `ctx._source.categories = ctx._source.categories ${updateTerm} categories; ctx._source.categories.unique();`,
        params: {
          categories: data.categories
        }
      };
    }
    if (data.action == 'score') {
      data.searchObj.body.script = {
        inline: `if (!ctx._source.score_value) {ctx._source.score = score;ctx._source.score_value = score_value;}`,
        params: {
         score:{options: ['last'],value: -999 },
         score_value: -999
        }
      };
    }
    data.searchObj.index = data.searchObj.index || recordsIndex;
    Elastic.updateByQuery(data.searchObj).then(function (results) {
      data.esRes = results;
      console.log('updateElastiCategories res', results);
      return done(data);
    }, function (err) {
      console.log('updateElastiCategories err', err);
      return error(err);
    });
  });
}

function connect2category(req, res) {
  var data = {};
  req.query.limit = 3000;
  var categories = req.body.categories || [],
  action = req.query.action || 'add';
  if (['add', 'remove','score'].indexOf(action) == -1) return res.status(400).send('Action parameter could be add or remove category');
  categories = _.uniq(categories);
  data.categories = categories;
  esClientCtrl.searchResultsQuery(req.body.value, req.query, req.body)
  .then(function (searchObj) {
    data.searchObj = searchObj;
    esClientCtrl._getDataResults(data.searchObj)
    .then(function (_data) {
      data.data = _data.hits;
      data.action = action;
      updateMongoCategories(data)
      .then(updateElastiCategories).then(function (results) {
        res.send(messages.successes.createRequest);
      }, function (error) {
        console.log(error);
        return res.status(500).send(error);
      });
    }, function (error) {
      return res.status(500).send(error);
    });
  }, function (err) {
    res.status(500).send(err);
  });
}


function updateResultsCategory(data) {
  return new Promise(function (resolve, reject) {
    var ids = data.map(function (o) {
      return o._id;
    });
  });
}

function _record(id) {
  return new Promise(function (done, error) {
    Record.findOne({
      _id: id
    }).then(function (__record) {
      if (!__record) return error('record isn\'t found');
      done(__record);
    }).catch(function (err) {
      error(err);
    });
  });
}
function record(req, res, next) {
  _record(req.params.recordId).then(function (data) {
    req.record = data;
    next();
  }, function (err) {
    return res.status(500).send(err);
  });
}
function records(req, res, next) {//yehudit
  Record.find().select('business_name').then(function (data) {
    return res.json(data);
  }, function (err) {
    return res.status(500).send(err);
  });
}
function checkAddress(record) {
  return new Promise(function (resolve, reject) {
    var address;
    if (!record.address_city) resolve('err');
    if (record.address_city) {
      address = record.address_city;
      if (record.address_street_name)
      address += ' , ' + record.address_street_name;
      if (record.address_street_number)
      address += ' , ' + record.address_street_number;
    }
    geocoder.geocode({ address }, function (err, data) {
      if (err) return resolve('err');
      if (data) {
        var geo = data[0];
        if (geo) {
          var location = [geo.longitude, geo.latitude];
          return resolve(location);
        }
        else resolve('err');
      } else resolve('err');
    });
  });
}


function findOne(req, res) {
  return res.json(req.record);
}

// admin update record
function updateRecord(req , res){
  var data = req.body;
  Record.findOne({
    _id: data._id
  }).then(function (record) {
    if (!record) res.send('record isn\'t found');
    _.forEach(data, function(value, key) {
      record.set(key, value);
    });
    record.reindexLocationPoints = data.reindexLocationPoints || [];
    record.save(function (err, r) {
     if (err) return res.send(messages.errors.createRequest);
     res.send(messages.successes.createRequest);
  });
  })
}

//update record from request record
function update(data) {
  return new Promise(function (done, error) {
    _record(data.record).then(function (__record) {
      data = data.toObject();
      __record = _.extend(__record, data.data);
      if (__record.is_deleted_checked) __record.is_deleted = true;
      checkAddress(__record).then(function (res) {
        if (res !== 'err')
        __record.location = res;
        __record.latitude  =  res[1]
        __record.longitude =  res[0];
        __record.save(function (err, r) {
          if (err) return error(err);
          done(r);
        });
      }, function (err) {
        return error(err);
      });
    });
  });
  
}

function create(data) {
  data = data.data.toObject();
  return new Promise(function (done, error) {
    var record = new Record(data);
    checkAddress(record).then(function (res) {
      if (res !== 'err')
      record.location = res;
      record.save(function (err, r) {
        if (err) return error(err);
        done(r);
      });
    }, function (err) {
      return error(err);
    });
  });
}

function setVirtualNumber(req, res, next) {
  var record = req.record;
  var phone = record.phone_2 || record.phone;
  if (!phone) return res.send({
    msg: 'Real phone number is missing',
    successes: false,
    number: '',
    recordId: record._id,
  });
  if (record.virtual_number && record.virtual_number.value) return res.send({
    msg: 'Virtual phone number exists',
    successes: false,
    number: record.virtual_number.value,
    recordId: record._id,
  });
  phone = phone.toString();
  phone = phone.replace(' ', '');
  if (phone.indexOf('|') > -1) {
    phone = phone.split('|')[0]
  }
  var first = phone.charAt(0);
  if (['*', '0', '1'].indexOf(first) === -1) phone = '0' + phone;
  phone = phone.replace('-', '');
  if (phone.length < 9) return res.send({
    number: phone,
    virtual: false,
    successes: false,
    recordId: record._id,
  });
  
  var data = {
    rtpn: phone,
    fname: (req.record.listing_type_1 === 1) ? record.first_name : record.business_name,
    lname: (req.record.listing_type_1 === 1) ? record.last_name : '',
    assignDdi: 1,
  };
  payCallCtrl.addRoute(data).then(function (_data) {
    record.virtual_number = {
      value: `${_data.Ddi}`,
      created: new Date(),
      id: `${_data.Id}`,
      rtpn: phone,
    };
    record.save(function (err, doc) {
      res.send({
        number: record.virtual_number.value,
        virtual: true,
        successes: true,
        recordId: record._id,
      })
    });
  }).catch(function (error) {
    console.log('setVirtualNumberError', error);
    // res.status(500).send(error);
    res.send({
      number: phone,
      virtual: false,
      successes: false,
      recordId: record._id,
    })
  });
};

function updateSettings(req, res, next) {
  var record = req.record;
  record = _.extend(record, req.updatedRecord);
  record.constant_virtual_number = req.body.constant_virtual_number;
  record.save(function (err, doc) {
  if (err) {
      console.error(err);
      return res.status(500).send(messages.errors.createRequest);
    }
    res.send(messages.successes.createRequest);
  });
}

module.exports = function RecordsActions(params) {
  return {
    connect2category: connect2category,
    findOne: findOne,
    record: record,
    records:records,
    update: update,
    create: create,
    updateRecord: updateRecord,
    setVirtualNumber: setVirtualNumber,
    updateSettings: updateSettings,
    updateMongoCategories: updateMongoCategories,
    updateElastiCategories: updateElastiCategories,
  }
};

