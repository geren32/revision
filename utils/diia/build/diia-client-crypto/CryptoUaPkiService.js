"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bindings_1 = __importDefault(require("bindings"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const types_1 = require("../diia-client-common/types");
const utils_1 = require("../diia-client-sdk/utils");
let pathToConfig = __dirname;
let pathToSoFolder = __dirname;
let pathToUaPkiWrapper = '/diia-client-crypto/addons/wrapper';

if (process.platform === 'win32') {
    pathToConfig += '\\addons\\resources\\config\\config.json';
    pathToSoFolder += '\\addons\\libs\\uapki\\libs\\windows_x64\\';
    pathToUaPkiWrapper += '/windows_x86-64/uapki_wrapper';
}
else if (process.platform === 'linux') {
    pathToConfig += '/addons/resources/config/config.json';
    pathToSoFolder += '/addons/libs/uapki/libs/linux_x86-64/';
    pathToUaPkiWrapper += '/linux_x86-64/uapki_wrapper';
}
else if (process.platform === 'darwin') {
    pathToConfig += '/addons/resources/config/config.json';
    pathToSoFolder += '/addons/libs/uapki/libs/mac_x86-64/';
    pathToUaPkiWrapper += '/mac_x86-64/uapki_wrapper';
}

else {
    console.log("Not supported platform");
    process.exit(-1);
}
class CryptoUaPkiService {
    configFileMode = true;
    config;
    uaPkiWrapper = (0, bindings_1.default)(pathToUaPkiWrapper);
    constructor(config) {
        this.config = JSON.stringify(config);
        if (this.configFileMode) {
            this.makeJsonConfigFile(this.config);
        }
        this.initUaPkiWrapper(this.uaPkiWrapper);
    }
    decrypt(buffPayload) {
        (0, utils_1.log)(`Starting decrypt: buffPayload length=${buffPayload.length}`);
        let b64Payload = Buffer.isBuffer(buffPayload) ?
            this.decodeBufferToBase64(buffPayload)
            :
                buffPayload;
        const decryptedDocument = this.uaPkiWrapper.Unwrap(b64Payload);
        (0, utils_1.log)(`Finish decrypt: decryptedDocument errorCode=${decryptedDocument.errorCode}`);
        if (decryptedDocument.errorCode !== 0) {
            throw new Error((0, util_1.inspect)(decryptedDocument));
        }
        if (decryptedDocument.result && decryptedDocument.result.bytes) {
            return decryptedDocument.result.bytes;
        }
        console.log(decryptedDocument, ' Decrypt result');
        return '';
    }
    getHashOfItem(payload) {
      //  (0, utils_1.log)(`Starting getHashOfItem: payload length=${payload.length}`);
        console.log(this.uaPkiWrapper)
        const hashingResult = this.uaPkiWrapper.DigestGost34311(payload);
        console.log(hashingResult , 4444444444444444444444)
       // (0, utils_1.log)(`Finish getHashOfItem: hashingResult errorCode=${hashingResult.errorCode}`);
        if (hashingResult.errorCode != types_1.UaPkiResult.Success) {
            throw new Error((0, util_1.inspect)(hashingResult));
        }
        const { result } = hashingResult;
        if (result && result.bytes) {
            return result.bytes;
        }
        return '';
    }
    initUaPkiWrapper(uaPkiWrapper) {
        console.log('INIT uaPkiWrapper ...');
        try {
            const result = uaPkiWrapper.Init(this.configFileMode ? pathToConfig : this.config, pathToSoFolder);

            if (result.errorCode !== types_1.UaPkiResult.Success)
                throw new Error(`Failed init ua_pki_wrapper with error code = ${result}`);
            console.log('Success initialization ua_pki_wrapper');
        }
        catch (e) {
            throw e;
        }
    }
    decodeBufferToBase64(data) {
        return new TextDecoder('utf8')
            .decode(new Uint8Array(data));
    }
    makeJsonConfigFile(config) {
        console.log(pathToConfig)
        fs.writeFileSync(pathToConfig, config);
    }
}
exports.default = CryptoUaPkiService;
