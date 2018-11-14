'use stricts';
require('../models/record');
require('../models/record-request')
//var mi = require('mongoimport');
/*var config = {
  fields: [],                     // {array} data to import
  db: 'reindex-dev',                     // {string} name of db
  collection: 'newrecords'  ,
  host: '172.17.0.1:27017',        // {string} [optional] by default is 27017
  username: 'sofish',             // {string} [optional]
  password: '***'                 // {string} [optional]
  callback: (err, db) => {}       // {function} [optional]
  };*/

var mongoose = require('mongoose'),
  Records = mongoose.model('Record'),
  RecordRequest = mongoose.model('RecordRequest'),
  fs = require('fs'),
  producer = require('../producers'),
  path = require("path"),
  config = require('../config'),
  inputPath = path.resolve(config.root, 'files'),
  formidable = require('formidable'),
  csvWriter = require('csv-write-stream'),
  moment = require('moment');

var writer = csvWriter({ headers: config.headersCSV });
var found = false;
var findrr = false;
var flagFindRR = false;

function writeToCsv(writer, record, flag) {
  if (record.requests.length) {
    findrr = true;
    console.log('records[i].requests.length', record.requests)
    let arrRR = record.requests;
    var now = moment(new Date());
    var before = moment().subtract(5, 'months').format('MMM YYYY');
    RecordRequest.find({
      '_id': { '$in': arrRR },
      'created': { '$gte': before, '$lt': now },
      'approved.val': true
    }).exec(function (err, rr) {
      if (err) console.log(err);
      else {
        console.log('rrrrrrrrr', rr.length)
        if (rr.length) {
          found = true;
          console.log('foundddd')
          writer.write([record.business_name, record.first_name, record.last_name, record.business_description,
          record.address_street_name, record.address_street_number, record.address_street_entrance, record.address_neighborhood,
          record.address_additional_info, record.address_city, record.phone,
          record.phone_2, record.email, record.website, record.listing_type_1, record.tags, record.categories_str])
        }
      }
      if (flag)
        flagFindRR = true;
    })
  }
}

module.exports = {
  download: function (req, res, next) {
    let type,cat, city, categories;
    type = parseInt(req.body.type)
    cat = req.body.cat;
    city = req.body.city;
    categories = [cat];
     if (type === 1)
      objFind = {
        'listing_type_1': type,
        'address_city': city
      };
    else
      objFind = {
        'listing_type_1': type,
        '$or': [{ tags: { '$regex': ".*" + cat + ".*" } }, { categories: { '$in': [cat] } }],
        'address_city': city,
      };
    Records.find(objFind).exec(function (err, records) {
      if (err) console.log(err);
      console.log('here',records.length)
      writer.pipe(fs.createWriteStream(inputPath + '/updateds.csv'))
      for (var i = 0; i < records.length; i++) {
        writeToCsv(writer, records[i], i == records.length - 1)
      }
      if (!findrr)
        res.send({ 'succsess': false })
      else if (flagFindRR === true) {
        if (!found) res.send({ 'succsess': false })
        else res.send({ 'succsess': true })
      }
      else res.status(200).send({ 'succsess': true })
    });
  },
  uploadImage(req, res) {
    let url = Date.now();
    // create an incoming form object
    var form = new formidable.IncomingForm();
  
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;
  
    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, './../files');
  
    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
      fs.rename(file.path, path.join(form.uploadDir, url + file.name));
      url = url + file.name;
    });
  
    // log any errors that occur
    form.on('error', function(err) {
      console.log('An error has occured: \n' + err);
    });
  
    // once all the files have been uploaded, send a response to the client
    form.on('end', function(file) {
      res.end(url);
    });
  
    // parse the incoming request containing the form data
    form.parse(req);
  }

}


