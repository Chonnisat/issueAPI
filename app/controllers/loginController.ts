import { Router, Request, Response } from 'express';
import * as myDb from '../helpers/db';
import * as myConfig from 'config';

let config:any = myConfig.get('Config');
var jwt = require("jwt-simple");  

const router: Router = Router();

router.post("/doLogin", function(req, res) {  
    var dat = req.body;
    if (dat.userCode && dat.userPwd) {
        let sql = `
            select 
                user_code as "userCode"
                , user_first_name as "userName"
                , user_last_name as "userLastName"
                , prof_code as "profCode"
                , user_email as "userEmail"
            from sc_user 
            where (user_code = '${dat.userCode}' or user_email = '${dat.userCode}') 
                and user_pwd = '${dat.userPwd}' and user_active = 'Y';
        `;

        myDb.doQuery(sql).then((results) => {
            var userInfo = results[0];
            if (userInfo) {
                var token = jwt.encode(userInfo, config.auth.jwtSecret);
                
                res.json({
                    success : true,
                    auth_token: token,
                    userName : `${userInfo.userName} ${userInfo.userLastName}`
                });
            }else{
                res.json({
                    success : false,
                    message : 'Login fail.'
                });
            }
        }).catch((err) => {
            res.sendStatus(401);
        });
    } else {
        res.sendStatus(401);
    }
});

export const LoginController: Router = router;