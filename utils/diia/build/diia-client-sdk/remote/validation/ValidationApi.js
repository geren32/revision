"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
class ValidationApi {
    _http;
    constructor(httpMethodExecutor) {
        this._http = httpMethodExecutor;
    }
    /*
        curl -X POST "https://{diia_host}/api/v1/acquirers/document-identification"
        -H "accept: application/json"
        -H "Authorization: Bearer {session_token}"
        -H "Content-Type: application/json"
        -d "{\"branchId\":\"{branch_id}\",\"barcode\":\"{barcode}\"}"
    */
    async validateDocumentByBarcode(branchId, barcode) {
        (0, utils_1.log)(`Starting validateDocumentByBarcode: barcode=${barcode} branchId=${branchId}`);
        const { data } = await this._http.doPost('/api/v1/acquirers/document-identification', {
            branchId,
            barcode
        });
        (0, utils_1.log)(`Finishing validateDocumentByBarcode: ${(0, utils_1.prettyJson)(data)}`);
        return data.success;
    }
}
exports.default = ValidationApi;
