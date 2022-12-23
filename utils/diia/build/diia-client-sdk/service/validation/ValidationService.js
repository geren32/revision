"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationService {
    validationApi;
    constructor(validationApi) {
        this.validationApi = validationApi;
    }
    async validateDocumentByBarcode(branchId, barCode) {
        return await this.validationApi.validateDocumentByBarcode(branchId, barCode);
    }
}
exports.default = ValidationService;
