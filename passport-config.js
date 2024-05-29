const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;



//const users = [];

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};
const Sequelize = require("sequelize");

module.exports = passport => {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      const {
        NUsers
      } = require("./models/n_users");

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
};