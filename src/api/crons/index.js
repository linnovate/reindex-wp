'use strict';

var _producer = require('../producers');
var auth = require('../auth');
var config = require('../config');

exports.producer = function(req, res) {
    var data = {
        type: req.params.type,
        subtype: req.params.subtype,
        params: req.query
    };
    _producer.createJob('crons-reindex', data);
    res.send('OK');
};

exports.requireAuth = function(req, res, next) {
    if (!req.headers.authorization) return res.send(401);
    var arrStr = auth.decrypt(req.headers.authorization).split('-');
    if (config.tokenSecret !== arrStr[0]) return res.send(401);
    var type = req.params.type;
    var subtype = req.params.subtype;
    if (type !== arrStr[1]) return res.send(401);
    if (subtype && subtype !== arrStr[2] || !subtype && arrStr[2]) return res.send(401);
    next();
};
