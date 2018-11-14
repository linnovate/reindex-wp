'use strict';

var elastic = require('../providers/elastic').getClient(),
  config = require('../config'),
  categoriesIndex = config.categories.index,
  hierarchyCategoriesIndex = config.hierarchyCategories.index,
  Elastic = require('../controllers/elastic'),
  recordsCtrl = require('../controllers/records')(),
  _ = require('lodash'),
  messages = require('../config/messages'),
  types = ['Z', 'A', 'B', 'C', 'D'];

function get(req, res, next) {

  var search = {};
  var body = {
    from: 0,
    size: 3000,
    query: {
      match_all: {}
    }
  };
  search.type = req.query.type;
  search.index = req.query.index || categoriesIndex;
  search.body = body;

  elastic.search(search, function (error, response, status) {
    if (error) return res.status(500).send(error)
    res.send(response.hits.hits);
  });

}

function getAllParentsApi(req, res, next) {
  var categories = [req.params.category];
  var node = req.body.node;

  getAllParents(req.params.id, categories, function (error, _categories) {
    if (error) return res.status(500).send(error);
    _categories = _categories.reverse();
    res.send(_.uniq(_categories));
  }, node.type);
}

function getAllParents(pid, categories, cb, _type) {
  if (!pid) return cb(null, categories);
  var type = _type || ((pid.split('-')[0].length === 1) ? pid.split('-')[0] : pid.split(':')[0]);
  if (type === 'Z') return cb(null, _.uniq(categories));
  Elastic.findById(hierarchyCategoriesIndex, null, pid, pid).then(function (node) {
    if (node) {
      categories.push(node._source.content);
      return getAllParents(node._parent, categories, cb, types[types.indexOf(node._type) - 1]);
    }
  }, function (err) {
    return cb(err);
  });
}


function add(req, res, next) {
  var node = req.body.node,
    newParent = req.body.newParent.id,
    type = types[types.indexOf(newParent.charAt(0)) + 1] || 'D',
    data = {
      content: node.title,
    };
  if (!type) return res.status(400).send(messages.errors.createRequest);

  Elastic.index(hierarchyCategoriesIndex, type, null, data, newParent).then(function (data) {
    res.send(messages.successes.createRequest);
  }).catch(function (error) {
    console.log('add category error:', error);
    res.send(messages.errors.createRequest);
  })
}

function findParentsPromise(data) {
  var node = data.node;
  return new Promise((resolve, reject) => {
    getAllParents(node.id, data.categories, function (error, _categories) {
      if (error) return reject(error);
      data[data.categoriesType] = _categories.reverse();
      return resolve(data);
    }, node.type);
  });
}

function indexNewParent(data) {
  var node = data.node;
  var newParent = data.newParent;
  return new Promise((resolve, reject) => {
    Elastic.findById(node.index, node.type, node.id, node.parentId).then(function (_node) {
      if (_node) {
        Elastic.index(_node._index, _node._type, _node._id, _node._source, newParent).then(function (_data) {
          data.indexSuccess = true;
          return resolve(data);
        }).catch(function (error) {
          data.indexSuccess = false;
          return reject(error);
        })
      }
    }, function (err) {
      return reject(error);
    });
  });
}

function update(req, res, next) {
  var node = req.body.node;
  var newParent = req.body.newParent;
  var data = {
    node: node,
    originNode: node,
    newParent: newParent.id,
    categories: [node.title],
    categoriesType: 'oldCategories',
    updateBy: 'categories',
  };

  if (data.newParent === data.node.id) return res.send(messages.errors.createRequest);

  findParentsPromise(data)
    .then((data) => {
      data.node = newParent;
      data.categoriesType = 'newCategories';
      data.categories = [node.title];
      return Promise.resolve(data);
    })
    .then(findParentsPromise)
    .then(recordsCtrl.updateMongoCategories)
    .then((data) => {
      var categoriesBool = {
        bool: {
          must: []
        }
      };
      data.oldCategories.forEach(function (v) {
        categoriesBool.bool.must.push({
          term: {
            ['categories.raw']: v
          }
        });
      });
      data.searchObj = {
        body: {
          query: categoriesBool,
          script: {
            inline: "ctx._source.categories = ctx._source.categories - oldCategories; ctx._source.categories = ctx._source.categories + newCategories; ctx._source.categories.unique();",
            params: {
              oldCategories: data.oldCategories,
              newCategories: data.newCategories,
            }
          }
        }
      }
      return Promise.resolve(data);
    })
    .then(recordsCtrl.updateElastiCategories)
    .then((data) => {
      data.node = data.originNode;
      return Promise.resolve(data);
    })
    .then(indexNewParent)
    .then((data) => {
      console.log('update categories tree success:', data);
      res.send(messages.successes.createRequest);
    }).catch((error) => {
      console.log('update categories tree err:', error);
      res.send(messages.errors.createRequest);
    });
}

function _delete(req, res, next) {
  var node = req.body.node;
  if (node.children) return res.send(messages.errors.createRequest);
  Elastic.delete(node.index, node.type, node.id, node.parentId).then(function (data) {
    res.send(messages.successes.createRequest);
  }).catch(function (err) {
    console.log('delete category error:', error);
    res.send(messages.errors.createRequest);
  });

}

module.exports = function CategoriesActions(params) {
  return {
    get: get,
    getAllParents: getAllParents,
    getAllParentsApi: getAllParentsApi,
    add: add,
    update: update,
    delete: _delete,
  }
};
