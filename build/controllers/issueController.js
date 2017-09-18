"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var myDb = require("../helpers/db");
var auth = require("../helpers/auth");
var multer = require("multer");
var fs = require("fs");
var myConfig = require("config");
var async = require("async");
var router = express_1.Router();
var config = myConfig.get('Config');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var folder = config.uploadPath + req.params.folderName;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({ storage: storage });
router.post('/search', function (req, res) {
    var dat = req.body;
    var sql = "\n        select \n            issue_id as \"issueId\"\n            , issue_project as \"issueProject\"\n            , item.item_desc as \"issueProjectDesc\"\n            , item.item_value as \"issueProjectImg\"\n            , date_format(issue_date, '%d/%m/%Y') as \"issueDate\"\n            , issue_by as \"issueBy\"\n            , issue_type as \"issueType\"\n            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'TYPE' and item_code = issue_type) as \"issueTypeDesc\"\n            , issue_module as \"issueModule\"\n            , issue_desc as \"issueDesc\"\n            , issue_priority as \"issuePriority\"\n            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'PRIORITY' and item_code = issue_priority) as \"issuePriorityDesc\"\n            , issue_status as \"issueStatus\"\n            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'STATUS' and item_code = issue_status) as \"issueStatusDesc\"\n            , issue_solution as \"issueSolution\"\n            , issue_pic as \"issuePic\"\n            , (select item_desc from sc_entry_item where param_code = 'ISSUE' and entry_code = 'PIC' and item_value = issue_pic) as \"issuePicDesc\"\n            , date_format(issue_target, '%d/%m/%Y') as \"issueTarget\"\n            , date_format(issue_closed, '%d/%m/%Y') as \"issueClosed\"\n        from sc_issue , sc_entry_item item\n        where item.param_code = 'ISSUE'\n            and item.entry_code = 'PROJECT'\n            and item.item_code = issue_project\n            and issue_project like '%" + dat.issueProject + "%'\n            and issue_status like '%" + dat.issueStatus + "%'\n            and issue_pic like '%" + dat.issuePic + "%'\n            and issue_desc like '%" + dat.issueDesc + "%'\n            and  \n                case '" + dat.issueClosed + "' \n                    when '' then true \n                    when DATE_FORMAT(ifnull(issue_closed, sysdate()), '%d/%m/%Y') then true\n                    else false \n                end\n            and issue_id like '%" + dat.issueId + "%'\n            and issue_module like '%" + dat.issueModule + "%'\n            and issue_priority like '%" + dat.issuePriority + "%'\n        order by  issue_cre_dat desc\n        limit " + dat.rowPerPage + "\n        offset " + dat.offset + "\n    ";
    var count_sql = "\n        select count(*) as \"totalCount\"\n        from sc_issue \n        where issue_project like '%" + dat.issueProject + "%'\n            and issue_status like '%" + dat.issueStatus + "%'\n            and issue_pic like '%" + dat.issuePic + "%'\n            and issue_desc like '%" + dat.issueDesc + "%'\n            and  \n            case '" + dat.issueClosed + "' \n            when '' then true \n            when DATE_FORMAT(ifnull(issue_closed, sysdate()), '%d/%m/%Y') then true\n            else false end\n            and issue_id like '%" + dat.issueId + "%'\n            and issue_module like '%" + dat.issueModule + "%'\n            and issue_priority like '%" + dat.issuePriority + "%'\n    ";
    async.parallel([
        function (callback) {
            myDb.myQuery(sql, callback);
        },
        function (callback) {
            myDb.myQuery(count_sql, callback);
        }
    ], 
    // optional callback
    function (err, results) {
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
            rows: results[0]
        };
        res.json(ret);
    });
});
router.get('/findByID/:id', auth.authenticate(), function (req, res) {
    var sql = "\n            select \n                issue_id as \"issueId\"\n                , issue_project as \"issueProject\"\n                , date_format(issue_date, '%d/%m/%Y') as \"issueDate\"\n                , issue_by as \"issueBy\"\n                , issue_type as \"issueType\"\n                , issue_module as \"issueModule\"\n                , issue_desc as \"issueDesc\"\n                , issue_priority as \"issuePriority\"\n                , issue_status as \"issueStatus\"\n                , issue_solution as \"issueSolution\"\n                , issue_pic as \"issuePic\"\n                , ifnull(date_format(issue_target, '%d/%m/%Y'),'') as \"issueTarget\"\n                , ifnull(date_format(issue_closed, '%d/%m/%Y'),'') as \"issueClosed\"\n            from sc_issue \n            where issue_id = '" + req.params.id + "'\n        ";
    myDb.myQuery(sql, function (err, rows) {
        if (!err) {
            res.json(rows);
        }
    });
});
router.get('/getDataDDL', function (req, res) {
    var sql_project = "\n        select\n            item_code as \"pkCode\"\n            , item_code as \"itemCode\"\n            , item_desc as \"itemDesc\"\n            , item_value as \"itemValue\"\n        from sc_entry_item\n        where param_code = 'ISSUE'\n            and entry_code = 'PROJECT'\n        order by item_desc;\n    ";
    var sql_type = "\n        select\n            item_code as \"pkCode\"\n            , item_code as \"itemCode\"\n            , item_desc as \"itemDesc\"\n            , item_value as \"itemValue\"\n        from sc_entry_item\n        where param_code = 'ISSUE'\n            and entry_code = 'TYPE'\n        order by item_desc;\n    ";
    var sql_priority = "\n        select\n            item_code as \"pkCode\"\n            , item_code as \"itemCode\"\n            , item_desc as \"itemDesc\"\n            , item_value as \"itemValue\"\n        from sc_entry_item\n        where param_code = 'ISSUE'\n            and entry_code = 'PRIORITY'\n        order by item_code;\n    ";
    var sql_status = "\n        select\n            item_code as \"pkCode\"\n            , item_code as \"itemCode\"\n            , item_desc as \"itemDesc\"\n            , item_value as \"itemValue\"\n        from sc_entry_item\n        where param_code = 'ISSUE'\n            and entry_code = 'STATUS'\n        order by item_desc;\n    ";
    var sql_pic = "\n        select\n            item_code as \"pkCode\"\n            , item_code as \"itemCode\"\n            , item_desc as \"itemDesc\"\n            , item_value as \"itemValue\"\n        from sc_entry_item\n        where param_code = 'ISSUE'\n            and entry_code = 'PIC'\n        order by item_desc;\n    ";
    async.parallel({
        projectList: function (callback) {
            myDb.myQuery(sql_project, function (err, rows) {
                callback(null, rows);
            });
        },
        typeList: function (callback) {
            myDb.myQuery(sql_type, function (err, rows) {
                callback(null, rows);
            });
        },
        priorityList: function (callback) {
            myDb.myQuery(sql_priority, function (err, rows) {
                callback(null, rows);
            });
        },
        statusList: function (callback) {
            myDb.myQuery(sql_status, function (err, rows) {
                callback(null, rows);
            });
        },
        picList: function (callback) {
            myDb.myQuery(sql_pic, function (err, rows) {
                callback(null, rows);
            });
        }
    }, function (err, results) {
        res.json(results);
    });
});
router.get('/getIssueBy/:issueProject', function (req, res) {
    var sql = "\n        select distinct issue_by as \"issueBy\" \n        from sc_issue \n        where issue_project = '" + req.params.issueProject + "'\n    ";
    myDb.myQuery(sql, function (err, rows) {
        if (!err) {
            res.json(rows);
        }
    });
});
router.post('', auth.authenticate(), function (req, res) {
    var userInfo = req.user;
    var dat = req.body;
    var sql = "\n            insert into sc_issue(\n                issue_project\n                , issue_date\n                , issue_by\n                , issue_type\n                , issue_module\n                , issue_desc\n                , issue_priority\n                , issue_status\n                , issue_solution\n                , issue_pic\n                , issue_target\n                , issue_closed\n                , issue_cre\n                , issue_cre_dat\n                , issue_upd\n                , issue_upd_dat\n            ) values (\n                '" + dat.issueProject + "'\n                , STR_TO_DATE('" + dat.issueDate + "', '%d/%m/%Y')\n                , '" + dat.issueBy + "'\n                , '" + dat.issueType + "'\n                , '" + dat.issueModule + "'\n                , '" + dat.issueDesc + "'\n                , '" + dat.issuePriority + "'\n                , '" + dat.issueStatus + "'\n                , '" + dat.issueSolution + "'\n                , '" + dat.issuePic + "'\n                , case '" + dat.issueTarget + "' when '' then null else STR_TO_DATE('" + dat.issueTarget + "', '%d/%m/%Y') end\n                , case '" + dat.issueClosed + "' when '' then null else STR_TO_DATE('" + dat.issueClosed + "', '%d/%m/%Y') end\n                , '" + userInfo.userCode + "'\n                , sysdate()\n                , '" + userInfo.userCode + "'\n                , sysdate()\n            );\n        ";
    myDb.myQuery(sql, function (err, rows) {
        var ret = {};
        if (err) {
            ret = {
                status: false,
                message: err
            };
        }
        else {
            ret = {
                status: true,
                message: 'Complete'
            };
        }
        return res.json(ret);
    });
});
router.put('', auth.authenticate(), function (req, res) {
    var userInfo = req.user;
    var dat = req.body;
    var sql = "\n            update sc_issue set \n                issue_project = '" + dat.issueProject + "'\n                , issue_date = STR_TO_DATE('" + dat.issueDate + "', '%d/%m/%Y')\n                , issue_by = '" + dat.issueBy + "'\n                , issue_type = '" + dat.issueType + "'\n                , issue_module = '" + dat.issueModule + "'\n                , issue_desc = '" + dat.issueDesc + "'\n                , issue_priority = '" + dat.issuePriority + "'\n                , issue_status = '" + dat.issueStatus + "'\n                , issue_solution = '" + dat.issueSolution + "'\n                , issue_pic = '" + dat.issuePic + "'\n                , issue_target = case '" + dat.issueTarget + "' when '' then null else STR_TO_DATE('" + dat.issueTarget + "', '%d/%m/%Y') end\n                , issue_closed = case '" + dat.issueClosed + "' when '' then null else STR_TO_DATE('" + dat.issueClosed + "', '%d/%m/%Y') end\n                , issue_upd = '" + userInfo.userCode + "'\n                , issue_upd_dat = sysdate()\n            where issue_id = '" + dat.issueId + "';\n        ";
    myDb.myQuery(sql, function (err, rows) {
        var ret = {};
        if (err) {
            ret = {
                status: false,
                message: err
            };
        }
        else {
            ret = {
                status: true,
                message: 'Complete'
            };
        }
        return res.json(ret);
    });
});
router.delete('/:id', function (req, res) {
    var sql = "\n        delete from sc_issue where issue_id = '" + req.params.id + "'\n    ";
    myDb.myQuery(sql, function (err, rows) {
        if (err) {
            res.end();
        }
        else {
            res.json(rows);
        }
    });
});
router.post('/attach/:folderName', upload.single('attach'), function (req, res) {
    res.json({
        success: true
    });
});
router.get('/attach/:folderName', function (req, res) {
    var folder = config.uploadPath + req.params.folderName;
    if (fs.existsSync(folder)) {
        fs.readdir(folder, function (err, files) {
            res.json(files);
        });
    }
    else {
        res.json([]);
    }
});
router.get('/view-attach/:folderName/:fileName', function (req, res) {
    fs.readFile("" + config.uploadPath + req.params.folderName + "/" + req.params.fileName, function (err, data) {
        if (!err) {
            res.write(data);
            res.end();
        }
        else {
            res.end();
        }
    });
});
router.delete('/removeFile/:folderName/:fileName', function (req, res) {
    fs.unlink("" + config.uploadPath + req.params.folderName + "/" + req.params.fileName, function (err) {
        if (!err) {
            res.json({
                success: true
            });
        }
        else {
            res.write(err);
            res.end();
        }
    });
});
exports.IssueController = router;
//# sourceMappingURL=D:/workspace_pnp/issueAPI/controllers/issueController.js.map