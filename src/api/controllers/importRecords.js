'use stricts';
require('../models/newrecord');
require('../models/record');
require('../models/record-request')

const mongoose = require('mongoose'),
  NewRecords = mongoose.model('NewRecord'),
  async = require('async'),
  fs = require('fs'),
  shell = require('shelljs'),
  path = require("path"),
  config = require('../config'),
  inputPath = path.resolve(config.root, 'files'),
  IncomingForm = require('formidable').IncomingForm,
  csv = require('csv-parser'),
  util = require('util'),
  exec = util.promisify(require('child_process').exec);

var NodeGeocoder = require('node-geocoder');

var options = config.gepCoderOptions;

var geocoder = NodeGeocoder(options);

var dbName = config.dbName;
var dbHost = config.dbHost;

function Upload() {
  this.emitter = require('../services/emitter');
  this.producer = require('../producers');
  this.config = config;
}

Upload.prototype.location2points = function (address, points) {
  return new Promise(function (resolve, reject) {
    if (points && points.length) return resolve(points);
    if (config.defaultAddress) address = `${address}, ${config.defaultAddress}`
    if (!address) return resolve(null);
    geocoder.geocode({
      address
    }, function (err, data) {
      if (err) return reject(err);
      if (!data) return reject('no data');
      var geo = data[0];
      if (!geo) return reject('no data');
      return resolve({points: [geo.longitude, geo.latitude], region: geo.administrativeLevels.level1short, city: geo.city});
    });
  });
}
Upload.prototype.start = function (req, res, next) {
  console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=')
  next();
}

Upload.prototype.readHeader = function (path) {
  let header;
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(csv())
      .on('headers', (_header) => {
        header = _header;
        return resolve(header);
      });
  });
}

async function rename(header, path) {
  const {
    stdout,
    stderr
  } = await exec(`sed -i "1c\
    ${header.toString()}" ${path}`);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}

Upload.prototype.changeHeader = function (path, header, query) {
  for (var index in query) {
    var fieldIndex = header.indexOf(query[index]);
    if (~fieldIndex) {
      header[fieldIndex] = `reindex${index.charAt(0).toUpperCase() + index.slice(1)}`;
    }
  }
  return new Promise((resolve) => {
    rename(header, path);
    resolve();
  });
}

Upload.prototype.upload = function (req, res, next) {
  const self = this;
  let fileName, sourceFile, form = new IncomingForm();

  form.uploadDir = inputPath;
  form.parse(req);
  form.on('file', function (field, file) {
    sourceFile = `${inputPath}/${file.name}`;
    fs.renameSync(file.path, sourceFile);
  });
  form.on('end', function () {
    self.readHeader(sourceFile).then(header => {
      self.changeHeader(sourceFile, header, req.query).then(data => {
        const mongoimportStr = `mongoimport -d ${dbName} -c newrecords --type csv --file ${sourceFile} --headerline  --host ${dbHost}`;
        console.log('mongoimportexecstring', mongoimportStr)
        shell.exec(mongoimportStr, function (err, result) {
          if (err) return res.status(400).send(err.message);
          next();
        });
      })
    });
  });
}

Upload.prototype.arrange = function (req, res, next) {
  let self = this;
  NewRecords.find().exec(function (err, newrecords) {
    if (err) return res.status(500).send(err);
    let saveFlag = false;
    async.forEachOf(newrecords, function (doc, key, callback) {
      self.location2points(doc.reindexLocationString, doc.reindexLocationPoints).then(function (response) {
        if (response) {
          saveFlag = true;
          doc.set('reindexLocationPoints', response.points);
          doc.set('reindexCity', response.city);
          doc.set('region', response.region);
        }
        if (saveFlag) {
          var promise = doc.save();
          promise.then(function (ok) {
            console.log('new record saved');
            callback();
          }).catch((error) => {
            console.log('new record save location points error', error);
            callback();
          })
        } else callback();
      }).catch((error) => {
        console.log('get location points error', error);
        callback();
      });
    }, (err) => {
      if (err) return res.status(400).send(err);
      next();
    });
  });
}

Upload.prototype.saveRecords = function (req, res, next) {
  const params = {
    'index': config.records.index,
    'type': config.records.type,
    'collection': 'newrecords'
  }
  var limit = 1000;
  var self = this;
  NewRecords.count({}, function (err, count) {
    const recordsCount = count;
    console.log('count new records', count)
    if (err) {
      return console.error('================ REINDEX ERR ==========', err);
    }
    for (var i = 0; i < count; i += limit) {
      const currLimit = ((count - i) >= limit) ? limit : count - i
      data = {
        offset: i,
        limit: currLimit,
        collection: params.collection,
        params: params,
        index: params.index,
        type: params.type,
        last: i + currLimit == recordsCount
      };
      console.log('REINDEX CREATE SEARCH MONGO JOB ', params.collection, data.offset, data.limit);
      self.producer.createJob('reindex-data', data);
    };
    next();
  });
}

Upload.prototype.end = function (req, res, next) {
  let flag = false;
  this.emitter.once('finishReindex', function () {
    flag = true;
    console.log('in emit')
    shell.exec(`mongodump -d ${dbName} -c newrecords --out /tmp --host ${dbHost}`);
    shell.exec(`mongorestore -d ${dbName} -c records /tmp/${dbName}/newrecords.bson --host ${dbHost}`);
    NewRecords.deleteMany({}, function (err, results) {
      console.log('delete', results.result);
      if (res) return res.send('records updated');
    });
  });
  setTimeout(() => {
    if (!flag) return res.send('in process');
  }, 90000);
}

module.exports = Upload;