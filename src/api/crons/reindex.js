'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    producer = require('../producers');

module.exports = function(message, error, done) {

    var limit = 1000;
    var data = {},
        collection = message.params.collection;

    mongoose.connection.db.collection(collection, function(err, collection) {
        if (err) {
            (error || Function)(err);
            return console.error('REINDEX CONSUMER ERR', err);
        }
        collection.count({}, function(err, count) {
            if (err) {
                (error || Function)(err);
                return console.error('================ REINDEX ERR ==========', err);
            }
            for (var i = 0; i < count; i += limit) {
                data = {
                    offset: i,
                    limit: ((count - i) >= limit) ? limit : count - i,
                    collection: message.params.collection,
                    params: message.params,
                    index: message.params.index,
                    type: message.params.type
                };
                console.log('REINDEX CREATE SEARCH MONGO JOB ', message.params.collection, data.offset, data.limit);
                producer.createJob('reindex-data', data);
            };
            (done || Function)();
        });
    });
};
