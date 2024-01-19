"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSDatabase = void 0;
const server_1 = require("./server");
const passwordManager_1 = require("./passwordManager");
let usersTable = `CREATE TABLE users (
    userId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    username varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    sessionCookie varchar(255) NOT NULL,
    salt varchar(255) NOT NULL,
    password varchar(500) NOT NULL,
    primary key (userId)
);`;
let appTable = `CREATE TABLE apps (
    appId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    appName varchar(255) NOT NULL,
    appType varchar(255) NOT NULL,
    userId MEDIUMINT NOT NULL,
    primary key (appId),
    foreign key (userId) REFERENCES users (userId)
);`;
let filesTable = `CREATE TABLE files (
    fileId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    userId MEDIUMINT NOT NULL,
    appId MEDIUMINT not NULL,
    fileName varchar(255) NOT NULL,
    fileExtension varchar(255) NOT NULL,
    s3Key varChar(255) NOT NULL,
    primary key (fileId),
    foreign key (userId) REFERENCES users (userId),
    foreign key (appId) REFERENCES apps (appId)
);`;
class CMSDatabase extends server_1.Database {
    constructor() {
        super();
        this.passwordManager = new passwordManager_1.PasswordManager();
    }
    createTables() {
        return this._query(usersTable)
            .then(() => {
            this._query(appTable)
                .then(() => {
                this._query(filesTable);
            });
        });
    }
    _createUser(username, email, password) {
        const salt = this.passwordManager.randomString(25);
        const saltedPassword = `${password}${salt}`;
        this._query(`insert into users(username,email,sessionCookie,password,salt)values("${username}","${email}","no session","${this.passwordManager.getHash(saltedPassword)}","${salt}")`);
    }
    _createDatabase() {
        this.createTables();
        return;
    }
    _deleteDatabase(databaseName) {
        try {
            this._query(`drop database ${databaseName};`);
        }
        catch (error) {
            return;
        }
    }
    _storeNewFile(fileName, fileExtension, userId, appId, s3Key) {
        return this._query(`insert into files(userId, appID, fileName,fileExtension, s3Key)values(${userId}, ${appId},"${fileName}","${fileExtension}","${s3Key}")`);
    }
    _saveFile(fileName, fileExtension, userId, fileId) {
        return this._query(`update files set fileName = "${fileName}", fileExtension = "${fileExtension}" where userId = ${userId} and fileId = ${fileId};`);
    }
    _loadFile(userId, fileId) {
        return this._query(`select * from files where userId = ${userId} and fileId = ${fileId};`);
    }
    _getFiles(userId, appId) {
        return this._query(`select * from files where userId = ${userId} and appId = ${appId};`);
    }
    _delete(fileId) {
        return this._query(`delete from files where fileId = ${fileId}`);
    }
    _storeNewApp(appName, userId, appType) {
        return this._query(`insert into apps(appName,userId,appType)values("${appName}", ${userId}, "${appType}")`);
    }
    _getApps(userId) {
        return this._query(`select * from apps where userId = ${userId}`);
    }
    _validateUser(username, password) {
        return this._query(`select password, salt, userId from users where username = "${username}"`);
    }
    _setSession(userId, username, token) {
        return this._query(`update users set sessionCookie = "${token}" where userId = ${userId} and username = "${username}";`);
    }
    _validateToken(token) {
        return this._query(`select userId from users where sessionCookie = "${token}"`);
    }
}
exports.CMSDatabase = CMSDatabase;
