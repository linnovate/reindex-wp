'use strict';

var emailProvider = require('../providers/mails'),
  Constants = require('../config/constants'),
  messages = require('../config/messages'),
  users = require('./users'),
  _ = require('lodash'),
  config = require('../config'),
  request = require('request'),
  async = require('async');

function getRecipients(req) {
  return new Promise(function (resolve, reject) {
    if (req.body.to) return resolve(req.body.to);
    users.getAdmins().then(function (admins) {
      var to = _.map(admins, 'email').toString();
      return resolve(to);
    }).catch(function (error) {
      reject(error);
    });
  });
}

function checkLeads(req) {
  if (config.testLeads && req.body && req.body.subject && req.body.subject === 'LANDING_PAGE')
  request(`https://hooks.zapier.com/hooks/catch/1996558/9qyvy0?name=${req.body.name}&phone=${req.body.phone}&email=${req.body.email}`, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred 
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    console.log('body:', body); // Print the HTML for the Google homepage. 
  });
}

module.exports = {
  send: function (req, res, next) {

    checkLeads(req);

    getRecipients(req).then(function (recipients) {
      var to = recipients,
        from = 'orit@linnovate.net',
        subject = Constants.EMAILS_SUBJECTS[req.body.subject],
        text = `name: ${req.body.name}<br> phone: ${req.body.phone}<br> email: ${req.body.email}<br>`;
        text += (req.body.search_text) ? `searchText: ${req.body.search_text}` : '';
        text += (req.body.message) ? `message: ${req.body.message}` : '';
        

      emailProvider.send(from, to, subject, text).then(function (response) {
        res.send(messages.successes.mailSent);
      }).catch(function (error) {
        res.status(500).send(messages.errors.mailFailed);
      });
    }).catch(function (error) {
      res.status(500).send(messages.errors.mailFailed);
    });
  },
  sendPayCallError: function (error) {
    users.getAdmins().then(function (admins) {
      var to = _.map(admins, 'email').toString(),
        from = 'orit@linnovate.net',
        subject = Constants.EMAILS_SUBJECTS.PAYCALL_ERROR,
        text = `${error}`;

      emailProvider.send(from, to, subject, text).then(function (response) {
        res.send(messages.successes.mailSent);
      }).catch(function (error) {
        console.log(messages.errors.mailFailed);
      });
    }).catch(function (error) {
      console.log(messages.errors.mailFailed);
    });
  },
  register2MailingList : 
  function(req, res ,next){
    var contactListName, updateUserId ,updateContactListName;
    if (req.query.type) {
      let userId = config.messereser[req.query.type].userId;
      contactListName = config.messereser[req.query.type].contactListName;
      updateUserId = config.messereser['update'+req.query.type].userId;
      updateContactListName = config.messereser['update'+req.query.type].contactListName;
      var lastName = req.query.type == 'bis'?req.body.bisName: req.body.lastName;   
      let firstName = req.query.type == 'bis'?'': req.body.firstName;    
      async.parallel([
        function(callback) {
          request({
            url: 'http://ns.mesereser.com/Services/Services.asmx?wsdl',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8'
            },
            body: `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://messagingsystem.co.il/">
                    <SOAP-ENV:Body>
                     <ns1:CreateContact>
                        <ns1:oLogin>
                        <ns1:UserName>${config.messereser.userName}</ns1:UserName>
                        <ns1:Password>${config.messereser.password}</ns1:Password>
                        </ns1:oLogin>
                        <ns1:iUserID>${userId}</ns1:iUserID>
                        <ns1:sContactListName>${contactListName}</ns1:sContactListName>
                        <ns1:sEMail>${req.body.email}</ns1:sEMail>
                        <ns1:sFirstName>${firstName}</ns1:sFirstName>
                        <ns1:sLastName>${lastName}</ns1:sLastName>
                        <ns1:sPhoneNo>${req.body.phone}</ns1:sPhoneNo>
                        <ns1:sAddress>${req.body.ip}</ns1:sAddress>
                        <ns1:sCity></ns1:sCity>
                        <ns1:sZipcode></ns1:sZipcode>
                        <ns1:sCustomField1></ns1:sCustomField1>
                        <ns1:sCustomField2></ns1:sCustomField2>
                        <ns1:sCustomField3></ns1:sCustomField3>
                        <ns1:sCustomField4></ns1:sCustomField4>
                      <ns1:sCustomField5></ns1:sCustomField5>
                      </ns1:CreateContact>
                  </SOAP-ENV:Body>
                  </SOAP-ENV:Envelope>`
        }, function(error, response, body) {
          if (error)
            console.log('error update in messer10', error);
          callback()
        })
        },
        function(callback) {
          request({
            url: 'http://ns.mesereser.com/Services/Services.asmx?wsdl',
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8'
            },
            body: `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://messagingsystem.co.il/">
                    <SOAP-ENV:Body>
                     <ns1:CreateContact>
                        <ns1:oLogin>
                        <ns1:UserName>${config.messereser.userName}</ns1:UserName>
                        <ns1:Password>${config.messereser.password}</ns1:Password>
                        </ns1:oLogin>
                        <ns1:iUserID>${updateUserId}</ns1:iUserID>
                        <ns1:sContactListName>${updateContactListName}</ns1:sContactListName>
                        <ns1:sEMail>${req.query.email}</ns1:sEMail>
                        <ns1:sFirstName>${req.query.fname}</ns1:sFirstName>
                        <ns1:sLastName>${req.query.lname}</ns1:sLastName>
                        <ns1:sPhoneNo>${req.query.phone}</ns1:sPhoneNo>
                        <ns1:sAddress>${req.body.ip}</ns1:sAddress>
                        <ns1:sCity></ns1:sCity>
                        <ns1:sZipcode></ns1:sZipcode>
                        <ns1:sCustomField1></ns1:sCustomField1>
                        <ns1:sCustomField2></ns1:sCustomField2>
                        <ns1:sCustomField3></ns1:sCustomField3>
                        <ns1:sCustomField4></ns1:sCustomField4>
                      <ns1:sCustomField5></ns1:sCustomField5>
                      </ns1:CreateContact>
                  </SOAP-ENV:Body>
                  </SOAP-ENV:Envelope>`
        }, function(error, response, body) {
          if (error)
             console.log('error update in messer10', error);
          callback()
         });
        }
    ],
    // optional callback
    function(err, results) {
        res.send('updates')
    });
    }
  }
}
