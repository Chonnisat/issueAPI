import * as mysql from 'mysql';
import * as myConfig from 'config';
let config: any = myConfig.get('Config');

class MyDb {

    pool = mysql.createPool(config.mysql);

    doQuery(sql): Promise<any> {
        let me = this;
        return new Promise((resolve, reject) => {
            me.pool.getConnection((err, conn) => {
                if (err) {
                    reject(err);
                } else {
                    conn.query(sql, (error, results, fields) => {
                        conn.release();
                        if (!error) {
                            resolve(results);
                        } else {
                            reject(error);
                        }
                    });
                }
            })
        });
    }

    myQuery(sql, cb) {
        this.doQuery(sql).then((result) => {
            cb(null, result);
        }).catch((err) => {
            cb(err, null);
        });
    }
}

var myDb = new MyDb();

export = myDb;
