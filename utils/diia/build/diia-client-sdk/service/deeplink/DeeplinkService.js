"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
class DeeplinkService {
    deeplinkApi;
    constructor(deeplinkApi) {
        this.deeplinkApi = deeplinkApi;
    }
    async getDeepLink(deeplinkConfig) {
        const { deeplink } = await this.deeplinkApi.getDeepLink(deeplinkConfig);
        (0, utils_1.log)(`deeplink = ${deeplink}`);
        return deeplink;
    }
}
exports.default = DeeplinkService;
