'use strict';

var ElasticProvider = require('../providers/elastic');
var _client = ElasticProvider.getClient(),
  config = require('../config'),
  historyIndex = config.history.index,
  historyType = config.history.type;

exports.find = function (req, res) {
  var query = req.query,
    limit = query.limit || 50,
    offset = query.offset || 1,
    from = limit * (offset - 1),
    search = {
      index: historyIndex,
      type: historyType
    },
    body = {
      size: limit,
      from: from,
      query: {
        match_all: {}
      },
      sort: {
        created: {
          order: 'desc'
        }
      }
    };

  search.body = body;
  _client.search(search, function (error, response, status) {
    if (error) return res.status(500).send(error);
    var data = response.hits;
    res.set('X-Total-Count', data.total);
    res.send({
      data: data.hits,
      totalCount: data.total,
      limit: 50
    });
  });
};
