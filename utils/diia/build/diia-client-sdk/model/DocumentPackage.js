"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DocumentPackage {
    requestId;
    decodedFiles;
    data;
    constructor(requestId, decodedFiles, data) {
        this.requestId = requestId;
        this.decodedFiles = decodedFiles;
        this.data = data;
    }
}
exports.default = DocumentPackage;
