import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as auth from './helpers/auth';

import { LoginController } from './controllers/loginController';
import { IssueController } from './controllers/issueController';
import { UploadController } from './controllers/uploadController';

const app: express.Application = express();
const port: string = process.env.PORT || '3000';

app.use(cors());
app.options('*', cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use( auth.initialize() );

app.use('/api/v1/login', LoginController);
app.use('/api/v1/issue', IssueController);
app.use('/api/v1/upload', UploadController);

var server = app.listen(port, () => {
// Success callback
console.log(`Listening at http://localhost:${port}/`);
});