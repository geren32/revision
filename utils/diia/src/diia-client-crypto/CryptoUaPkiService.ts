import bindings from "bindings";
import * as fs from "fs";
import { inspect } from "util";
import { Base64, UaPkiResult } from "../diia-client-common/types";
import { ICryptoLibraryService } from "./CryptoService";
import {log} from "../diia-client-sdk/utils";

let pathToConfig = __dirname;
let pathToSoFolder = __dirname;
let pathToUaPkiWrapper = '/diia-client-crypto/addons/wrapper';

if (process.platform === 'win32') {
   pathToConfig += '\\addons\\resources\\config\\config.json';
   pathToSoFolder += '\\addons\\libs\\uapki\\libs\\windows_x64\\';
   pathToUaPkiWrapper += '/windows_x86-64/uapki_wrapper';
} else if (process.platform === 'linux') {
   pathToConfig += '/addons/resources/config/config.json';
   pathToSoFolder += '/addons/libs/uapki/libs/linux_x86-64/';
   pathToUaPkiWrapper += '/linux_x86-64/uapki_wrapper';
} else if (process.platform === 'darwin') {
   pathToConfig += '/addons/resources/config/config.json';
   pathToSoFolder += '/addons/libs/uapki/libs/mac_x86-64/';
   pathToUaPkiWrapper += '/mac_x86-64/uapki_wrapper';
} else {
   console.log("Not supported platform");
   process.exit(-1)
}


export default class CryptoUaPkiService implements ICryptoLibraryService {
   private configFileMode: boolean = true;
   private config: string;
   public uaPkiWrapper = bindings(pathToUaPkiWrapper);

   constructor(config: object) {
      this.config = JSON.stringify(config);

      if (this.configFileMode) {
         this.makeJsonConfigFile(this.config)
      }

      this.initUaPkiWrapper(this.uaPkiWrapper);
   }

   public decrypt(buffPayload: Buffer | Base64): Base64 {
      log(`Starting decrypt: buffPayload length=${buffPayload.length}`);
      let b64Payload: Base64 = Buffer.isBuffer(buffPayload)?
          this.decodeBufferToBase64(buffPayload)
          :
          buffPayload;


      const decryptedDocument = this.uaPkiWrapper.Unwrap(b64Payload);
      log(`Finish decrypt: decryptedDocument errorCode=${decryptedDocument.errorCode}`);

      if (decryptedDocument.errorCode !== 0) {
         throw new Error(inspect(decryptedDocument));
      }

      if (decryptedDocument.result && decryptedDocument.result.bytes) {
         return decryptedDocument.result.bytes;
      }

      console.log(decryptedDocument, ' Decrypt result');

      return '';
   }

   public getHashOfItem(payload: Base64): Base64 {
      log(`Starting getHashOfItem: payload length=${payload.length}`);
      const hashingResult = this.uaPkiWrapper.DigestGost34311(payload);
      log(`Finish getHashOfItem: hashingResult errorCode=${hashingResult.errorCode}`);

      if (hashingResult.errorCode != UaPkiResult.Success) {
         throw new Error(inspect(hashingResult));
      }

      const { result } = hashingResult;

      if (result && result.bytes) {
         return result.bytes;
      }

      return '';
   }

   private initUaPkiWrapper(uaPkiWrapper) {
      console.log('INIT uaPkiWrapper ...');
      try {
         const result = uaPkiWrapper.Init(
             this.configFileMode ? pathToConfig : this.config,
             pathToSoFolder
         );

         if (result.errorCode !== UaPkiResult.Success) throw new Error(
             `Failed init ua_pki_wrapper with error code = ${result}`
         );

         console.log('Success initialization ua_pki_wrapper');
      } catch (e) {
         throw e;
      }
   }

   private decodeBufferToBase64(data): Base64 {
      return new TextDecoder('utf8')
          .decode(
              new Uint8Array(data)
          );
   }

   private makeJsonConfigFile(config: string): void {
      fs.writeFileSync(pathToConfig, config);
   }
}