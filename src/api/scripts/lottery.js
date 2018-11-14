var csvWriter = require('csv-write-stream'),
    config = require('../config'),
    fs = require('fs'),
    path = require("path"),
    moment = require('moment'),
    inputPath = path.resolve(config.root, 'files'),
    writer = csvWriter({ headers: ['record', 'first name', 'last name', 'email','data'] });


require('../models/record-request');

var mongoose = require('mongoose');
mongoose.connect('mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'http://172.17.0.1') + '/reindex-prod');


writer.pipe(fs.createWriteStream(inputPath + '/lottery.csv'));

function writeLottery(record, flag) {
    console.log('---------------writeToCsv', record);
    writer.write([record.record, record.sender.fname, record.sender.lname, record.sender.email, record.created])
    if (flag) console.log('end!!')
}




var Records = mongoose.model('RecordRequest');
var now = moment('2017-10-31');
var before = moment('2017-09-14');
Records.find({
    created: { $gte: before, $lt: now },
}).exec(function (err, records) {
    console.log(records.length);
    for (var i = 0; i < records.length; i++)
        writeLottery(records[i], i == records.length - 1)
});