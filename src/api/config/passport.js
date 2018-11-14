require('../models/user');

var passport = require('passport'),
  mongoose = require('mongoose')
User = mongoose.model('User');
config = require('./index'),
  JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  LocalStrategy = require('passport-local');

var localOptions = {
  usernameField: 'email'
};

var localLogin = new LocalStrategy(localOptions, function (email, password, done) {
  User.findOne({
    email: email
  }, function (err, user) {
    if (err) {
      console.log('errLogin',err)
      return done(err);
    }
    if (!user) {
      return done(null, false, {
        error: 'Your login details could not be verified. Please try again.'
      });
    }

    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        console.log('err in compare password',err)
        return done(err);
      }
      if (!isMatch) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        });
      }

      return done(null, user);
    });
  });
});

var jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  // Telling Passport where to find the secret
  secretOrKey: config.tokenSecret
};

var jwtLogin = new JwtStrategy(jwtOptions, function (payload, done) {
  User.findById(payload._id, function (err, user) {
    if (err) {
      console.log('JwtStrategy err',err)
      return done(err, false);
    }

    if (user) {
      done(null, user);
    } else {
      console.log('errrr',err)
      done(null, false);
    }
  });
});

passport.use(jwtLogin);
passport.use(localLogin);
