'use stricts';
var mongoose = require('mongoose'),
  User = mongoose.model('User');

var admins = [];

module.exports = {
  getAdmins: function () {
    return new Promise(function (resolve, reject) {
      if (admins && admins.length) return resolve(admins);
      User.find({
        role: 'Admin'
      }).exec(function (err, users) {
        if (err) return reject(err);
        resolve(users);
      });
    });
  }
};