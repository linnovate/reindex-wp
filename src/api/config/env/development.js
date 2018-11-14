'use strict';
module.exports = {
  db: 'mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || '127.0.0.1') + '/' +  process.env.DB_NAME || 'reindex-dev',
  dbName: process.env.DB_NAME || 'reindex-dev',
  dbHost: process.env.DB_PORT_27017_TCP_ADDR || '172.17.0.1',
  host: 'https://172.17.0.1:3005',
  google: {
    client_id: 'client_id',
    client_secret: 'client_secret',
    redirect_uri: 'redirect_uri',
  },
  elastic: {
    host: process.env.ELASTIC_HOST || '172.17.0.1',
    port: 9200
  },
  records: {
    index: process.env.RECORDS_INDEX || 'reindex-records',
    type: process.env.RECORDS_TYPE || 'record'
  },
  hierarchyCategories: {
    index: process.env.HCATEGORIES_INDEX || 'reindex-categories'
  },
  categories: {
    index: process.env.CATEGORIES_INDEX || 'reindex-cities'
  },
  history: {
    index: process.env.HISTORY_INDEX || 'history',
    type: process.env.HISTORY_TYPE || 'search'
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || '172.17.0.1'
  },
  tokenSecret: 'reindex',
  recaptcha: {
    secret: 'recaptcha-key'
  },
  email: {
    service: 'gmail',
    auth: {
      user: '',
      pass: ''
    }
  },
  paycall: {
    uname: '',
    uid: '',
    pass: ''
  },
  tokenSecret: 'reindextoken',
  testLeads: true,
  gepCoderOptions: {
    provider: 'google',

    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'api-key', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
  },
  raven: {
    key: 'raven-key',
    project: 'raven-project'
  },
};
