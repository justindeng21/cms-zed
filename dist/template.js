"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = exports.PageCreator = void 0;
const contentService_1 = require("./contentService");
const server_1 = require("./server");
class PageCreator {
    constructor() {
    }
    getNavBar(links) {
        let innerHtml = `<a href='/' class='active'>Home</a>`;
        for (let i = 0; i <= links.length - 1; i++) {
            innerHtml = innerHtml + `<a href='${links[i].link}'>${links[i].text}</a>`;
        }
        return `<div class="nav">${innerHtml}</div>`;
    }
    getHead(scripts, styles, pageName, uploadedFiles) {
        let innerHtml = `<title>${pageName}</title>\n\n`;
        for (let i = 0; i <= uploadedFiles.length - 1; i++) {
            if (uploadedFiles[i].fileExtension === 'js')
                innerHtml = innerHtml + `<script type="module" crossorigin src="/site/assets/${uploadedFiles[i].s3Key}"></script>` + '\n\n';
            if (uploadedFiles[i].fileExtension === 'css')
                innerHtml = innerHtml + `<link rel="stylesheet" crossorigin href="/site/assets/${uploadedFiles[i].s3Key}">` + '\n\n';
        }
        for (let i = 0; i <= styles.length - 1; i++) {
            innerHtml = innerHtml + decodeURIComponent(styles[i]) + '\n\n';
        }
        for (let i = 0; i <= scripts.length - 1; i++) {
            innerHtml = innerHtml + decodeURIComponent(scripts[i]) + '\n\n';
        }
        return `\t<head>\n${innerHtml.replace(/^/gm, "\t\t")}\n\t</head>`;
    }
    getFooter(footerInnerHtml) {
        return `<footer id="siteFooter"><p>${footerInnerHtml}</p></footer>`;
    }
    getBody(links, bodyInnerHtml, pageName, footer) {
        return `<body>\n${this.getNavBar(links).replace(/^/gm, "\t\t")}\n\t\t<div id="content"><div id="root"></div><h1 id="pageheading">${pageName}</h1>\n${bodyInnerHtml.replace(/^/gm, "\t\t")}\n${this.getFooter(footer).replace(/^/gm, "\t\t")}\n\t\t</div>\n</body>`.replace(/^/gm, "\t\t");
    }
}
exports.PageCreator = PageCreator;
class TemplateService extends contentService_1.ContentService {
    constructor() {
        super();
        this.defineEditorEndpoints();
        this.pageCreator = new PageCreator();
    }
    defineEditorEndpoints() {
        this.app.post('/tag/new', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const tag = req.body.tag;
                const tagName = req.body.tagName;
                if (tag === undefined || tagName === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._storeNewTag(rows[0].userId, tag, tagName);
                            res.sendStatus(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/load/tag', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const tagId = req.body.tagId;
                if (tagId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._getTag(rows[0].userId, Number(tagId)).then((rows) => {
                                res.send(rows);
                            });
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.get('/tags', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        this.database._getTags(rows[0].userId).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/save/tag', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const tag = req.body.tag;
                const tagName = req.body.tagName;
                const tagId = req.body.tagId;
                if (tag === undefined || tagName === undefined || tagId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._updateTag(rows[0].userId, tagId, tag, tagName);
                            res.sendStatus(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/new/template', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const template = encodeURIComponent(JSON.stringify(req.body)).replace(/'/g, "%27");
                const templateName = req.body.metaData.name;
                if (template === undefined || templateName === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._storeNewTemplate(rows[0].userId, template, templateName);
                            res.sendStatus(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.get('/templates', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        this.database._getTemplates(rows[0].userId).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/load/template', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const templateId = req.body.templateId;
                if (templateId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._getTemplate(rows[0].userId, templateId).then((rows) => {
                                res.send(rows);
                            });
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
        this.app.post('/save/template/:templateId', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                const template = encodeURIComponent(JSON.stringify(req.body)).replace(/'/g, "%27");
                const templateName = req.body.metaData.name;
                const templateId = req.params.templateId;
                if (template === undefined || templateName === undefined || templateId === undefined) {
                    res.sendStatus(400);
                }
                else {
                    this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                        if (rows.length !== 0) {
                            this.database._updateTemplate(rows[0].userId, Number(templateId), template, templateName);
                            res.sendStatus(204);
                        }
                        else
                            res.sendStatus(401);
                    });
                }
            }
        });
    }
}
exports.TemplateService = TemplateService;
