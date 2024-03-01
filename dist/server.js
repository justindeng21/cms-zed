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
exports.urlencodedParser = exports.jsonParser = exports.Server = exports.Database = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mysql_1 = __importDefault(require("mysql"));
const AWS = __importStar(require("aws-sdk"));
class Database {
    constructor() {
        this.connection = mysql_1.default.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Kenyalove817678!',
            database: process.env.DB_NAME || 'codeStorage'
        });
        this.connection.connect(function (err) {
            if (err)
                throw err;
            console.log("Connected!");
        });
    }
    _query(query_) {
        return new Promise((resolve, reject) => {
            this.connection.query(query_, (err, rows) => {
                return err ? reject(err) : resolve(rows);
            });
        });
    }
    _setDatabase(databaseName) {
        this._query(`use ${databaseName}`);
    }
}
exports.Database = Database;
class Server {
    constructor() {
        console.log('Working Directory:', __dirname);
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.static(__dirname));
        this.app.use(body_parser_1.default.json({ limit: '35mb' }));
        this.app.use(body_parser_1.default.urlencoded({
            extended: true,
            limit: '35mb',
            parameterLimit: 50000,
        }));
        this.server = this.app.listen(process.env.PORT || 3400, () => console.log("server running"));
        this.fileStorage = new AWS.S3({
            accessKeyId: 'AKIAZVRIAJALS4WGAJ6Z', //process.env.AWS_ACCESSKEY,
            secretAccessKey: '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' //process.env.AWS_SECRETKEY
        });
        this.bucketName = 'cms-zed';
    }
    _closeServer() {
        this.server.close();
    }
}
exports.Server = Server;
exports.jsonParser = body_parser_1.default.json();
exports.urlencodedParser = body_parser_1.default.urlencoded({ extended: false });
