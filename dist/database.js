"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSDatabase = void 0;
const server_1 = require("./server");
const passwordManager_1 = require("./passwordManager");
const usersTable = `CREATE TABLE users (
    userId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    username varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    sessionCookie varchar(255) NOT NULL,
    salt varchar(255) NOT NULL,
    password varchar(500) NOT NULL,
    primary key (userId)
);`;
const appTable = `CREATE TABLE apps (
    appId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    appName varchar(255) NOT NULL,
    userId MEDIUMINT NOT NULL,
    primary key (appId),
    foreign key (userId) REFERENCES users (userId)
);`;
const filesTable = `CREATE TABLE files (
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
const pageTable = `CREATE TABLE pages(
    pageId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    userId MEDIUMINT NOT NULL,
    appId MEDIUMINT NOT NULL,
    title varChar(255) NOT NULL,
    primary key (pageId),
    foreign key (userId) REFERENCES users (userId),
    foreign key (appId) REFERENCES apps (appId)
);`;
const contentTable = `CREATE TABLE content (
    contentId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    userId MEDIUMINT NOT NULL,
    pageId MEDIUMINT NOT NULL,
    s3Key varChar(255) NOT NULL,
    heading varChar(255) NOT NULL,
    primary key (contentId),
    foreign key (userId) REFERENCES users (userId),
    foreign key (pageId) REFERENCES pages (pageId)
);`;
const tagsTable = `CREATE TABLE tags (
    tagId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    tagName varChar(255),
    userId MEDIUMINT NOT NULL,
    tag text NOT NULL,
    primary key (tagId),
    foreign key (userId) REFERENCES users (userId)
);`;
const templateTable = `CREATE table templates (
    templateId MEDIUMINT  NOT NULL AUTO_INCREMENT,
    templateName varChar(255),
    userId MEDIUMINT NOT NULL,
    template text NOT NULL,
    primary key (templateId),
    foreign key (userId) REFERENCES users (userId)
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
                this._query(filesTable)
                    .then(() => {
                    this._query(pageTable)
                        .then(() => {
                        this._query(contentTable)
                            .then(() => {
                            this._query(tagsTable);
                        });
                    });
                });
            });
        });
    }
    _createUser(username, email, password) {
        const salt = this.passwordManager.randomString(25);
        const saltedPassword = `${password}${salt}`;
        this._query(`insert into users(username,email,sessionCookie,password,salt)values("${username}","${email}","no session","${this.passwordManager.getHash(saltedPassword)}","${salt}")`);
    }
    _createDatabase() {
        return this._query('use codeStorage').then(() => {
            this.createTables();
        });
    }
    _deleteDatabase(databaseName) {
        return this._query(`drop database ${databaseName};`);
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
    _deleteAll(appId) {
        return this._query(`delete from files where appId = ${appId}`);
    }
    _storeNewApp(appName, userId) {
        return this._query(`insert into apps(appName,userId)values("${appName}", ${userId})`);
    }
    _getApps(userId) { return this._query(`select * from apps where userId = ${userId}`); }
    _validateUser(username, password) { return this._query(`select password, salt, userId from users where username = "${username}"`); }
    _setSession(userId, username, token) { return this._query(`update users set sessionCookie = "${token}" where userId = ${userId} and username = "${username}";`); }
    _endSession(userId) { return this._query(`update users set sessionCookie = "null" where userId = ${userId};`); }
    _validateToken(token) { return this._query(`select userId from users where sessionCookie = "${token}"`); }
    _storeNewPage(userId, appId, title) { return this._query(`insert into pages (userId, appId, title)values(${userId}, ${appId}, "${title}")`); }
    _storeNewContent(userId, pageId, s3Key, heading) { return this._query(`insert into content (userId, pageId, s3Key, heading)values(${userId},${pageId},"${s3Key}", "${heading}")`); }
    _getPages(userId, appId) { return this._query(`select * from pages where userId = ${userId} and appId = ${appId}`); }
    _loadContent(userId, pageId) { return this._query(`select * from content where userId = ${userId} and pageId = ${pageId}`); }
    _getContent(userId, contentId) { return this._query(`select * from content where userId = ${userId} and contentId = ${contentId}`); }
    _saveContent(userId, contentId, heading) { return this._query(`update content set heading="${heading}" where userId = ${userId} and contentId = ${contentId}`); }
    _deleteContent(userId, contentId) { return this._query(`delete from content where contentId = ${contentId} and userId = ${userId}`); }
    _deleteApp(userId, appId) { return this._query(`delete from apps where appId = ${appId}`); }
    _deletePage(userId, pageId) { return this._query(`delete from pages where pageId=${pageId}`); }
    _storeNewTag(userId, tag, tagName) { return this._query(`insert into tags(userId, tag, tagName)values(${userId},"${tag}","${tagName}")`); }
    _getTag(userId, tagId) { return this._query(`select * from tags where userId = ${userId} and tagId = ${tagId}`); }
    _getTags(userId) { return this._query(`select * from tags where userId = ${userId}`); }
    _deleteTag(userId, tagId) { return this._query(`delete from tags where userId = ${userId} and tagId = ${tagId}`); }
    _updateTag(userId, tagId, tag, tagName) { return this._query(`update tags set tag = "${tag}", tagName="${tagName}" where userId = ${userId} and tagId = ${tagId}`); }
    _storeNewTemplate(userId, template, templateName) { return this._query(`insert into templates(userId, template, templateName)values(${userId},"${template}","${templateName}")`); }
    _getTemplate(userId, templateId) { return this._query(`select * from templates where userId = ${userId} and templateId = ${templateId}`); }
    _getTemplates(userId) { return this._query(`select * from templates where userId = ${userId}`); }
    _deleteTemplate(userId, templateId) { return this._query(`delete from templates where userId = ${userId} and templateId = ${templateId}`); }
    _updateTemplate(userId, templateId, template, templateName) { return this._query(`update templates set template = "${template}", templateName="${templateName}" where userId = ${userId} and tagId = ${templateId}`); }
}
exports.CMSDatabase = CMSDatabase;
