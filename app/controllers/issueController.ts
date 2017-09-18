import { Router, Request, Response } from 'express';
import * as myDb from '../helpers/db';
import * as auth from '../helpers/auth';
import * as multer from 'multer';
import * as fs from 'fs';
import * as myConfig from 'config';
import * as async from 'async';

const router: Router = Router();
let config: any = myConfig.get('Config');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = config.uploadPath + req.params.folderName;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

var upload = multer({ storage: storage });

router.post('/search', (req: Request, res: Response) => {
    let dat = req.body;

    var sql = `
        select 
            issue_id as "issueId"
            , issue_project as "issueProject"
            , item.item_desc as "issueProjectDesc"
            , item.item_value as "issueProjectImg"
            , date_format(issue_date, '%d/%m/%Y') as "issueDate"
            , issue_by as "issueBy"
            , issue_type as "issueType"
            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'TYPE' and item_code = issue_type) as "issueTypeDesc"
            , issue_module as "issueModule"
            , issue_desc as "issueDesc"
            , issue_priority as "issuePriority"
            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'PRIORITY' and item_code = issue_priority) as "issuePriorityDesc"
            , issue_status as "issueStatus"
            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'STATUS' and item_code = issue_status) as "issueStatusDesc"
            , issue_solution as "issueSolution"
            , issue_pic as "issuePic"
            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'PIC' and item_value = issue_pic) as "issuePicDesc"
            , date_format(issue_target, '%d/%m/%Y') as "issueTarget"
            , date_format(issue_closed, '%d/%m/%Y') as "issueClosed"
        from sc_issue , sc_entry_item item
        where item.param_code = 'ISSUE'
            and item.entry_code = 'PROJECT'
            and item.item_code = issue_project
            and issue_project like '%${dat.issueProject}%'
            and issue_status like '%${dat.issueStatus}%'
            and issue_pic like '%${dat.issuePic}%'
            and issue_desc like '%${dat.issueDesc}%'
            and  
                case '${dat.issueClosed}' 
                    when '' then true 
                    when DATE_FORMAT(ifnull(issue_closed, sysdate()), '%d/%m/%Y') then true
                    else false 
                end
            and issue_id like '%${dat.issueId}%'
            and issue_module like '%${dat.issueModule}%'
            and issue_priority like '%${dat.issuePriority}%'
        order by  issue_cre_dat desc
        limit ${dat.rowPerPage}
        offset ${dat.offset}
    `;

    var count_sql = `
        select count(*) as "totalCount"
        from sc_issue 
        where issue_project like '%${dat.issueProject}%'
            and issue_status like '%${dat.issueStatus}%'
            and issue_pic like '%${dat.issuePic}%'
            and issue_desc like '%${dat.issueDesc}%'
            and  
            case '${dat.issueClosed}' 
            when '' then true 
            when DATE_FORMAT(ifnull(issue_closed, sysdate()), '%d/%m/%Y') then true
            else false end
            and issue_id like '%${dat.issueId}%'
            and issue_module like '%${dat.issueModule}%'
            and issue_priority like '%${dat.issuePriority}%'
    `;

    async.parallel([
        function(callback) {
            myDb.myQuery(sql, callback);
        },
        function(callback) {
            myDb.myQuery(count_sql, callback);
        }
    ],
    // optional callback
    function(err, results) {
        var totalCount = results[1][0].totalCount;
        var totalPage = Math.ceil(totalCount / dat.rowPerPage);
        var currentPage = (dat.offset / dat.rowPerPage) + 1;
        var next_offset = dat.offset + dat.rowPerPage;

        var ret = {
            paging: {
                offset: next_offset,
                total_page: totalPage,
                current_page: currentPage,
                total_count: totalCount
            },
            rows : results[0]
        }

        res.json(ret);
    });
});

router.get('/findByID/:id', auth.authenticate(),
    function (req, res) {
        var sql = `
            select 
                issue_id as "issueId"
                , issue_project as "issueProject"
                , date_format(issue_date, '%d/%m/%Y') as "issueDate"
                , issue_by as "issueBy"
                , issue_type as "issueType"
                , issue_module as "issueModule"
                , issue_desc as "issueDesc"
                , issue_priority as "issuePriority"
                , issue_status as "issueStatus"
                , issue_solution as "issueSolution"
                , issue_pic as "issuePic"
                , ifnull(date_format(issue_target, '%d/%m/%Y'),'') as "issueTarget"
                , ifnull(date_format(issue_closed, '%d/%m/%Y'),'') as "issueClosed"
            from sc_issue 
            where issue_id = '${req.params.id}'
        `;

        myDb.myQuery(sql, (err, rows) => {
            if(!err){
                res.json(rows);
            }
        });
    }
);

router.get('/getDataDDL', (req: Request, res: Response) => { 
    var sql_project = `
        select
            item_code as "pkCode"
            , item_code as "itemCode"
            , item_desc as "itemDesc"
            , item_value as "itemValue"
        from sc_entry_item
        where param_code = 'ISSUE'
            and entry_code = 'PROJECT'
        order by item_desc;
    `;

    var sql_type = `
        select
            item_code as "pkCode"
            , item_code as "itemCode"
            , item_desc as "itemDesc"
            , item_value as "itemValue"
        from sc_entry_item
        where param_code = 'ISSUE'
            and entry_code = 'TYPE'
        order by item_desc;
    `;

    var sql_priority = `
        select
            item_code as "pkCode"
            , item_code as "itemCode"
            , item_desc as "itemDesc"
            , item_value as "itemValue"
        from sc_entry_item
        where param_code = 'ISSUE'
            and entry_code = 'PRIORITY'
        order by item_code;
    `;

    var sql_status = `
        select
            item_code as "pkCode"
            , item_code as "itemCode"
            , item_desc as "itemDesc"
            , item_value as "itemValue"
        from sc_entry_item
        where param_code = 'ISSUE'
            and entry_code = 'STATUS'
        order by item_desc;
    `;

    var sql_pic = `
        select
            item_code as "pkCode"
            , item_code as "itemCode"
            , item_desc as "itemDesc"
            , item_value as "itemValue"
        from sc_entry_item
        where param_code = 'ISSUE'
            and entry_code = 'PIC'
        order by item_desc;
    `;
    

    async.parallel({
        projectList: function(callback) {
            myDb.myQuery(sql_project, (err, rows) => {
                callback(null, rows);
            });
        },
        typeList: function(callback) {
            myDb.myQuery(sql_type, (err, rows) => {
                callback(null, rows);
            });
        },
        priorityList: function(callback) {
            myDb.myQuery(sql_priority, (err, rows) => {
                callback(null, rows);
            });
        },
        statusList: function(callback) {
            myDb.myQuery(sql_status, (err, rows) => {
                callback(null, rows);
            });
        },
        picList: function(callback) {
            myDb.myQuery(sql_pic, (err, rows) => {
                callback(null, rows);
            });
        }
    }, function(err, results) {
        res.json(results);
    });
});

router.get('/getIssueBy/:issueProject', (req: Request, res: Response) => { 
    var sql = `
        select distinct issue_by as "issueBy" 
        from sc_issue 
        where issue_project = '${req.params.issueProject}'
    `;

    myDb.myQuery(sql, (err, rows) => {
        if(!err){
            res.json(rows);
        }
    });
}
);

router.post('', auth.authenticate(),
    function (req, res) {
        var userInfo = req.user;
        var dat = req.body;
        var sql = `
            insert into sc_issue(
                issue_project
                , issue_date
                , issue_by
                , issue_type
                , issue_module
                , issue_desc
                , issue_priority
                , issue_status
                , issue_solution
                , issue_pic
                , issue_target
                , issue_closed
                , issue_cre
                , issue_cre_dat
                , issue_upd
                , issue_upd_dat
            ) values (
                '${dat.issueProject}'
                , STR_TO_DATE('${dat.issueDate}', '%d/%m/%Y')
                , '${dat.issueBy}'
                , '${dat.issueType}'
                , '${dat.issueModule}'
                , '${dat.issueDesc}'
                , '${dat.issuePriority}'
                , '${dat.issueStatus}'
                , '${dat.issueSolution}'
                , '${dat.issuePic}'
                , case '${dat.issueTarget}' when '' then null else STR_TO_DATE('${dat.issueTarget}', '%d/%m/%Y') end
                , case '${dat.issueClosed}' when '' then null else STR_TO_DATE('${dat.issueClosed}', '%d/%m/%Y') end
                , '${userInfo.userCode}'
                , sysdate()
                , '${userInfo.userCode}'
                , sysdate()
            );
        `;

        myDb.myQuery(sql, (err, rows) => {
            var ret = {};
            if (err) {
                ret = {
                    status: false,
                    message: err
                };
            } else {
                ret = {
                    status: true,
                    message: 'Complete'
                };
            }
            return res.json(ret);
        });
    }
);

router.put('', auth.authenticate(),
    function (req, res) {
        var userInfo = req.user;
        var dat = req.body;
        var sql = `
            update sc_issue set 
                issue_project = '${dat.issueProject}'
                , issue_date = STR_TO_DATE('${dat.issueDate}', '%d/%m/%Y')
                , issue_by = '${dat.issueBy}'
                , issue_type = '${dat.issueType}'
                , issue_module = '${dat.issueModule}'
                , issue_desc = '${dat.issueDesc}'
                , issue_priority = '${dat.issuePriority}'
                , issue_status = '${dat.issueStatus}'
                , issue_solution = '${dat.issueSolution}'
                , issue_pic = '${dat.issuePic}'
                , issue_target = case '${dat.issueTarget}' when '' then null else STR_TO_DATE('${dat.issueTarget}', '%d/%m/%Y') end
                , issue_closed = case '${dat.issueClosed}' when '' then null else STR_TO_DATE('${dat.issueClosed}', '%d/%m/%Y') end
                , issue_upd = '${userInfo.userCode}'
                , issue_upd_dat = sysdate()
            where issue_id = '${dat.issueId}';
        `;

        myDb.myQuery(sql, (err, rows) => {
            var ret = {};
            if (err) {
                ret = {
                    status: false,
                    message: err
                };
            } else {
                ret = {
                    status: true,
                    message: 'Complete'
                };
            }
            return res.json(ret);
        });
    }
);
router.delete('/:id', (req: Request, res: Response) => {
    var sql = `
        delete from sc_issue where issue_id = '${req.params.id}'
    `;
    myDb.myQuery(sql, (err, rows) => {
        if(err){
            res.end();
        }else{
            res.json(rows);
        }
    });
});

router.post('/attach/:folderName', upload.single('attach'),(req: Request, res: Response) => {
    res.json({
        success: true
    });
});

router.get('/attach/:folderName', (req: Request, res: Response) => {
    let folder = config.uploadPath + req.params.folderName;
    if (fs.existsSync(folder)) {
        fs.readdir(folder, (err, files) => {
            res.json(files);
        });
    } else {
        res.json([]);
    }
});

router.get('/view-attach/:folderName/:fileName', (req: Request, res: Response) => {
    fs.readFile(
    `${config.uploadPath}${req.params.folderName}/${req.params.fileName}`
    , (err, data) => {
        if (!err) {
            res.write(data);
            res.end();
        } else {
            res.end();
        }
    });
});

router.delete('/removeFile/:folderName/:fileName', (req: Request, res: Response) => {
    fs.unlink(
    `${config.uploadPath}${req.params.folderName}/${req.params.fileName}`
    , (err) => {
        if (!err) {
            res.json({
                success: true
            });
        } else {
            res.write(err);
            res.end();
        }
    });
});

export const IssueController: Router = router;