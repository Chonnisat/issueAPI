"use strict";
var mysql = require("mysql");
var myConfig = require("config");
var config = myConfig.get('Config');
var MyDb = (function () {
    function MyDb() {
        this.pool = mysql.createPool(config.mysql);
    }
    MyDb.prototype.doQuery = function (sql) {
        var me = this;
        return new Promise(function (resolve, reject) {
            me.pool.getConnection(function (err, conn) {
                if (err) {
                    reject(err);
                }
                else {
                    conn.query(sql, function (error, results, fields) {
                        conn.release();
                        if (!error) {
                            resolve(results);
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            });
        });
    };
    MyDb.prototype.myQuery = function (sql, cb) {
        this.doQuery(sql).then(function (result) {
            cb(null, result);
        }).catch(function (err) {
            cb(err, null);
        });
    };
    return MyDb;
}());
var myDb = new MyDb();
module.exports = myDb;
//# sourceMappingURL=D:/workspace_pnp/issueAPI/helpers/db.js.map