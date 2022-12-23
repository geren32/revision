"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DocumentPackage_1 = __importDefault(require("../../model/DocumentPackage"));
const DecodedFile_1 = __importDefault(require("../../model/DecodedFile"));
const utils_1 = require("../../utils");
const util_1 = require("util");
class DocumentService {
    cryptoService;
    constructor(cryptoService) {
        this.cryptoService = cryptoService;
    }
    processDocumentPackage(headers, multipartBody, cryptoMeta) {
        (0, utils_1.log)(`Starting DocumentService.processDocumentPackage...`);
        const { requestId } = headers;
        const decodedDocuments = multipartBody.reduce(this.preparePackageDocument.bind(this), []);
        const decodedMeta = this.preparePackageMeta(cryptoMeta);
        (0, utils_1.log)(`decodedMeta = ${(0, util_1.inspect)(decodedMeta)}`);
        return new DocumentPackage_1.default(requestId, decodedDocuments, decodedMeta);
    }
    preparePackageDocument(accumulationDocPackage, document) {
        const buffDocument = document.data;
        if (!Buffer.isBuffer(buffDocument)) {
            throw new Error('Document isn`t buffer type');
        }
        const decodedDocument = this.cryptoService.decrypt(buffDocument);
        return decodedDocument ? [
            ...accumulationDocPackage,
            new DecodedFile_1.default(document.originalFileName, decodedDocument)
        ] : accumulationDocPackage;
    }
    preparePackageMeta(cryptoMeta) {
        const b64Meta = this.cryptoService.decrypt(cryptoMeta);
        const jsonMeta = Buffer.from(b64Meta, 'base64').toString('utf8');
        return JSON.parse(jsonMeta);
    }
}
exports.default = DocumentService;
