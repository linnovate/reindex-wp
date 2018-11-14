'use strict';
var nodemailer = require('nodemailer'),
  config = require('../config');


// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

exports.send = function (from, to, subject, text) {

  // setup email data with unicode symbols
  let mailOptions = {
    from: `"reindex" <${from}>`, // sender address
    to: to.toString(), // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: text // html body
  };


  return new Promise(function (resolve, reject) {
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      console.log('SEND MAIL RESPONSE:', error, info);
      if (error) return reject(error);
      resolve(`Message ${info.messageId} sent: ${info.response}`);
    });
  });
}
