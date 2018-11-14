var PayCall = require('../providers/paycall');


module.exports = {
  addRoute: function (data) {
    return new Promise(function (resolve, reject) {
      data.assignDdi = 1;
      data.sId = 59367; // number of the group
      PayCall.commitAction('addRoute', 'POST', data).then(function (data) {
        if (data.Err) {
          return reject(data.Err);
        }
        resolve(data);
      }).catch(function (error) {
        reject(error);
      });
    });
  },
  getCalls: function (data) {
    data = {
      fromDate: '01-01-2017',
      toDate: '01-05-2017',
      limit: '50',
    };
    PayCall.commitAction('getCalls', 'POST', data).then(function (data) {
      console.log(data);
    }).catch(function (error) {
      console.log(error);
    });
  },
  unsetRoute: function (data) {
    return new Promise(function (resolve, reject) {
      PayCall.commitAction('unsetRoute', 'POST', data).then(function (_data) {
        resolve(_data);
      }).catch(function (error) {
        reject(error);
      });
    });
  },
  freePrmNumber: function (data) {
    return new Promise(function (resolve, reject) {
      PayCall.commitAction('freePrmNumber', 'POST', data).then(function (_data) {
        resolve(_data);
      }).catch(function (error) {
        reject(error);
      });
    });
  }
}
