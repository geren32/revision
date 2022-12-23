"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
class SharingApi {
    _http;
    constructor(httpMethodExecutor) {
        this._http = httpMethodExecutor;
    }
    /*
        curl -X POST "https://{diia_host}/api/v1/acquirers/document-request"
        -H  "accept: application/json"
        -H  "Authorization: Bearer {session_token}"
        -H  "Content-Type: application/json"
        -d "{ \"branchId\": \"{branch_id}\", \"barcode\": \"{barcode}\", \"requestId\": \"{request_id}\" }" or
        -d "{ \"branchId\": \"{branch_id}\", \"qrcode\": \"{qrcode}\", \"requestId\": \"{request_id}\" }"
    */
    async requestDocumentByBarCode(branchId, barcode, requestId) {
        (0, utils_1.log)(`Starting requestDocumentByBarCode: barcode=${barcode} branchId=${branchId} requestId=${requestId}`);
        const { data } = await this._http.doPost('api/v1/acquirers/document-request', {
            branchId,
            barcode,
            requestId
        });
        (0, utils_1.log)(`Finishing requestDocumentByBarCode: ${(0, utils_1.prettyJson)(data)}`);
        return data.success;
    }
}
exports.default = SharingApi;
