'use strict';

var crypto = require('crypto'),
  Recaptcha = require('recaptcha-verify'),
  config = require('../config'),
  recaptcha = new Recaptcha({
    secret: config.recaptcha.secret,
    verbose: true
  });

exports.encrypt = function (text) {
  var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq')
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
};

exports.decrypt = function (text) {
  var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
};

exports.requireToken = function (req, res, next) {

};

exports.checkRecaptcha = function (req, res, next) {
    var offset = parseInt(req.query.offset);
  if (offset === 1 || (req.user && req.user.role === 'Admin')) return next();
  if (offset > 4) return res.status(509).send('limitation error');
  recaptcha.checkResponse(req.body.captcha, function (error, response) {
    if (error) return res.status(500).send(error);
    if (response.success) return next(); 
      res.status(400).send('you are a robot :(');
  });
};
