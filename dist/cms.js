"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const template_1 = require("./template");
class CMSAPI extends template_1.TemplateService {
    constructor() {
        super();
        this.defineCMSEndpoints();
    }
    defineCMSEndpoints() {
        this.app.get('/cms', (req, res) => {
            res.sendFile('/frontend/index.html', { root: __dirname });
        });
        this.app.get('/content', (req, res) => {
            res.sendFile('/frontend/index.html', { root: __dirname });
        });
        this.app.get('/template', (req, res) => {
            res.sendFile('/frontend/index.html', { root: __dirname });
        });
        this.app.get('/template(/*)', (req, res) => {
            res.sendFile('/frontend/index.html', { root: __dirname });
        });
        this.app.get('/cms(/*)', (req, res) => {
            if (req.headers.cookie === undefined || req.params.id === '') {
                res.redirect('/cms');
            }
            else {
                this.database._validateToken(this.validateSession(req.headers.cookie.split('; '))).then((rows) => {
                    if (rows.length !== 0) {
                        res.sendFile('/frontend/index.html', { root: __dirname });
                    }
                    else
                        res.redirect('/cms');
                });
            }
        });
    }
}
const cms = new CMSAPI();
