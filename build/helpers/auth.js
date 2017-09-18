"use strict";
var passport = require("passport");
var passportJWT = require("passport-jwt");
var myConfig = require("config");
var config = myConfig.get('Config');
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;
var params = {
    secretOrKey: config.auth.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeader()
};
// var jwt = function () {
var Auth = (function () {
    function Auth() {
        var strategy = new Strategy(params, function (payload, done) {
            // console.log(payload);
            //var user = { id: "888" } //users[payload.id] || null;
            var user = payload;
            if (user) {
                return done(null, user);
            }
            else {
                return done(new Error("User not found"), null);
            }
        });
        passport.use(strategy);
    }
    Auth.prototype.initialize = function () {
        return passport.initialize();
    };
    Auth.prototype.authenticate = function () {
        return passport.authenticate("jwt", config.auth.jwtSession);
    };
    return Auth;
}());
;
var jwt = new Auth();
module.exports = jwt;
//# sourceMappingURL=D:/workspace_pnp/issueAPI/helpers/auth.js.map