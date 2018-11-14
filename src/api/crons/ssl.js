'use strict';

var mongoose = require('mongoose'),
    Stack = mongoose.model('Stack'),
    producer = require('../producers'),
    urlpattern = /^https?:\/\//;

module.exports = function(message, error, done) {
    var query = {
        host: {
            $exists: true,
            $ne: null
        }
    };
    if (message.params.stackId) query['_id'] = message.params.stackId;

    Stack.find(query).exec(function(err, stacks) {
        if (err) {
            (error || Function)(err);
            return console.error('======= SSL VALIDITY SEARCH STACKS ERR ==============================', err);
        }

        stacks.forEach(function(stack) {
            // if (!stack.host || !stack.host.match(/^https:\/\//)) return;
            if (!stack.host) return;
            var url = stack.host.replace('https://', '');
            url = url.replace('http://', '');
            var data = {
                appId: stack._id,
                mngToken: stack.owner,
                url: url
            };
            producer.createJob('ssl-validity-sts', data);
        });
        (done || Function)();
    });
};
