"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SharingService {
    sharingApi;
    deepLinkService;
    constructor(sharingApi, deepLinkService) {
        this.sharingApi = sharingApi;
        this.deepLinkService = deepLinkService;
    }
    async getDeepLink(deepLinkConfig) {
        return await this.deepLinkService.getDeepLink(deepLinkConfig);
    }
    async requestDocumentByBarCode(branchId, barCode, requestId) {
        return await this.sharingApi.requestDocumentByBarCode(branchId, barCode, requestId);
    }
}
exports.default = SharingService;
