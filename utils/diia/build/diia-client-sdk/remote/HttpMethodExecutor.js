"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpMethodExecutor {
    sessionTokenService;
    http;
    constructor(sessionTokenService, http) {
        this.sessionTokenService = sessionTokenService;
        this.http = http;
    }
    async doGet(url, config = {}) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${await this.sessionTokenService.getSessionToken()}`
        };
        return await this.http.get(url, config);
    }
    async doPost(url, payload, config = {}) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${await this.sessionTokenService.getSessionToken()}`
        };
        return await this.http.post(url, payload, config);
    }
    async doDelete(url, config = {}) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${await this.sessionTokenService.getSessionToken()}`
        };
        return await this.http.delete(url, config);
    }
    async doPut(url, payload, config = {}) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${await this.sessionTokenService.getSessionToken()}`
        };
        return await this.http.put(url, payload, config);
    }
}
exports.default = HttpMethodExecutor;
