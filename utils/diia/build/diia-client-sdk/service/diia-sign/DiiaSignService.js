"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const util_1 = require("util");
class DiiaSignService {
    deepLinkService;
    cryptoService;
    constructor(deepLinkService, cryptoService) {
        this.deepLinkService = deepLinkService;
        this.cryptoService = cryptoService;
    }
    async getSignHashDeepLink(baseDeepLinkConfig, b64Documents) {
        (0, utils_1.log)(`Starting DiiaSignService.getSignHashDeepLink: baseDeepLinkConfig=${(0, util_1.inspect)(baseDeepLinkConfig)}`);
        const hashedFiles = b64Documents.map(({ fileName, fileB64 }) => ({
            fileName,
            fileHash: this.cryptoService.getHashOfItem(fileB64)
        }));
        const isAllFilesHaveHash = hashedFiles.every(file => Boolean(file.fileHash));
        if (!isAllFilesHaveHash) {
            throw new Error('Failed to get hash of documents');
        }
        const hashedFilesSigning = { hashedFiles };
        const signData = { hashedFilesSigning };
        return await this.deepLinkService.getDeepLink({
            ...baseDeepLinkConfig,
            data: signData
        });
    }
    async getAuthDeepLink(baseDeepLinkConfig) {
        let { requestId } = baseDeepLinkConfig;
        const hashedRequestId = this.cryptoService.getHashOfItem(requestId);
        console.log(baseDeepLinkConfig, 'baseDeepLinkConfig');
        console.log(hashedRequestId, 'hashedRequestId');
        return await this.deepLinkService.getDeepLink({
            ...baseDeepLinkConfig,
            requestId: hashedRequestId
        });
    }
}
exports.default = DiiaSignService;
