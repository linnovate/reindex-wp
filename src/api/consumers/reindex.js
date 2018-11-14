'use strict';

var elastic = require('../controllers/elastic'),
    mongoose = require('mongoose'),
    config = require('../config');
var emitter = require('../services/emitter');

module.exports = function(rabbit, qData) {
    rabbit.consume(qData.name, qData.maxUnackMessages, handleMessage);
};



function handleMessage(message, error, done) {
    message.query = {};
    var bulkArr = [];
    var moreIndexes = {};
    for(var k in config.fieldsForIndex) moreIndexes[k] = {};
    find(message, function(err, docs) {
        if (err) {
            console.log('===== REINDEX ERR ================', err);            
            return;
        }
        docs.forEach(function(doc) {
            
            doc.created = new Date();
            doc.updated = new Date();

            bulkArr.push({
                index: {
                    _index: message.index,
                    _type: message.type,
                    _id: doc._id
                }
            });

            delete doc._id;
            bulkArr.push(doc);

            for(var k in config.fieldsForIndex) {
                if (doc[k]) {
                    var splitArr = doc[k].split(config.fieldsForIndex[k].separator);
                    for(var i = 0; i < splitArr.length; i++) {
                        var value = splitArr[i].trim();
                        moreIndexes[k][value] = value;
                    }
                }
            }
        });
        for(var k in moreIndexes) {
            for(var v in moreIndexes[k]) {
                bulkArr.push({
                    index: {
                        _index: config.fieldsForIndex[k].index,
                        _type: config.fieldsForIndex[k].type,
                        _id: v
                    }
                });

                bulkArr.push({content: v});
            }
        }
        console.log('SEND TO BULK: ' + message.collection  + ' FROM- ' + message.offset + ' LIMIT- ' + message.limit);
        elastic.bulk(bulkArr, function(err) {
            if (err) return error(err);
            if (message.last && message.last == true) {
                console.log('message',message.offset)
              emitter.emit('finishReindex');
            }
            done();
        });
    });
    
};


function find(options, callback) {
    mongoose.connection.db.collection(options.collection, function(err, collection) {
        collection.find(options.query).skip(options.offset).limit(options.limit).toArray(callback);
    });
}
