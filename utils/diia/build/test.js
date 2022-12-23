const  { sdk } = require('./index')
const fs = require('fs')



const test = async () => {
    let payload = fs.readFileSync('dia_test.doc',{encoding: 'base64'});
    // payload = new Buffer(payload);
    // payload = payload.toString('base64');
    payload = [{fileB64: payload, fileName: 'dia_test.doc'}]
 let result  =   await sdk('37VM3RF66FuJyfgVLdPHWUTQjr2S22XUKJxpsP5869uuem2BrF9crEDAUv4M8Shu',"api2.diia.gov.ua",{}, "uapki" )

   let hash =  await result.getSignHashDeepLink(
       {
        "offerId":"c09e71d47bbc4e9ead637940c9210a917c2106fe7efcf4c785b91372e4c12b8d6d9587b1fb2108d670a79720863dc5f25b45dd6673599b57063183a892b56721",
        "branchId":"0adafbdeeb364c4b2a58952cf93c19674cdc641364cf2c8fe6137bd17865bf2844b8903d7a07f83353af80ebaeb283f928c67f8cbebf1800dbedea970019460b",
       "requestId":"c13c5365-1387-4413-ac12-c8a637d887c6"

    },payload)

    console.log(hash)
}


test()
