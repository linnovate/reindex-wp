'use strict';

var ElasticProvider = require('../providers/elastic');
var _client = ElasticProvider.getClient(),
config = require('../config'),
recordsIndex = config.records.index,
recordsType = config.records.type,
Constants = require('../config/constants'),
categoriesCtrl = require('./categories')(),
categoriesAlias = require('../config/categories.json'),
ElasticCtrl = require('./elastic'),
hierarchyCategoriesIndex = config.hierarchyCategories.index,
categoriesFilters = config.categoriesFilters,
async = require('async'),
_ = require('lodash');
try {
  var customSearch = require('./../custom/search');
} catch (ex) {
  var customSearch = {};
}

module.exports.getDataByTerm = function (req, res, next) {
  const fields = (req.body.term) ? [req.body.term] : ['content.ac', 'reindexTitle.ac'];
  var body = {
    from: 0,
    size: 100,
    query: {
      multi_match: {
        query: req.body.value,
        fields: fields
      }
    }
    /* ,
    sort: {
      'content.raw': {
        order: 'asc'
      }
    } */
  };
  
  var search = {};
  if (req.body.type) search.type = req.body.type;
  search.index = req.body.index || req.query.index || [recordsIndex, hierarchyCategoriesIndex];
  search.body = body;
  
  _client.search(search, function (error, response, status) {
    if (error) {
      console.log("search error: " + error);
      next(error);
    } else {
      if (req.query.children && response.hits.hits.length) {
        req.query.routing = response.hits.hits[0]._id;
        return next();
      }
      res.send(response.hits.hits);
    }
  });
};

var searchQuery = _.extend({
  ids: function (data) {
    data.body.query.bool.must.push({
      ids: {
        values: data.ids
      }
    });
  },
  exceptIds: function (data) {
    data.body.query.bool.must_not.push({
      ids: {
        values: data.exceptIds
      }
    });
    return data.body;
  },
  ['is_deleted']: function (data) {
    data.body.query.bool.must.push({
      bool: {
        should: [{
          term: {
            is_deleted: false
          }
        }, {
          bool: {
            must_not: {
              exists: {
                field: 'is_deleted'
              }
            }
          }
        }],
        minimum_should_match: 1,
      }
    });
    return data.body;
  },
  GPS: function (data) {
    
    var lat = data.lat;
    var lon = data.lon;
    if (data.distance) {
      data.body.query.bool.must.push({
          "geo_distance":{
            "distance": data.distance+"km",
            "reindexLocationPoints": {
              "lat" : lat,			
              "lon": lon
            }
        }
      });
    }
    // data.body.sort.push({
    //   _script: {
    //     type: 'number',
    //    script: {
    //       // inline: "if (_source.score) return _source['score'].value * Math.min(1 + (Math.random() * (1.01 - 1)), 1.01); else return 0;",
    //       inline: "if (doc['score_value']) return doc['score_value'].value * Math.min(1 + (Math.random() * (1.01 - 1)), 1.01); else return 0;",
    //     },
    //     order: 'desc'
    //   },
    // })
    data.body.sort.push({
      "_geo_distance": {
        "reindexLocationPoints": {
          "lat" : lat,
          "lon": lon
        },
        "order": "asc",
        "unit": "km",
        "distance_type": "plane"
      }
    });
    data.body.sort.push({
      _score: {
        order: 'desc'
      }
    })
    return data.body;
  },
  city: function (data) {
    var city = data.query.city;
    city = city.replace(/-/g, ' ');
    data.body.query.bool.must.push({
      match: {
        'address_city.notanalyzed': city
      }
    });
    return data.body;
  },
  score: function (data) {
    // data.body.track_scores = true;
    
    // data.body.sort.push({
    //     _script: {
    //       type: 'number',
    //       script: {
    //         // inline: "if (_source.score) return _source['score'].value * Math.min(1 + (Math.random() * (1.01 - 1)), 1.01); else return 0;",
    //         inline: "if (doc['score_value']) return doc['score_value'].value * Math.min(1 + (Math.random() * (1.01 - 1)), 1.01); else return 0;",
    //       },
    //       order: 'desc'
    //     },
    //   })
    data.body.sort.push({
      _score: {
        order: 'desc'
      }
    })
    return data.body;
  },
  phone: function (data) {
    var phone = data.query.phone || data.valuesString;
    if (!phone) return data.body;
    if (!/^(\d+-?)+\d+$/.test(phone)) return data.body;
    if (phone.charAt(0) === '0') phone = phone.substr(1);
    data.body.query.bool.should.push({
      query_string: {
        query: phone + ' 0' + phone,
        fields: [
          'phone*'
        ]
      }
    });
    return data.body;
  },
  people: function (data) {     
    // it is better in index time to index first_name + last_name to full_name fieels, and then use regular match query
    //https://www.elastic.co/blog/multi-field-search-just-got-better
    data.body.query.bool.should.push({
      // multi_match: {
      //   query: data.valuesString.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ''),
      //   fields: ['first_name', 'last_name'],
      //   type: 'cross_fields',
      // }
      match: {
        full_name: {
          query: data.valuesString.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ''),
        }
      }
    });
    data.body.query.bool.should.push({
      "regexp":{
        ["full_name.notanalyzed"]: {
          "value":data.valuesString+".*?+",
          "flags" : "EMPTY"
        }
      }
    }) 
    return data.body;
  },
  records: function (data) {
    for (var i in config.searchQuery.records.default.match) {
      data.body.query.bool.should.push({
        match: {
          [config.searchQuery.records.default.match[i]]: {
            query: data.valuesString,
            operator: 'and',
            //fuzziness: '1' // with it - nofesh gives nefesh
          }
        }
      });
    }
    data.valuesString = data.valuesString.replace(/['"]/gi, '');
    for (var i in config.searchQuery.records.default.regexp) {
      data.body.query.bool.should.push({
        "regexp":{
          [config.searchQuery.records.default.regexp[i]]: {
            "value": data.valuesString+".*?+",
            "flags" : "EMPTY"
          }
        }
      });
    }
    
    
    if (!data.onlyCategoriesFilter) {
      for (var i in config.searchQuery.records.notOnlyCategoriesFilter.plain) {
        data.body.query.bool.should.push({
          match: {
            [config.searchQuery.records.notOnlyCategoriesFilter.plain[i]+'.plain']: {
              query: data.valuesString.replace(/['"]/gi, ''),
              operator: 'and',
              //fuzziness: '1' // with it - nofesh gives nefesh
            }
          }
        });
      }
      for (var i in config.searchQuery.records.notOnlyCategoriesFilter.plain) {
        data.body.query.bool.should.push({
          match: {
            [config.searchQuery.records.notOnlyCategoriesFilter.match[i]]: {
              query: data.valuesString,
              operator: 'and',
              //fuzziness: '1' // with it - nofesh gives nefesh
            }
          }
        });
      }
    }
    // var categoriesBool = {
    //   bool: {
    //     must: []
    //   }
    // };
    // data.values.forEach(function (v) {
    //   categoriesBool.bool.must.push({
    //     term: {
    //       ['categories']: v
    //     }
    //   });
    // });
    // data.body.query.bool.should.push(categoriesBool);
    return data.body;
  },
  sortBy: function (data) {
    if (data.query.sortBy !== 'name') return data.body;
    var order = data.query.order || 'asc';
    if (['asc', 'desc'].indexOf(order) === -1) {
      console.log(`sort ${sort} is not allowed`);
      return data.body;
    }
    data.body.sort = (data.type === 'people') ? {
      'full_name.notanalyzed': {
        order: order
      }
    } : {
      'raw.title.notanalyzed': {
        order: order
      }
    }
    return data.body;
  }
}, customSearch);

function checkCategoryFilter(value, query) {
  return new Promise(function (resolve, reject) {
    async.forEachOf(query, function (val, key, callback) {
      if (categoriesFilters.indexOf(key) === -1) return callback();
      var type = val.split('-T-')[0];
      var id = val.split('-T-')[1];
      categoriesCtrl.getAllParents(id, [], function (err, categories) {
        if (err) return callback(value);
        value = value.concat(categories);
        callback();
      }, type);
    }, function (err) {
      if (err) return resolve();
      resolve(_.uniq(value));
    });
  });
}


var searchResultsQuery = exports.searchResultsQuery = function (value, query, _body) {
  _body = _body || {};
  return new Promise(function (resolve, reject) {
    var limit = query.limit || 50,
    offset = query.offset || 1,
    from = limit * (offset - 1),
    data = {},
    search = {
      index: recordsIndex,
      type: recordsType
    },
    body = {
      size: limit,
      from: from,
      query: {
        bool: {
          should: [],
          must: [],
          must_not: [],
          minimum_should_match: 1
        }
      },
      track_scores: true,
      sort: [
        //   {
        //   _script: {
        //     type: 'number',
        //     script: {
        //       // inline: "if (_source.score) return _source['score'].value * Math.min(1 + (Math.random() * (1.01 - 1)), 1.01); else return 0;",
        //       inline: "if (doc['score_value']) return doc['score_value'].value * Math.min(1 + (Math.random() * (1.01 - 1)), 1.01); else return 0;",
        //     },
        //     order: 'desc'
        //   }
        // }, {
        //   _score: {
        //     order: 'desc'
        //   }
        // }
      ]
    };

    // data.types = query.type.split(',');
    // data.types = data.types.map(function (t) {
    //   return parseInt(t);
    // });
    value = value.map((str) => str ? str.replace('?', '') : '');
    checkCategoryFilter(value, query).then(function (categories) {
      if (categories) {
        data.values = categories; 
      }
      else data.values = value;
      // var categoriesList = [categoriesAlias];
      // var tmpArr = [];
      // for (let i = 0 ;i <= data.values.length; i++){
      //   categoriesList.forEach(function(e) {
      //     Object.keys(e).forEach(function(key) {
      //       if (key == data.values[i]){
      //         _.forEach(e[key], function(value) {
      //           data.values[i] = value;
      //         });
      //       }
      //     })
      //   });
      // }
      data.valuesString = data.values.toString();
      data.body = body;
      data.query = query;
      data.type = 'records';
      data.ids = _body.ids;
      data.exceptIds = _body.exceptIds;
      data.lat = _body.lat;
      data.lon = _body.lon;
      data.distance = _body.distance;
      data.onlyCategoriesFilter = _body.onlyCategoriesFilter;
      if (data.exceptIds) data.body = searchQuery['exceptIds'](data);
      if (data.lat && data.lon) data.body = searchQuery['GPS'](data);
      else if(data.onlyCategoriesFilter) data.body = searchQuery['score'](data);
      if (data.ids) data.body = searchQuery['ids'](data);
      else {
        if (data.values && data.values.length) data.body = searchQuery[data.type](data);
        // data.body = searchQuery['phone'](data);
        data.body = searchQuery['is_deleted'](data);
        for (var index in query)
          if (searchQuery[index])data.body = searchQuery[index](data);
      }
      // search.categories = (categories) ? categories.reverse() : [];
      search.body = body;
      resolve(search);
    });
  });
};


var _getDataResults = exports._getDataResults = function (search, withoutPaging) {
  return new Promise(function (resolve, reject) {
    _client.search(search, function (error, response, status) {
      if (error) return reject(error);
      response.hits.categories = search.categories;
      resolve(response.hits);
    });
  });
}


module.exports.getDataResults = function (req, res, next) {
  getResults(req.body.value, req.query, req.body).then(function (data){       
    res.send({
      data: data.hits,
      totalCount: data.total,
      limit: 50,
      // categories: data.categories.reverse(),
    });
    // ElasticCtrl.index('history', 'search', null, searchData(req, data)).then().catch();
  }).catch(function (error) {
    next(error);
  });
};


var getResults = module.exports.getResults = function (value, query, body) {
  return new Promise((resolve, reject) => {
    if (!value || !value.length) return resolve({
      hits: [],
      total: 0
    });
    searchResultsQuery(value, query, body)
    .then(_getDataResults)
    .then(function (data) {
      resolve(data);
      ElasticCtrl.index('history', 'search', null, searchData(query, value, data)).then().catch();
    }, function (error) {
      console.error(error);
      reject(error);
    });
  });
}

function searchData(query, value, resData) {
  var data = {};
  for (var index in query)
  data[index] = query[index];
  data.value = value.toString();
  data.created = new Date();
  data.totalCount = resData.total;
  data.tab = Constants.TYPES[data.type];
  return data;
}

module.exports.getSubCategories = function (req, res) {
  var search = {};
  var body = {
    from: 0,
    size: 100,
    query: {
      terms: {
        _routing: [req.query.routing]
      }
    }
  };
  
  if (req.query.type) search.type = req.query.type;
  search.index = req.query.index;
  search.body = body;
  search.routing = req.query.routing;
  _client.search(search, function (error, response, status) {
    if (error) {
      console.log("search error: " + error)
    } else {
      var data = {
        data: response.hits.hits,
        filters: {}
      };
      categoriesCtrl.getAllParents(req.query.routing, [], function (err, _categories) {
        if (!err)
        for (var index in config.hierarchyFilters) {
          if (_categories.indexOf(config.hierarchyFilters[index].content) > -1)
          data.filters[index] = true;
          else data.filters[index] = false;
        }
        res.send(data);
      });
    }
  });
  
}

module.exports.checkData = function (req, res) {
  _client.search({
    index: recordsIndex,
    type: recordsType,
    body: {
      query: {
        "match_all": {}
      }
    }
  }, function (error, response) {
    if (error)
    return res.send(false);
    if (!response.hits.hits.length)
    res.send(false);
    else res.send(true);
  });
}

