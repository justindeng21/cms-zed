"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiService = void 0;
const server_1 = require("./server");
const server_2 = require("./server");
const fs_1 = __importDefault(require("fs"));
const AWS = __importStar(require("aws-sdk"));
const passwordManager_1 = require("./passwordManager");
const database_1 = require("./database");
class apiService extends server_1.Server {
    constructor() {
        super();
        this.database = new database_1.CMSDatabase();
        this.passwordManager = new passwordManager_1.PasswordManager();
        this.defineEditorEndpoints();
        this.s3Bucket = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESSKEY,
            secretAccessKey: process.env.AWS_SECRETKEY
        });
        this.bucketName = 'testbackup-corelogic';
    }
    validateSession(cookies) {
        for (let i = 0; i <= cookies.length - 1; i++) {
            if (cookies[i].split('=')[0] === 'zeroAuth')
                return this.passwordManager.getHash(cookies[i].split('=')[1]);
        }
        return '';
    }
    uploadToS3(s3Key, bucketName) {
        const readStream = fs_1.default.createReadStream(s3Key);
        const params = {
            Bucket: bucketName,
            Key: s3Key,
            Body: readStream
        };
        return new Promise((resolve, reject) => {
            this.s3Bucket.upload(params, function (err, data) {
                readStream.destroy();
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }
    writeFile(s3Key, code) {
        fs_1.default.writeFile(s3Key, code, (err) => {
            if (err) {
                console.log('There was an error');
                return;
            }
            this.uploadToS3(s3Key, this.bucketName);
        });
        fs_1.default.unlink(s3Key, (err) => {
            if (err) {
                console.log('Unable to delete file');
                return;
            }
        });
    }
    writeToExternalBucket(accessKey, secretKey, s3Key, fileName, bucketName, contentType) {
        this.s3Bucket.getObject({ Bucket: this.bucketName, Key: s3Key }, function (err, data) {
            fs_1.default.writeFile(s3Key, data.Body.toString('utf-8'), (err) => {
                if (err) {
                    console.log('There was an error');
                    return;
                }
                let s3Bucket = new AWS.S3({
                    accessKeyId: accessKey,
                    secretAccessKey: secretKey
                });
                const readStream = fs_1.default.createReadStream(s3Key);
                const params = {
                    Bucket: bucketName,
                    Key: fileName,
                    Body: readStream,
                    content_type: contentType
                };
                return new Promise((resolve, reject) => {
                    s3Bucket.upload(params, function (err, data) {
                        readStream.destroy();
                        if (err) {
                            return reject(err);
                        }
                        return resolve(data);
                    });
                });
            });
        });
    }
    defineEditorEndpoints() {
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/user/new', server_2.jsonParser, (req, res) => {
            const username = req.body.username;
            const password = req.body.password;
            const email = req.body.email;
            this.database._createUser(username, email, password);
            res.send(204);
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////





        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.get('/apps', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        this.database._getApps(rows[0].userId).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/app', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const appId = req.body.appId;
                    if (rows.length !== 0) {
                        this.database._getFiles(rows[0].userId, Number(appId)).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/load', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                if (req.headers.cookie === undefined) {
                    res.sendStatus(401);
                }
                else {
                    const fileId = req.body.fileId;
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._loadFile(rows[0].userId, Number(fileId)).then((rows) => {
                                this.s3Bucket.getObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
                                    res.setHeader('content-type', 'application/json');
                                    res.send(JSON.stringify({ fileName: rows[0].fileName, content: encodeURIComponent(data.Body.toString('utf-8')) }));
                                });
                            });
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/build', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const appId = req.body.appId;
                    const secretKey = req.body.secretKey;
                    const accessKey = req.body.accessKey;
                    const bucketName = req.body.bucketName;
                    if (rows.length !== 0) {
                        this.database._getFiles(rows[0].userId, Number(appId)).then((rows) => {
                            for (var i = 0; i <= rows.length - 1; i++) {
                                let contentType = '';
                                if (rows[0].fileExtension === 'css')
                                    contentType = 'text/css';
                                if (rows[0].fileExtension === 'js')
                                    contentType = 'application/javascript';
                                if (rows[0].fileExtension === 'html')
                                    contentType = 'text/html';
                                this.writeToExternalBucket(accessKey, secretKey, rows[i].s3Key, rows[i].fileName, bucketName, contentType);
                            }
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/save/', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            if (req.body.fileName.split('.')[1] === 'error') {
                res.sendStatus(401);
            }
            else {
                const fileName = req.body.fileName;
                const fileId = req.body.fileId;
                const fileExtension = fileName.split('.')[1];
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        this.database._saveFile(fileName, fileExtension, rows[0].userId, fileId).then(() => {
                            this.database._loadFile(rows[0].userId, Number(fileId)).then((rows) => {
                                this.writeFile(rows[0].s3Key, req.body.code);
                            });
                        });
                        res.sendStatus(200);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/delete/', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            if (req.body.fileName.split('.')[1] === 'error') {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        const fileId = req.body.fileId;
                        this.database._loadFile(rows[0].userId, fileId).then((rows) => {
                            this.s3Bucket.deleteObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
                                if (err)
                                    console.log(err, err.stack); // error
                                else
                                    console.log(); // deleted
                            });
                            this.database._delete(fileId);
                        });
                        res.sendStatus(200);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/new/', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const fileName = req.body.fileName, code = req.body.code, appId = req.body.appId, fileExtension = req.body.fileExtension, paths = fileName.split('/'), parseFileName = paths[paths.length - 1], s3Key = `${this.passwordManager.getHash(this.passwordManager.randomString(5))}-${parseFileName}`;
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        this.database._storeNewFile(fileName, fileExtension, rows[0].userId, appId, s3Key).then(() => {
                            this.writeFile(s3Key, code);
                        });
                        res.sendStatus(200);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.get('/view/:fileId', server_2.jsonParser, (req, res) => {
            const fileId = req.params.fileId;
            this.database._query(`select * from files where fileId = ${fileId}`).then((rows) => {
                if (rows.length === 0)
                    res.sendStatus(404);
                if (rows[0].fileExtension === 'css')
                    res.setHeader('content-type', 'text/css');
                if (rows[0].fileExtension === 'js')
                    res.setHeader('content-type', 'application/javascript');
                if (rows[0].fileExtension === 'html')
                    res.setHeader('content-type', 'text/html');
                this.database._loadFile(rows[0].userId, Number(fileId)).then((rows) => {
                    this.s3Bucket.getObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
                        res.send(data.Body.toString('utf-8'));
                    });
                });
            });
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/auth', server_2.jsonParser, (req, res) => {
            const username = req.body.username;
            const password = req.body.password;
            this.database._validateUser(username, password).then((rows) => {
                if (rows[0].password === this.passwordManager.getHash(`${password}${rows[0].salt}`)) {
                    const token = this.passwordManager.randomString(15);
                    res.cookie('zeroAuth', token, { httpOnly: false });
                    res.sendStatus(204);
                    this.database._setSession(rows[0].userId, username, this.passwordManager.getHash(token));
                }
                else
                    res.sendStatus(401);
            });
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.get('/logout', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        this.database._endSession(rows[0].userId);
                        res.sendStatus(204);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.post('/app/new', server_2.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const appName = req.body.appName;
                    const appType = req.body.appType;
                    if (rows.length !== 0) {
                        this.database._storeNewApp(appName, rows[0].userId, appType).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.get('/css/:fileName', server_2.jsonParser, (req, res) => {
            let fileName = req.params.fileName;
            res.sendFile('css/' + fileName, { root: __dirname });
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.get('/js/:fileName', server_2.jsonParser, (req, res) => {
            let fileName = req.params.fileName;
            res.sendFile('js/' + fileName, { root: __dirname });
        });
        /*
        /////////////////////////////////////////////////////////////////////////////////////////////////////



        
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        */
        this.app.get('/assets/:fileName', (req, res) => {
            res.sendFile(`/frontend/assets/${req.params.fileName}`, { root: __dirname });
        });
        //Database Operations
        this.app.get('/ddb', server_2.jsonParser, (req, res) => {
            try {
                this.database._deleteDatabase('codeStorage');
                res.sendStatus(200);
            }
            catch (error) {
                res.sendStatus(502);
            }
        });
        this.app.get('/cdb', server_2.jsonParser, (req, res) => {
            try {
                this.database._createDatabase();
                res.sendStatus(200);
            }
            catch (error) {
                res.sendStatus(502);
            }
        });
    }
}
exports.apiService = apiService;
