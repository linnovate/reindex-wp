
'use strict';

module.exports = function(db) {

  var ElasticProvider = require('../providers/elastic'),
    config = require('../config');
  ElasticProvider.connect(config.elastic.host, config.elastic.port);

  var express = require('express'),
    passportService = require('../config/passport'),
    passport = require('passport'),
    requireAuth = passport.authenticate('jwt', { session: false }),
    requireLogin = passport.authenticate('local', { session: false }),
    router = express.Router(),
    esClient = require('../controllers/esClient'),
    recordsCtrl = require('../controllers/records')(),
    requestsCtrl = require('../controllers/requests')(),
    categoriesCtrl = require('../controllers/categories')(),
    settingsCtrl = require('../controllers/settings'),
    authCtrl = require('../controllers/auth'),
    historyCtrl = require('../controllers/history'),
    emailsCtrl = require('../controllers/emails'),
    contactsCtrl = require('../controllers/contacts'),
    scoreCtrl = require('../controllers/score'),
    uploadCtrl = require('../controllers/upload'),
    ImportRecordsCtrl = require('../controllers/importRecords'),
    webhookCtrl = require('../controllers/webhooks'),
    auth = require('../auth'),
    landscapesCtrl = require('../controllers/landscapes'),
    landscapeTooltipsCtrl = require('../controllers/landscapeTooltips');
  
  // if (config.inheritFunctions && config.inheritFunctions.importRecords) ImportRecordsCtrl = require(config.inheritFunctions.importRecords).controller;
  var importRecordsCtrl = new ImportRecordsCtrl(db);
    
  router.get('/test', (req, res) => {
    res.send('ok');
  });

  router.get('/checkData',esClient.checkData);
  router.post('/getCategories', esClient.getDataByTerm, esClient.getSubCategories);
  router.get('/getSubCategories', function(req, res, next) {
    if (req.query.children && !req.query.routing) {
      req.body.value = decodeURI(req.query.value);
      req.body.term = 'content.ac';
      return esClient.getDataByTerm(req, res, next)
    };
    next();
  }, esClient.getSubCategories);
  router.post('/getResults', function(req, res, next) {
    if (req.headers.authorization) return requireAuth(req, res, next);
    next();
  }, auth.checkRecaptcha, esClient.getDataResults);
  router.post('/getUsers', function(req, res, next) {
    if (req.headers.authorization) return requireAuth(req, res, next);
    next();
  },authCtrl.getUsers);
  router.put('/user/:id', function(req, res, next) {
    if (req.headers.authorization) return requireAuth(req, res, next);
    next();
  },  authCtrl.updateUser);

  /*
  Records functions
  */
  router.put('/records/connect2category', requireAuth, authCtrl.roleAuthorization('Admin'), recordsCtrl.connect2category);
  router.get('/records/:recordId', recordsCtrl.record, recordsCtrl.findOne);
  router.put('/record/:recordId',requireAuth, authCtrl.roleAuthorization('Admin'), recordsCtrl.updateRecord);
  router.get('/records', recordsCtrl.records);
  
  /*
  Requests functions
  */
  router.get('/requests',requireAuth, authCtrl.roleAuthorization('Admin'), requestsCtrl.find);
  router.put('/approveRequest/:requestId', requireAuth, authCtrl.roleAuthorization('Admin'), requestsCtrl.request, requestsCtrl.approve);
  router.delete('/requests/:requestId', requireAuth, authCtrl.roleAuthorization('Admin'), requestsCtrl.request, requestsCtrl.delete);
  router.put('/requests/:requestId', requireAuth, authCtrl.roleAuthorization('Admin'), requestsCtrl.request, requestsCtrl.updateRequest);
  router.get('/requests/:requestId', requireAuth, authCtrl.roleAuthorization('Admin'), requestsCtrl.request, requestsCtrl.findOne);
  router.put('/records/:recordId', recordsCtrl.record, requestsCtrl.update);
  router.put('/records/:recordId/settings', requireAuth, authCtrl.roleAuthorization('Admin'), recordsCtrl.record, scoreCtrl.calc, recordsCtrl.updateSettings);
  router.post('/records', requestsCtrl.create);
  
  /*
  History functions
  */
  router.get('/history',requireAuth, authCtrl.roleAuthorization('Admin'), historyCtrl.find);

  /*
  Categories functions
  */
  router.get('/categories', categoriesCtrl.get);
  router.post('/getCategoryParents/:category/:id', categoriesCtrl.getAllParentsApi);
  router.post('/category', requireAuth, authCtrl.roleAuthorization('Admin'), categoriesCtrl.add);
  router.route('/category/:categoryId')
    .put(requireAuth, authCtrl.roleAuthorization('Admin'), categoriesCtrl.update)
    .delete(requireAuth, authCtrl.roleAuthorization('Admin'), categoriesCtrl.delete)

  /*
  Settings functions
  */
  router.route('/settings')
    .get(requireAuth, authCtrl.roleAuthorization('Admin'), settingsCtrl.all)
    .post(requireAuth, authCtrl.roleAuthorization('Admin'), settingsCtrl.create);
  router.route('/settings/:key')
    .get(settingsCtrl.get)
    .put(requireAuth, authCtrl.roleAuthorization('Admin'), settingsCtrl.update);
    
  /*
  Landscapes functions
  */
  // router.route('/landscape')
  //   .get(landscapesCtrl.all)
  //   .post(requireAuth, authCtrl.roleAuthorization('Admin'), landscapesCtrl.create);
  // router.route('/landscape/:landscapeId')
  //   .get(landscapesCtrl.get)
  //   .put(requireAuth, authCtrl.roleAuthorization('Admin'), landscapesCtrl.update);

  /*
  LandscapeTooltips functions
  */
  router.route('/landscape/tooltip')
    .get(landscapeTooltipsCtrl.all)
    .post(requireAuth, authCtrl.roleAuthorization('Admin'), landscapeTooltipsCtrl.create);
  router.route('/landscape/tooltip/:tooltipId')
    .get(landscapeTooltipsCtrl.get)
    .put(requireAuth, authCtrl.roleAuthorization('Admin'), landscapeTooltipsCtrl.update)
    .delete(requireAuth, authCtrl.roleAuthorization('Admin'), landscapeTooltipsCtrl.delete);

  /*
  Authentication functions
  */
  router.post('/register', authCtrl.register);

    // Login route
  router.post('/login', requireLogin, authCtrl.login);

    // Password reset request route (generate/send token)
  router.post('/forgot-password', authCtrl.forgotPassword);

    // Password reset route (change password using token)
  router.post('/reset-password/:token', authCtrl.verifyToken);


  /*
  Crons functions
  */
  var crons = require('../crons');
  router.get('/crons/:type/:subtype?', crons.requireAuth, crons.producer);


  /*
  Emails functions
  */
  router.post('/email/send', emailsCtrl.send);
  router.post('/registerToMailingList',emailsCtrl.register2MailingList);


  /*
  Numbers functions
  */
  router.get('/getVirtualNumber/:recordId', recordsCtrl.record, recordsCtrl.setVirtualNumber);

  /*
  Score functions
  */
  router.get('/rating', scoreCtrl.get);

  /*
  Save Contacts
  */
  router.post('/saveContact', contactsCtrl.save);

  /* 
  Yemot Hamashiah WebHook
  */

  router.get('/webhook/:service(yemot)', function(req, res, next) {
    return webhookCtrl[req.params.service](req, res);
  });

  router.post('/import/records', requireAuth, authCtrl.roleAuthorization('Admin'), importRecordsCtrl.start.bind(importRecordsCtrl), importRecordsCtrl.upload.bind(importRecordsCtrl), importRecordsCtrl.arrange.bind(importRecordsCtrl), importRecordsCtrl.saveRecords.bind(importRecordsCtrl), importRecordsCtrl.end.bind(importRecordsCtrl));  
  // router.post('/downloadFile', uploadCtrl.download);
  router.post('/uploadImage', requireAuth, authCtrl.roleAuthorization('Admin'), uploadCtrl.uploadImage);


  return router;
}
