var mongoose = require('mongoose');
mongoose.connect('mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'http://172.17.0.1') + '/reindex-dev');

require('../models/newrecord');

var NewRecord = mongoose.model('NewRecord');

var total;
var current = 0;

NewRecord.find().exec(function (err, records) {
  console.log(records.length);
  total = records.length;
  records.forEach(function (record) {
    console.log('categories_str:', record.categories_str);
    record.categories = record.categories_str.split('|');
    record.categories = record.categories.map((r) => r.trim());
    console.log(record.business_name, record._id);
    if (record.categories[record.categories.length - 1] === '') record.categories.splice(record.categories.length - 1, 1);
    record.save(function (err, n) {
      if (err) return console.log(err);
      current++;
      console.log('current saved', current);
      if (current === total)
        console.log('NEW RECORDS SUCCESSFULY SAVED');
    });
  });
});
