"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const util_1 = require("util");
class DeeplinkApi {
    _http;
    constructor(httpMethodExecutor) {
        this._http = httpMethodExecutor;
    }
    /*
        curl -X POST "https://{diia_host}/api/v2/acquirers/branch/{branch_id}/offer-request/dynamic"
        -H  "accept: application/json"
        -H  "Authorization: Bearer {session_token}"
        -H  "Content-Type: application/json"
        -d "{ \"offerId\": \"{offer_id}\", \"requestId\": \"{request_id}\" }"
    */
    async getDeepLink(deepLinkConfig) {
        (0, utils_1.log)(`Starting getDeepLink: deepLinkConfig=${(0, util_1.inspect)(deepLinkConfig)}`);
        const { branchId, offerId, requestId, ...rest } = deepLinkConfig;
        const { data } = await this._http.doPost(`api/v2/acquirers/branch/${branchId}/offer-request/dynamic`, {
            offerId,
            requestId,
            ...rest
        });
        (0, utils_1.log)(`Finishing getDeepLink: ${(0, utils_1.prettyJson)(data)}`);
        return data;
    }
}
exports.default = DeeplinkApi;
