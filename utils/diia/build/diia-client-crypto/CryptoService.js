"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CryptoService {
    cryptoLibraryService;
    constructor(cryptoLibraryService) {
        this.cryptoLibraryService = cryptoLibraryService;
    }
    decrypt(buffPayload) {
        return this.cryptoLibraryService.decrypt(buffPayload);
    }
    getHashOfItem(payload) {
        return this.cryptoLibraryService.getHashOfItem(payload);
    }
}
exports.default = CryptoService;
