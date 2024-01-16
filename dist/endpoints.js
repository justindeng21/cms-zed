"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiService_1 = require("./apiService");
class CMSAPI extends apiService_1.apiService {
    constructor() {
        super();
        this.defineCMSEndpoints();
    }
    defineCMSEndpoints() {
        this.app.get('/cms', (req, res) => {
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
