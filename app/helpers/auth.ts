
import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import * as myConfig from 'config';

let config:any = myConfig.get('Config');
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;
var params = {
    secretOrKey: config.auth.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeader()
};

// var jwt = function () {
class Auth {
    constructor() {
        let strategy = new Strategy(params, function (payload, done) {
            // console.log(payload);
            //var user = { id: "888" } //users[payload.id] || null;
            var user = payload;
            if (user) {
                return done(null, user);
            } else {
                return done(new Error("User not found"), null);
            }
        });
        passport.use(strategy);
    }

    initialize(): any {
        return passport.initialize();
    }

    authenticate(): any {
        return passport.authenticate("jwt", config.auth.jwtSession);
    }
};
var jwt = new Auth();
export = jwt;