var mongoose = require('mongoose');
// var NodeGeocoder = require('node-geocoder');

var promise = mongoose.connect('mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'http://172.17.0.1') + '/reindex-dev', {
  useMongoClient: true,
});

var geocoder = require('geocoder');

function convert(address) {
  geocoder.geocode(address, function (err, data) {
    console.log('err', err)
    if (data) {
      console.log('ddddddd', data)
      var geo = data.results[0];
      console.log('geo', geo);
    }
  });
}


promise.then(function (db) {
  var i = 0;
  db.collection('newrecords').find({}).forEach(function (doc) {
    i++;
    if (i > 40)
      return;
    if (doc.address_city && doc.address_street_name && doc.address_street_number) {
      var s = doc.address_city + ' , ' + doc.address_street_name + ' , ' + doc.address_street_number;
      console.log(s)
      convert(s);
    }
  });
});



//    db.collection('newrecord').save(doc, function(err, records) {
// 		if (err) console.log(err);
// 		console.log("Record saved");
// 	});