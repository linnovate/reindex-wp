'use strict';

var elastic = require('../controllers/elastic'),
  ElasticProvider = require('../providers/elastic'),
  _client = ElasticProvider.getClient(),
  mongoose = require('mongoose'),
  config = require('../config'),
  baseUrl = `${config.host}/`,
  fs = require('fs'),
  sitemapIndexName = config.root + '/sitemap/sitemap-index-tmp.xml',
  fileNameBaseName = config.root + '/sitemap/sitemap';

module.exports = function (rabbit, qData) {
  rabbit.consume(qData.name, qData.maxUnackMessages, handleMessage);
};

function handleMessage(message, error, done) {

  message.query = {};
  var fileName = `${fileNameBaseName}-${message.subType || message.type}-${message.pageNum}-tmp.xml`;
  var d = new Date();

  // open the first tag to the new xml file
  fs.writeFileSync(fileName, '<urlset>');

  find(message, function (err, docs) {
    if (err) {
      error();
      return console.log('===== SITEMAP FIND ERR ================', err);
    }

    writeToFile[message.type](docs, fileName).then(() => {
      // end of file
      fs.appendFileSync(fileName, '</urlset>');
      // rename tmp file to regular file
      fs.renameSync(fileName, fileName.replace('-tmp', ''));
      // update index sitemap file with the new file
      fs.appendFileSync(sitemapIndexName, `
        <sitemap>
          <loc>${baseUrl}${fileName.replace('-tmp', '').replace(config.root + '/sitemap/', '')}</loc>
          <lastmod>${d.toDateString()}</lastmod>
        </sitemap>`);
      if (message.last) {
        console.log(' ================================================================ ');
        console.log('END OF CREATING SITEMAP');
        console.log(' ================================================================ ');
        // close index sitemap
        fs.appendFileSync(sitemapIndexName, '</sitemapindex>');
        // rename tmp file to regular file
        fs.renameSync(sitemapIndexName, sitemapIndexName.replace('-tmp', ''));
      }
      done();
    }).catch(() => error());
  });
};

function find(options, callback) {
  if (options.db === 'mongo') {
    mongoose.connection.db.collection(options.collection, function (err, collection) {
      var query = (options.subType === 'people') ? {
        listing_type_1: 1
      } : {
        listing_type_1: {
          $ne: 1
        }
      };
      collection.find(query).skip(options.offset).limit(options.limit).toArray(callback);
    });
  }
  if (options.db === 'elastic') {
    var search = {
      index: options.index,
      body: {
        size: options.limit,
        from: options.offset,
        query: {
          match_all: {}
        }
      }
    }
    _client.search(search).then((response) => {
      callback(null, response.hits.hits);
    }).catch((error) => {
      callback(error);
    });
  }
}

var writeToFile = {
  records: function (docs, fileName) {
    return new Promise((resolve, reject) => {
      docs.forEach(function (doc) {
        var type = (doc.listing_type_1 === 1) ? 'ppl' : 'biz';
        var url = baseUrl + ((type === 'ppl') ? `ppl/${doc._id}/${doc.first_name}_${doc.last_name}` : `biz/${doc._id}/${doc.business_name}`);
        url = url.replace(/ /g, '-');
        url = url.replace(/&/g, '&amp;');
        url = url.replace(/>/g, '&gt;');
        url = url.replace(/</g, '&lt;');
        var d = (doc.updated) ? new Date(doc.updated) : new Date();
        var data = `
        <url>
          <loc>${url}</loc>
          <lastmod>${d.toDateString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>${type === 'biz' ? '0.60' : '0.40'}</priority>
          </url>`
        fs.appendFileSync(fileName, data);
      });
      return resolve();
    });
  },
  categories: function (docs, fileName) {
    var d = new Date();
    return new Promise((resolve, reject) => {
      docs.forEach(function (doc) {
        doc = doc._source;
        var url = `${baseUrl}cat/${doc.content.replace(/ /g, '-')}`;
        url = url.replace(/&/g, '&amp;');
        url = url.replace(/>/g, '&gt;');
        url = url.replace(/</g, '&lt;');
        var data = `<url>
          <loc>${url}</loc>
          <lastmod>${d.toDateString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.80</priority>
          </url>`
        fs.appendFileSync(fileName, data);
      });
      return resolve();
    });
  }
};
