'use strict';

var rabbit = require('replay-rabbitmq'),
    queues = {};

exports.createJob = function(qName, data, options) {
    rabbit.produce(qName, data, options);
};