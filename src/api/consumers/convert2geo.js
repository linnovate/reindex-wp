
'use strict';

var elastic = require('../controllers/elastic'),
    mongoose = require('mongoose'),
    config = require('../config');


var NodeGeocoder = require('node-geocoder');

var options = config.gepCoderOptions;

var geocoder = NodeGeocoder(options);
require('../models/newrecord');

var Record = mongoose.model('NewRecord');


module.exports = function (rabbit, qData) {
    rabbit.consume(qData.name, qData.maxUnackMessages, handleMessage);
};


function convert(address) {
    return new Promise(function (resolve, reject) {
        geocoder.geocode({ address }, function (err, data) {
            if (err) return reject(err);
            if (data) {
                var geo = data[0];
                if (geo) {
                    var location = [geo.longitude, geo.latitude];
                    return resolve(location);
                }
                else reject('no data');
            } else reject('no data');
        });
    });
}

function handleMessage(message, error, done) {
    message.query = {};
    var bulkArr = [];
    find(message, function (err, docs) {
        if (err) return console.log('===== CONVERT DATA ERR ================', err);
        docs.forEach(function (doc) {
            var address = '';
            // if (doc.address_city) {
            //     var address = doc.address_city;
                if (doc.address_street_name){
                    address += ' , ' + doc.address_street_name;
                if (doc.address_street_number)
                    address += ' , ' + doc.address_street_number;
                convert(address).then(function (res) {
                    var id = doc._id;
                    Record.update({ _id: id },
                        {
                            $set: { 'location': res }
                        }, { upsert: true }, function (err, affected, resp) {
                            console.log('errr', err, affected, resp);
                        })
                }).catch(function (error) {
                    console.log('error', error)
                });
           
            }
        });
        console.log('SEND TO BULK: ' + message.collection + ' FROM- ' + message.offset + ' LIMIT- ' + message.limit);
        done()
    });
};


function find(options, callback) {
    mongoose.connection.db.collection(options.collection, function (err, collection) {
        collection.find({
            // "address_city":
            //     { $exists: true }
        }).skip(options.offset).limit(options.limit).toArray(callback);
    });
}


   