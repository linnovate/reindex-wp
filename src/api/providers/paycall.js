var config = require('../config'),
  apiUrl = `http://${config.paycall.uname}:${config.paycall.pass}@ws.callindex.co.il/index.php`,
  request = require('request'),
  emailsCtrl = require('../controllers/emails');


module.exports = {
  commitAction: function (action, method, data) {
    data.out = 'json';
    data.action = action;
    data.uId = config.paycall.uid;
    data.dest = 2;
    return new Promise(function (resolve, reject) {
      var objReq = {
        uri: apiUrl,
        method: method,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      };

      if (method === 'POST') objReq.form = data;

      request(objReq, function (error, response, body) {
        if (!error && response.statusCode >= 200 && response.body.length) {
          var res;
          try {
            res = JSON.parse(body);
          } catch (e) {
            res = body.split(',');
            var obj = {};
            for (var i = 0 ; i < res.length; i++)
              obj[res[i].split(':')[0]] = res[i].split(':')[1];
            res = obj;
          }
          if (res.Response && (res.Response === 0 || res.Response === '0')) {
            emailsCtrl.sendPayCallError(error || response.body);
            return reject(error || response.body);
          } else return resolve(res);
        };
        emailsCtrl.sendPayCallError(error || response.body);
        reject(error || response.body);
      });
    });
  }
};