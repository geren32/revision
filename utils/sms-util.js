const twilio = require('twilio');
const config = require('../configs/config');
const log = require('./logger');
const axios = require('axios')
const { models } = require("../sequelize-orm");
module.exports = {
    sendSMS: async(body, from, to) => {
        log.info(`Start function sendSMS. DATA: ${JSON.stringify({body, from, to})}`);
        const client = new twilio(config.SMS_ACCOUNT_ID, config.SMS_AUTH_TOKEN);
        let data = {
            body: body,
            from: from,
            to: to
        }
        let result = await client.messages.create(data)
        log.info(`End function sendSMS. DATA: ${JSON.stringify(result)}`);
        return result
    },
    sendTurboSMS: async(receivers,text) => {
        log.info(`Start function sendSMS. DATA: ${JSON.stringify(receivers,text)}`);
        try {
            let APIkey =  await models.configs.findOne({ where: { type: 'sms_api_key' }, raw: true });
            APIkey = APIkey.value;

            let result = await axios({
                method: "post",
                url: "https://api.turbosms.ua/message/send.json",
                data: {
                    "recipients":receivers,
                    // "viber":{
                    //     "sender": "Advokat M.",
                    //     "text": text
                    // },
                    "sms":{
                        "sender": "Advokat M.",
                        "text": text
                    },
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${APIkey}`
                },
            });

            // axios.post(`https://api.turbosms.ua/message/send.json`, {
            //     "recipients":receivers,
            //     "viber":{
            //         "sender": "POZOV",
            //         "text": text
            //     },
            //     "token":APIkey,
            //     "sms":{
            //         "sender": "POZOV",
            //         "text": text
            //     },
            // }, {
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${APIkey}`
            //     },
            // })
            // .then(function(response) {
            //     console.log(response);
            //     return
            // })
            // .catch(function(error) {
            //     console.log(error);
            //     return
            // });
            console.log(result.data);
            log.info(`End function sendSMS. DATA: ${JSON.stringify(result.data)}`);
            return result.data;
        } catch (e) {
            console.log(e);
            log.error(e)
            let err = new Error(e.message);
            throw err;
        }
    }
}
