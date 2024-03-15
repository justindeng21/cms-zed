"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const server_1 = require("./server");
const fileService_1 = require("./fileService");
const template_1 = require("./template");
class ContentService extends fileService_1.FileService {
    constructor() {
        super();
        this.defineContentEndpoints();
        this.pageCreator = new template_1.PageCreator();
    }
    async writeHtml(contents, userId, pageName, appId, template, uploadedFiles) {
        let bodyInnerHtml = '';
        for (let i = 0; i <= contents.length - 1; i++) {
            let k = new Promise((resolve, reject) => {
                this.fileStorage.getObject({ Bucket: this.bucketName, Key: contents[i].s3Key }, function (err, data) {
                    var content = JSON.parse(data.Body.toString('utf-8'));
                    bodyInnerHtml = bodyInnerHtml + `<h2 class="sectionHeading">${decodeURIComponent(content.heading)}</h2>\n`;
                    bodyInnerHtml = bodyInnerHtml + `<p class="contentText">${decodeURIComponent(content.content)}</p>\n`;
                    resolve(bodyInnerHtml);
                });
            });
            await k;
        }
        const s3Key = `${this.passwordManager.getHash(this.passwordManager.randomString(5))}.html`;
        const head = this.pageCreator.getHead(template.scripts, template.styles, pageName, uploadedFiles);
        const body = this.pageCreator.getBody(template.links, bodyInnerHtml, pageName, template.footer);
        this.database._storeNewFile(s3Key, 'html', userId, appId, s3Key, 'false').then(() => {
            this.writeFile(s3Key, `<html>\n${head}\n${body}\n</html>`);
        });
    }
    defineContentEndpoints() {
        this.app.post('/content/new', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const content = req.body.content;
                const heading = req.body.heading;
                const pageId = req.body.pageId;
                const s3Key = `${this.passwordManager.getHash(this.passwordManager.randomString(5))}.json`;
                if (content === undefined || heading === undefined || pageId === undefined || s3Key === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._storeNewContent(rows[0].userId, pageId, s3Key, heading);
                            this.writeFile(s3Key, `{"heading":"${encodeURIComponent(heading)}","content":"${encodeURIComponent(content)}"}`);
                            res.sendStatus(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/page/new', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const appId = req.body.appId;
                const title = req.body.title;
                if (appId === undefined || title === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._storeNewPage(rows[0].userId, appId, title);
                            res.send(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.get('/pages/:appId', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const appId = req.params.appId;
                if (appId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._getPages(rows[0].userId, Number(appId)).then((rows) => {
                                res.send(rows);
                            });
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/page', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const pageId = req.body.pageId;
                if (pageId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._loadContent(rows[0].userId, pageId).then((rows) => {
                                res.send(rows);
                            });
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/load/content', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                if (req.headers.cookie === undefined) {
                    res.sendStatus(401);
                }
                else {
                    const contentId = req.body.contentId;
                    if (contentId === undefined) {
                        res.sendStatus(400);
                    }
                    else {
                        this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                            if (rows.length !== 0) {
                                this.database._getContent(rows[0].userId, Number(contentId)).then((rows) => {
                                    this.fileStorage.getObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
                                        res.setHeader('content-type', 'application/json');
                                        res.send(data.Body.toString('utf-8'));
                                    });
                                });
                            }
                            else
                                res.sendStatus(401);
                        });
                    }
                }
            }
        });
        this.app.post('/save/content', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const contentId = req.body.contentId;
                const heading = req.body.heading;
                const content = req.body.content;
                if (contentId === undefined || heading === undefined || content === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        const userId = rows[0].userId;
                        if (rows.length !== 0) {
                            this.database._saveContent(rows[0].userId, Number(contentId), heading).then((rows) => {
                                this.database._getContent(userId, Number(contentId)).then((rows) => {
                                    this.writeFile(rows[0].s3Key, `{"heading":"${encodeURIComponent(heading)}","content":"${encodeURIComponent(content)}"}`);
                                });
                            });
                            res.sendStatus(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/delete/content', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const contentId = req.body.contentId;
                if (contentId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._getContent(rows[0].userId, contentId).then((rows) => {
                                this.fileStorage.deleteObject({ Bucket: this.bucketName, Key: rows[0].s3Key }, function (err, data) {
                                    if (err)
                                        console.log(err, err.stack); // error
                                    else
                                        console.log(); // deleted
                                });
                                this.database._deleteContent(rows[0].userId, contentId);
                            });
                            res.sendStatus(200);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/publish/content', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const templateId = req.body.templateId;
                const appId = req.body.appId;
                if (templateId === undefined || appId === undefined) {
                    res.sendStatus(400);
                }
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        const userId = rows[0].userId;
                        this.database._getFiles(userId, appId, 'false').then((rows_files) => {
                            for (let i = 0; i <= rows_files.length - 1; i++) {
                                this.database._loadFile(userId, rows_files[i].fileId).then((rows) => {
                                    this.fileStorage.deleteObject({ Bucket: this.bucketName, Key: rows_files[i].s3Key }, function (err, data) {
                                        if (err)
                                            console.log(err, err.stack);
                                        else
                                            console.log();
                                    });
                                    this.database._delete(rows_files[i].fileId);
                                });
                            }
                        }).then(() => {
                            this.database._getFiles(userId, appId, 'true').then((uploadedFilesRows) => {
                                const uploadedFiles = uploadedFilesRows;
                                this.database._getPages(userId, appId).then((rows) => {
                                    for (let i = 0; i <= rows.length - 1; i++) {
                                        const pageId = rows[i].pageId;
                                        const title = rows[i].title;
                                        this.database._loadContent(userId, pageId).then((rows) => {
                                            const content = rows;
                                            this.database._getTemplate(userId, templateId).then((rows) => {
                                                this.writeHtml(content, userId, title, appId, JSON.parse(decodeURIComponent(rows[0].template)), uploadedFiles);
                                            });
                                        });
                                    }
                                });
                            });
                        }).then(() => {
                            res.sendStatus(204);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
    }
}
exports.ContentService = ContentService;
