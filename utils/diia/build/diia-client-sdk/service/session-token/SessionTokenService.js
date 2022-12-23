"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
class SessionTokenService {
    static SESSION_TOKEN_TIME_TO_LIVE = 2 * 3600 * 1000;
    sessionToken;
    sessionTokenObtainTime = 0;
    diiaHost;
    acquirerToken;
    http;
    constructor(acquirerToken, diiaHost, axiosInstance) {
        this.acquirerToken = acquirerToken;
        this.diiaHost = diiaHost;
        this.http = axiosInstance;
    }
    async getSessionToken() {
        (0, utils_1.log)('Starting SessionTokenService.getSessionToken...');
        const now = Date.now();
        if (!this.sessionToken || SessionTokenService.SESSION_TOKEN_TIME_TO_LIVE >= now - this.sessionTokenObtainTime) {
            this.sessionToken = await this.obtainSessionToken();
            this.sessionTokenObtainTime = now;
        }
        (0, utils_1.log)(`Finish SessionTokenService.getSessionToken sessionToken = ${this.sessionToken}`);
        return this.sessionToken;
    }
    async obtainSessionToken() {
        (0, utils_1.log)('Starting SessionTokenService.obtainSessionToken...');
        try {
            let sessionToken = '';
            const { data } = await this.http.get(`/api/v1/auth/acquirer/${this.acquirerToken}`);
            if (data && data.token) {
                sessionToken = data.token;
            }
            (0, utils_1.log)(`Finish SessionTokenService.obtainSessionToken sessionToken = ${sessionToken}`);
            return sessionToken;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.default = SessionTokenService;
