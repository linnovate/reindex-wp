'use strict';

var express = require('express'),
  router = express.Router(),
  path = require("path"),
  config = require('../config'),
  inputPath = path.resolve(config.root);

router.get(/^\/download/, (req, res, next) => {
  console.log('=========================')
  res.header('Content-Type', 'text/csv');
  let file = inputPath + '/files/updateds.csv';
  res.download(file);

});


router.get(/^\/sitemap/, (req, res, next) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(`sitemap${req.originalUrl}`, {
    root: __dirname + '/../'
  });
});

module.exports = router;
