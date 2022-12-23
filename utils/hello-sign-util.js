const log = require('../utils/logger');
const s3Util = require('../utils/s3-util');
const config = require('../configs/config');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function signatureRequest (file, user) {
    console.log(file, user);
    try {
        log.info(`Start signatureRequest data:${JSON.stringify(null)}`);
        let fileBuffer = await s3Util.getFileBuffer(file);
        let signers = [
            {
                // "email_address": "papasarahtest@gmail.com",
                "email_address": "advokat.market.ua@gmail.com",
                "name": "Admin",
                "order": 0
            },
            {
                "email_address": user.email,
                "name": user.first_name + ' ' + user.last_name,
                "order": 1
            }
        ]
        const formData = new FormData();
        formData.append('file[]', fileBuffer, file.filename);
        formData.append('signers[0][email_address]', "advokat.market.ua@gmail.com");
        formData.append('signers[0][name]', "Admin");
        formData.append('signers[0][order]', 0);
        formData.append('signers[1][email_address]', user.email);
        formData.append('signers[1][name]', user.first_name + ' ' + user.last_name);
        formData.append('signers[1][order]', 1);
        formData.append('test_mode',1);
        // formData.append('use_text_tags',1);
        formData.append('signing_redirect_url',config.FRONT_URL + '/callbackHelloSign/'+ user.id);
        let result = await axios.post(`https://${config.HELLO_SIGN_API_KEY}:@api.hellosign.com/v3/signature_request/send`, formData, {headers: {...formData.getHeaders()}});
        result = result.data;
        log.info(`End signatureRequest data:${JSON.stringify(result)}`);
        return result;
    } catch (e) {
        console.log(e);
        log.error(e);
        throw new Error(e.message);
    }

}

async function orderSign (file, user, order, show_tags) {
    console.log(file, user);
    try {
        log.info(`Start orderSign data:${JSON.stringify(null)}`);
        let fileBuffer = await s3Util.getFileBuffer(file);
        let signers = [
            {
                "email_address": user.email,
                "name": user.first_name + ' ' + user.last_name,
                "order": 0
            },
            {
                "email_address": "advokat.market.ua@gmail.com",
                "name": "Admin",
                "order": 1
            }
        ]
        const formData = new FormData();
        formData.append('file[]', fileBuffer, file.filename);
        formData.append('signers[0][email_address]', user.email);
        formData.append('signers[0][name]', user.first_name + ' ' + user.last_name);
        formData.append('signers[0][order]', 0);
        formData.append('signers[1][email_address]', "advokat.market.ua@gmail.com");
        formData.append('signers[1][name]', "Admin");
        formData.append('signers[1][order]', 1);
        formData.append('test_mode',1);

        if(show_tags) {
            formData.append('use_text_tags',1);
            // formData.append('hide_text_tags',1);
        }

        // formData.append('signers[0][name]', "sig");
        // formData.append('signers[0][editor]', 0);
        // formData.append('signers[1][name]', "sig");
        // formData.append('signers[1][editor]', 1);
        formData.append('signing_redirect_url',config.FRONT_URL + '/callbackHelloSignOrder/'+ order.id);
        let result = await axios.post(`https://${config.HELLO_SIGN_API_KEY}:@api.hellosign.com/v3/signature_request/send`, formData, {headers: {...formData.getHeaders()}});
        result = result.data;
        log.info(`End orderSign data:${JSON.stringify(result)}`);
        return result;
    } catch (e) {
        console.log(e);
        log.error(e);
        throw new Error(e.message);
    }

}

async function getHelloSignFile (request_id) {
    log.info(`Start getHelloSignFile data:${JSON.stringify(request_id)}`);
    // param get_url     if true send amazon s3 file   else   Buffer(file stream)
    let result = await axios.get(`https://${config.HELLO_SIGN_API_KEY}:@api.hellosign.com/v3/signature_request/files/${request_id}?get_url=true`);
    // let result = await axios.get(`https://${config.HELLO_SIGN_API_KEY}:@api.hellosign.com/v3/signature_request/files/${request_id}`);
    result = result.data;
    log.info(`End getHelloSignFile data:${JSON.stringify(request_id)}`);
    return result;
}
async function signatureInfo (signature_request_id) {
    log.info(`Start signatureInfo data:${JSON.stringify(signature_request_id)}`);
    let result = await axios.get(`https://${config.HELLO_SIGN_API_KEY}:@api.hellosign.com/v3/signature_request/${signature_request_id}`);
    result = result.data;
    log.info(`End signatureInfo data:${JSON.stringify(result)}`);
    return result;
}

module.exports = {
    signatureRequest,
    getHelloSignFile,
    signatureInfo,
    orderSign
};
