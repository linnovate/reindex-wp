'use strict';

var payCallCtrl = require('../controllers/paycall');

module.exports = function (rabbit, qData) {
  rabbit.consume(qData.name, qData.maxUnackMessages, handleMessage);
};

function handleMessage(message, error, done) {
  payCallCtrl.freePrmNumber({
    prmDid:message.virtual_number.value
  }).then(function (data) {
    done();
  }).catch(function (err) {
    console.log('unsetRoute ERR', err);
    error();
  });
};