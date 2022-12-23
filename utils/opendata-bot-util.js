const log = require('../utils/logger');
const config = require('../configs/config');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// async function subscribe (data) {
//     log.info(`Start subscribe data:${JSON.stringify(data)}`)
//
//     // court-by-text
//     // зміни по судовим рішенням за текстом
//     //
//     // court-by-number
//     // зміни по судовим рішенням за номером справи
//
//     let result = await axios.post(`https://opendatabot.com/api/v3/subscriptions?apiKey=${config.OPEN_DATA_BOT_API_KEY}&subscriptionKey=${data}&type=court-by-text`);
//     result = result.data;
//
//     log.info(`End subscribe data:${JSON.stringify(result)}`);
//     return result;
// }
// async function deleteSubscription (data) {
//     log.info(`Start deleteSubscription data:${JSON.stringify(data)}`)
//
//     let result = await axios.delete(`https://opendatabot.com/api/v3/subscriptions/${data}?apiKey=${config.OPEN_DATA_BOT_API_KEY}`);
//     result = result.data;
//
//     log.info(`End deleteSubscription data:${JSON.stringify(result)}`);
//     return result;
// }
// async function history (data) {
//     log.info(`Start history data:${JSON.stringify(data)}`)
//     let result = await axios.get(`https://opendatabot.com/api/v3/history?apiKey=${config.OPEN_DATA_BOT_API_KEY}&subscription_id=${data.subscription_id}&from_id=${data.from_id}`);
//     result = result.data;
//     log.info(`End history data:${JSON.stringify(result)}`);
//     return result;
// }


async function history (data) {
    log.info(`Start history data:${JSON.stringify(data)}`)
    let result = await axios.get(`https://opendatabot.com/api/v3/history?apiKey=${config.OPEN_DATA_BOT_API_KEY}&subscription_id=${data.subscription_id}&from_id=${data.from_id}`);
    result = result.data;
    log.info(`End history data:${JSON.stringify(result)}`);
    return result;
}

module.exports = {
    history
};
