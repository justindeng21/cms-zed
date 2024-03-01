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
exports.FileService = void 0;
const fs_1 = __importDefault(require("fs"));
const authService_1 = require("./authService");
const AWS = __importStar(require("aws-sdk"));
const server_1 = require("./server");
class FileService extends authService_1.AuthService {
    constructor() {
        super();
        this.defineFileEndpoints();
    }
    writeFile(s3Key, code) {
        fs_1.default.writeFile(s3Key, code, (err) => {
            if (err) {
                console.log('There was an error');
                return;
            }
            this.uploadToS3(s3Key, this.bucketName).then(() => {
                fs_1.default.unlinkSync(s3Key);
            });
        });
    }
    uploadToS3(s3Key, bucketName) {
        const readStream = fs_1.default.createReadStream(s3Key);
        const params = {
            Bucket: bucketName,
            Key: s3Key,
            Body: readStream
        };
        return new Promise((resolve, reject) => {
            this.fileStorage.upload(params, function (err, data) {
                readStream.destroy();
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }
    writeToExternalBucket(accessKey, secretKey, s3Key, fileName, bucketName, contentType) {
        this.fileStorage.getObject({ Bucket: this.bucketName, Key: s3Key }, function (err, data) {
            fs_1.default.writeFile(s3Key, data.Body.toString('utf-8'), (err) => {
                if (err) {
                    console.log('There was an error storing the file');
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
    defineFileEndpoints() {
        this.app.post('/app/new', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const appName = req.body.appName;
                    if (rows.length !== 0) {
                        this.database._storeNewApp(appName, rows[0].userId);
                        res.sendStatus(204);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/app', server_1.jsonParser, (req, res) => {
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
        this.app.get('/apps', server_1.jsonParser, (req, res) => {
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
        this.app.post('/load', server_1.jsonParser, (req, res) => {
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
                                this.fileStorage.getObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
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
        this.app.post('/build', server_1.jsonParser, (req, res) => {
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
        this.app.post('/save/', server_1.jsonParser, (req, res) => {
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
        this.app.post('/delete/', server_1.jsonParser, (req, res) => {
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
                            this.fileStorage.deleteObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
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
        this.app.post('/new/', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const fileName = req.body.fileName;
                const code = req.body.code;
                const appId = req.body.appId;
                const fileExtension = req.body.fileExtension;
                const paths = fileName.split('/');
                const parseFileName = paths[paths.length - 1];
                const s3Key = `${this.passwordManager.getHash(this.passwordManager.randomString(5))}-${parseFileName}`;
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
        this.app.get('/view/:fileId', server_1.jsonParser, (req, res) => {
            const fileId = req.params.fileId;
            this.database._query(`select * from files where fileId = ${fileId}`).then((rows) => {
                console.log(rows);
                if (rows.length === 0)
                    res.sendStatus(404);
                else if (rows[0].fileExtension === 'css')
                    res.setHeader('content-type', 'text/css');
                else if (rows[0].fileExtension === 'js')
                    res.setHeader('content-type', 'application/javascript');
                else if (rows[0].fileExtension === 'html')
                    res.setHeader('content-type', 'text/html');
                else
                    res.sendStatus(404);
                this.database._loadFile(rows[0].userId, Number(fileId)).then((rows) => {
                    this.fileStorage.getObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
                        res.send(data.Body.toString('utf-8'));
                    });
                });
            });
        });
    }
}
exports.FileService = FileService;
