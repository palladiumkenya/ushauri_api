const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
// const express = require('express');



//const users = [];

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true
};
const Sequelize = require("sequelize");

// const app = express();

module.exports = passport => {
  passport.use(
    new JwtStrategy(opts, async (req, jwt_payload, done) => {
      const {
        NUsers
      } = require("./models/n_users");
      const { NToken } = require("./models/n_revoke_token");
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      const revokedToken = await NToken.findOne({
        where: { token: token }
      });

      if (revokedToken) {
        return done(null, false, { message: 'Token has been revoked' });
      }

     // console.log(jwt_payload.username);
      const user = NUsers.findOne({
        where: {
         id: jwt_payload.username,
        refresh_token: {
        [Sequelize.Op.ne]: null  // Sequelize operator for 'not equal to null'
        }
        }
       });

      console.log(user);
    //  const user = NUsers.find(u => u.id === jwt_payload.username);

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    })
  );
  // app.use(passport.initialize());
};