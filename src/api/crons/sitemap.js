'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  producer = require('../producers'),
  config = require('../config'),
  categoriesIndex = config.hierarchyCategories.index,
  elastic = require('../controllers/elastic'),
  fs = require('fs'),
  sitemapIndexName = config.root + '/sitemap/sitemap-index-tmp.xml',
  sitemapBase = require('../sitemap/sitemap-base');

fs.writeFileSync(config.root + '/sitemap/sitemap-base.xml', sitemapBase);

module.exports = function (message, error, done) {
  var d = new Date();

  fs.appendFileSync(sitemapIndexName, `<sitemapindex>
    <sitemap>
      <loc>${config.host}/sitemap-base.xml</loc>
      <lastmod>${d.toDateString()}</lastmod>
    </sitemap>
  `);

  var data = {
    collection: 'records',
    pageNum: 0,
    subType: 'businesses',
  };

  produceRecords(data)
    .then((data) => {
      data.pageNum = 0;
      data.subType = 'people';
      return Promise.resolve(data);
    }).then(produceRecords) 
    .then(produceCategories)
    .then((data) => {
      done();
    }).catch((err) => {
      error();
    });
};

function produceRecords(options) {
  var limit = 10000,
    data;
  return new Promise((resolve, reject) => {
    mongoose.connection.db.collection(options.collection, function (err, collection) {
      if (err) return reject(err);
      var query = (options.subType === 'people') ? {
        listing_type_1: 1
      } : {
        listing_type_1: {
          $ne: 1
        }
      };
      collection.count(query, function (err, count) {
        if (err) return reject(err);
        for (var i = 0; i < count; i += limit) {
        // for (var i = 0; i < 100000; i += limit) {
          options.pageNum++;
          data = {
            offset: i,
            limit: ((count - i) >= limit) ? limit : count - i,
            db: 'mongo',
            collection: 'records',
            type: 'records',
            pageNum: options.pageNum,
            subType: options.subType,
          };
          console.log('SITEMAP CREATE SEARCH MONGO JOB ', data.offset, data.limit);
          producer.createJob('create-sitemap-file-data', data);
        };
        return resolve(options);
      });
    });
  });
}

function produceCategories(options) {
  options.pageNum = 0;
  var limit = 5000,
    data;
  return new Promise((resolve, reject) => {
    elastic.count(categoriesIndex).then(function (count) {
      for (var i = 0; i < count; i += limit) {
        options.pageNum++;
        data = {
          offset: i,
          limit: ((count - i) >= limit) ? limit : count - i,
          db: 'elastic',
          index: categoriesIndex,
          last: (i + limit < count) ? false : true,
          type: 'categories',
          pageNum: options.pageNum,
        };
        console.log('SITEMAP CREATE SEARCH ELASTIC JOB ', categoriesIndex, data.offset, data.limit);
        producer.createJob('create-sitemap-file-data', data);
      };
      return resolve(count);
    }).catch(function (err) {
      return reject(err);
    });
  });
}
