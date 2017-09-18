import { Router, Request, Response } from 'express';
import * as async from 'async';
import * as fs from 'fs';
import * as multer from 'multer';
import * as gm from 'gm';
import * as myConfig from 'config';
import * as apicache from 'apicache';
let cache = apicache.middleware;

let config:any = myConfig.get('Config');
const router: Router = Router();

var storage = multer.diskStorage({
	destination: function (req : Request, file, cb) {
		if (req.params.folderName) {
			var dir = `${config.uploadPath}${req.params.folderName}/${req.params.id}/`;
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
				cb(null, dir);
			} else {
				cb(null, dir);
			}
		} else {
			cb(null, "folder name not found.");
		}
	},
	filename: function (req : Request, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	}
});

var upload = multer({ 
	storage: storage,
	limits: {
        files: 1,
        fileSize: 1 * 1024 * 1024
	},
	fileFilter: function(req, file, cb) {
		var type = file.mimetype;
		if (type !== 'image/png' && type !== 'image/jpg' && type !== 'image/jpeg' && type !== 'application/pdf') {
			cb(new Error('Invalid file type.'), false);
		} else {
			cb(null, true);
		}
	}
});

router.post('/picture/:folderName/:id', upload.array('uploads', 1), function (req, res, next) {
	async.map(req['files'], function (err, results) {
		res.send({
			success: true,
			filename: req['files'][0]['filename']
		});
	});
});

router.get('/viewImg/:folderName/:id/:fileName', cache('5 minutes'), function(req, res){
	fs.readFile(`${config.uploadPath}${req.params.folderName}/${req.params.id}/${req.params.fileName}`, function(err, data){
		if(!err){
			res.write(data);
			res.end();
		}else{
			res.end();
		}
	});
});


router.get('/viewImgBySize/:iWidth/:iHeight/:folderName/:id/:fileName', cache('5 minutes'), function(req, res){
	fs.readFile(`${config.uploadPath}/${req.params.folderName}/${req.params.id}/${req.params.fileName}`, function(err, data){
		if(!err){
			gm(`${config.uploadPath}/${req.params.folderName}/${req.params.id}/${req.params.fileName}`)
			.resize(req.params.iWidth, req.params.iHeight)
			.quality(100)
			.compress('Lossless')
			.stream()
			.pipe(res);
		}else{
			res.end();
		}
	});
});

router.use(function (err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.send({ 
		success: false,
		message: 'File to larger than 1MB.' 
	});
  }else{
	  res.send({ 
		success: false,
		message: err.message 
	});
  }
});

export const UploadController: Router = router;