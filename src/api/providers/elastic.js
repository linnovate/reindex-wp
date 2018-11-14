'use strict';

var elasticsearch = require('elasticsearch'),
  Promise = require('bluebird'),
  deleteByQuery = require('elasticsearch-deletebyquery');

var client;

module.exports = {
  connect: function (host, port) {
    host = host || 'http://172.17.0.1';
    port = port || 9200;

    var uri = host + ':' + port;
    client = new elasticsearch.Client({
      host: uri,
      requestTimeout: 50000,
      log: ['error', 'warning'],
      apiVersion: '2.3',
      sniffOnConnectionFault: true,
      deadTimeout: 10 * 1000,
      maxRetries: 10,
      defer: function () {
        return Promise.defer();
      },
      plugins: [ deleteByQuery ],
    });
  },
  getClient: function () {
    return client;
  }
};
