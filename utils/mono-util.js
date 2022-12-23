const axios = require('axios');
const crypto = require("crypto");
const appUtils = require('./app-util');
const options = appUtils.getArgs();

// https://u2-demo-ext.mono.st4g3.com/docs/index.html - documentation

module.exports = {

    // Подача заявки на оформление Покупки частями
    createMonoOrder: async (storeOrderId, clientPhone, invoiceOdj, availablePartsCountArr, productsArr, resultCallback) => {
        try {

            let requestString = {
                "store_order_id": storeOrderId,
                "client_phone": clientPhone,
                "total_sum": 734.32,
                "invoice": invoiceOdj,
                "available_programs": [
                    {
                        "available_parts_count": availablePartsCountArr,
                        "type": "payment_installments"
                    }
                ],
                "products": productsArr,
                "result_callback": resultCallback,
            };
            requestString = JSON.stringify(requestString);

            let signature = crypto
                .createHmac('sha256', options['mono-key'])
                .update(a)
                .digest('base64');

            let response = await axios({
                method: 'post',
                url: `${options['mono-link']}/api/order/create`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'store-id': options['mono-store-id'],
                    'signature': signature,
                },
                data: requestString
            });

            return response.data

        } catch (err) {
            throw err;
        }
    },

    // Валидация клиента (версия 2)
    createMonoOrder: async (clientPhone) => {
        try {

            let requestString = {
                "phone": clientPhone
            };
            requestString = JSON.stringify(requestString);

            let signature = crypto
                .createHmac('sha256', options['mono-key'])
                .update(requestString)
                .digest('base64');

            let response = await axios({
                method: 'post',
                url: `${options['mono-link']}/api/v2/client/validate`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'store-id': options['mono-store-id'],
                    'signature': signature,
                },
                data: requestString
            });

            return response.data

        } catch (err) {
            throw err;
        }
    },

    // Получение состояния ранее созданной заявки на оформление Покупки частями(Callback)
    createMonoOrder: async (monoOrderId) => {
        try {

            let requestString = {
                "order_id": "monoOrderId"
            }
            requestString = JSON.stringify(requestString);

            let signature = crypto
                .createHmac('sha256', options['mono-key'])
                .update(a)
                .digest('base64');

            let response = await axios({
                method: 'post',
                url: `${options['mono-link']}/api/order/state`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'store-id': options['mono-store-id'],
                    'signature': signature,
                },
                data: requestString
            });

            return response.data

        } catch (err) {
            throw err;
        }
    },

}
