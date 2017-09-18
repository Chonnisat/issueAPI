"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var auth = require("./helpers/auth");
var loginController_1 = require("./controllers/loginController");
var issueController_1 = require("./controllers/issueController");
var uploadController_1 = require("./controllers/uploadController");
var app = express();
var port = process.env.PORT || '3000';
app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(auth.initialize());
app.use('/api/v1/login', loginController_1.LoginController);
app.use('/api/v1/issue', issueController_1.IssueController);
app.use('/api/v1/upload', uploadController_1.UploadController);
var server = app.listen(port, function () {
    // Success callback
    console.log("Listening at http://localhost:" + port + "/");
});
//# sourceMappingURL=D:/workspace_pnp/issueAPI/server.js.map