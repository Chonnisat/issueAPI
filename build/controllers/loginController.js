"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var myDb = require("../helpers/db");
var myConfig = require("config");
var config = myConfig.get('Config');
var jwt = require("jwt-simple");
var router = express_1.Router();
router.post("/doLogin", function (req, res) {
    var dat = req.body;
    if (dat.userCode && dat.userPwd) {
        var sql = "\n            select \n                user_code as \"userCode\"\n                , user_first_name as \"userName\"\n                , user_last_name as \"userLastName\"\n                , prof_code as \"profCode\"\n                , user_email as \"userEmail\"\n            from sc_user \n            where (user_code = '" + dat.userCode + "' or user_email = '" + dat.userCode + "') \n                and user_pwd = '" + dat.userPwd + "' and user_active = 'Y';\n        ";
        myDb.doQuery(sql).then(function (results) {
            var userInfo = results[0];
            if (userInfo) {
                var token = jwt.encode(userInfo, config.auth.jwtSecret);
                res.json({
                    success: true,
                    auth_token: token,
                    userName: userInfo.userName + " " + userInfo.userLastName
                });
            }
            else {
                res.json({
                    success: false,
                    message: 'Login fail.'
                });
            }
        }).catch(function (err) {
            res.sendStatus(401);
        });
    }
    else {
        res.sendStatus(401);
    }
});
exports.LoginController = router;
//# sourceMappingURL=D:/workspace_pnp/issueAPI/controllers/loginController.js.map