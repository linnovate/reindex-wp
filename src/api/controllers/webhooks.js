'use strict';

const esClientCtrl = require('./esClient');
const citiesNumbers = require('../data/citiesNumbers');


function phoneString(phone, phone_2) {
  let _phone = phone_2 || phone;
  if (!_phone) return '';
  _phone = _phone.toString();
  var first = _phone.charAt(0);
  if (['*', '0', '1'].indexOf(first) === -1) _phone = '0' + _phone;
  _phone = _phone.replace('-', '');
  return _phone;
}

function yemot(req, res, next) {

  let value = (req.query.search) ?  decodeURI(req.query.search) : req.query.number;
  const type = req.query.type;
  const city = req.query.city;
  let resNum, resVal;
  for (var index in req.query) {
    if (index.indexOf('Result') > -1) {
      resNum = parseInt(index.replace('Result', ''));
      resVal = req.query[index];
    }
  }

  if (!value) return res.status(400).send('search voice or number query parameter is missing');
  value = value.replace('&', '');
  value = value.replace(/_/g, ' ');
  let query = {
    type: (type === '2') ? '2,3' : type
  };
  if (city) query.city = citiesNumbers[city];
  esClientCtrl.getResults([value], query).then(function (data) {
    if (data.total === 0) return res.send('id_list_message=t-לא נמצאו תוצאות&');
    let response = '';

    let firstRequest = (resNum === undefined) ? true : false;
    if (firstRequest) resNum = 0;
    if (!firstRequest && (resVal === 2 || resVal === '2'))
      resNum++; // next result;

    const o = data.hits[resNum];
    let text = o._source.business_name || (o._source.first_name + o._source.last_name);
    let phone = phoneString(o._source.phone, o._source.phone_2);

    if (firstRequest) {
      response = `read=t-נמצאו ${data.total} תוצאות ${text} ${phone} להתקשרות הקש 1`;
      if ((resNum + 1) < data.total) response = `${response} לשמיעת התוצאה הבאה הקש 2`
      response = `${response}=Result${resNum},no,1,1,7,number,no,no&`;
    } else {
      if (resVal === 1 || resVal === '1') { // call to number
        response = `id_list_message=t- מיד תועברו ל ${text}&routing=${phone}&`;
      } else if (resVal === 2 || resVal === '2') { // send next result
        response = `read=t- ${text} ${phone} להתקשרות הקש 1`;
        if ((resNum + 1) < data.total) response = `${response} לשמיעת התוצאה הבאה הקש 2`
        response = `${response}=Result${resNum},no,1,1,7,number,no,no&`;
      } else return res.send('id_list_message=t-הקשתם מספר שגוי&');
    }
    console.log('response', response);
    res.send(response);
  }).catch(function (error) {
    res.status(500).send(error);
  });
}

module.exports = {
  yemot: yemot
};
