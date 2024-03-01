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
    getHead(scripts, styles, pageName) {
        let innerHtml = `<title>${pageName}</title>\n`;
        for (let i = 0; i <= scripts.length - 1; i++) {
            innerHtml = '\t' + innerHtml + decodeURIComponent(scripts[i]) + '\n';
        }
        for (let i = 0; i <= styles.length - 1; i++) {
            innerHtml = '\t' + innerHtml + decodeURIComponent(styles[i]);
        }
        return `\t<head>\n${innerHtml}\n</head>`;
    }
    getFooter(footerInnerHtml) {
        return `<footer id="siteFooter"><p>${footerInnerHtml}</p></footer>`;
    }
    getBody(links, bodyInnerHtml, pageName, footer) {
        return `\t<body>\n${this.getNavBar(links)}\n<div id="content"><h1 id="pageheading">${pageName}</h1>\n${bodyInnerHtml}\n${this.getFooter(footer)}\n</div>\n</body>`;
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
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const tag = req.body.tag;
                    const tagName = req.body.tagName;
                    if (rows.length !== 0) {
                        this.database._storeNewTag(rows[0].userId, tag, tagName);
                        res.sendStatus(204);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/load/tag', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const tagId = req.body.tagId;
                    if (rows.length !== 0) {
                        this.database._getTag(rows[0].userId, Number(tagId)).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.get('/tags', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                console.log('hi');
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
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const tag = req.body.tag;
                    const tagName = req.body.tagName;
                    const tagId = req.body.tagId;
                    if (rows.length !== 0) {
                        this.database._updateTag(rows[0].userId, tagId, tag, tagName);
                        res.sendStatus(204);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/new/template', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const template = encodeURIComponent(JSON.stringify(req.body)).replace(/'/g, "%27");
                    const templateName = req.body.metaData.name;
                    if (rows.length !== 0) {
                        this.database._storeNewTemplate(rows[0].userId, template, templateName);
                        res.sendStatus(204);
                    }
                    else
                        res.sendStatus(401);
                });
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
                console.log(req.body);
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const templateId = req.body.templateId;
                    if (rows.length !== 0) {
                        this.database._getTemplate(rows[0].userId, templateId).then((rows) => {
                            res.send(rows);
                        });
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
        this.app.post('/save/template/:templateId', server_1.jsonParser, (req, res) => {
            if (req.headers.cookie === undefined) {
                res.sendStatus(401);
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    const template = encodeURIComponent(JSON.stringify(req.body)).replace(/'/g, "%27");
                    const templateName = req.body.metaData.name;
                    const templateId = req.params.templateId;
                    if (rows.length !== 0) {
                        this.database._updateTemplate(rows[0].userId, Number(templateId), template, templateName);
                        res.sendStatus(204);
                    }
                    else
                        res.sendStatus(401);
                });
            }
        });
    }
}
exports.TemplateService = TemplateService;
