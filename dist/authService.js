"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const server_1 = require("./server");
const database_1 = require("./database");
const passwordManager_1 = require("./passwordManager");
const server_2 = require("./server");
class AuthService extends server_1.Server {
    constructor() {
        super();
        this.database = new database_1.CMSDatabase();
        this.passwordManager = new passwordManager_1.PasswordManager();
        this.defineAuthEndpoints();
        this.defineUtilityEndpoints();
    }
    validateSession(cookies) {
        for (let i = 0; i <= cookies.length - 1; i++) {
            if (cookies[i].split('=')[0] === 'zeroAuth')
                return this.passwordManager.getHash(cookies[i].split('=')[1]);
        }
        return '';
    }
    defineAuthEndpoints() {
        this.app.post('/user/new', server_2.jsonParser, (req, res) => {
            const username = req.body.username;
            const password = req.body.password;
            const email = req.body.email;
            if (username === undefined || password === undefined || email === undefined) {
                res.send(400);
            }
            else {
                this.database._createUser(username, email, password);
                res.send(204);
            }
        });
        this.app.post('/auth', server_2.jsonParser, (req, res) => {
            const username = req.body.username;
            const password = req.body.password;
            if (username === undefined || password === undefined) {
                res.send(400);
            }
            else {
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
            }
        });
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
    }
    defineUtilityEndpoints() {
        this.app.get('/assets/:fileName', (req, res) => {
            res.sendFile(`/frontend/assets/${req.params.fileName}`, { root: __dirname });
        });
    }
}
exports.AuthService = AuthService;
