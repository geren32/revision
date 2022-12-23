const log = require('../utils/logger');
const config = require("../configs/config");
const errors = require("../configs/errors");
const {models} = require("../sequelize-orm");
const cronService = require('../services/cron-service');
const emailUtil = require("../utils/mail-util");
const axios = require('axios');
const notificationService = require("../services/notification-service");
const statusService = require('../services/status.service');
const translate = require('@vitalets/google-translate-api');
module.exports = {
    cronOrderFileToMail: async (req, res) => {
        log.info(`Start  post /cronOrderFileToMail ${JSON.stringify(req.params.key)} `);
        let key = req.params.key
        let valid_key = config.CRON_API_KEY
        if(!key || key && key != valid_key){
            return res.status(errors.BAD_REQUEST_CRON_NOT_VALID.code).json({
                message: errors.BAD_REQUEST_CRON_NOT_VALID.message,
                errCode: errors.BAD_REQUEST_CRON_NOT_VALID.code
            });
        }
        try{
            let send_to_mail = await models.configs.findOne({where:{type:'orders_mail_to_client'},raw:true})
            if(send_to_mail && send_to_mail.value){
                send_to_mail = JSON.parse(send_to_mail.value)
            }
            if(send_to_mail){
                let orders = await cronService.getAllOrdersByCron({send_status:1})
                if(orders && orders.length && send_to_mail.enabled){
                    if(send_to_mail.in_create && send_to_mail.enabled && send_to_mail){
                        for(let item of orders){
                            if(send_to_mail.message_to_e_mail){
                                if(item.pay_type == 1 && item.pay_status == 2 || item.pay_type == 2 && item.pay_status == 3){
                                    let clientMailObj = {
                                        to: item.user.email,
                                        subject: 'Доброго дня, ваш документ!',
                                        data: {
                                            name: item.service.title,
                                            order:item,
                                        },
                                        attachments:[
                                            {
                                                path:config.FRONT_URL + '/booking/getFileOrders/'+item.id,
                                                filename:item.file.filename
                                            }
                                        ]
                                    };
                                    emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                                    await cronService.updateOrderSendStatus({send_status:2},{id:item.id})
                                }else if(item.pay_type == 3){
                                    let clientMailObj = {
                                        to: item.user.email,
                                        subject: 'Доброго дня, ваш документ!',
                                        data: {
                                            name: item.service.title,
                                            order:item,
                                        },
                                        attachments:[
                                            {
                                                path:config.FRONT_URL + '/booking/getFileOrders/'+item.id,
                                                filename:item.file.filename
                                            }
                                        ]
                                    };
                                    emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                                    await cronService.updateOrderSendStatus({send_status:2},{id:item.id})
                                }
                            }
                        }
                    }else{
                        for(let item of orders){
                            let date = new Date
                            if(!item.send_time || item.send_time && item.send_time <= date){
                                if(send_to_mail.message_to_e_mail){
                                    if(item.pay_type == 1 && item.pay_status == 2 || item.pay_type == 2 && item.pay_status == 2){
                                        if(item.file){
                                            let clientMailObj = {
                                                to: item.user.email,
                                                subject: 'Доброго дня, ваш документ!',
                                                data: {
                                                    name: item.service.title,
                                                    order:item,
                                                },
                                                attachments:[
                                                    {
                                                        path:config.FRONT_URL + '/booking/getFileOrders/'+item.id,
                                                        filename:item.file.filename
                                                    }
                                                ]
                                            };
                                            emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                                        }
                                        await cronService.updateOrderSendStatus({send_status:2},{id:item.id})
                                    }else if(item.pay_type == 3){
                                        if(item.file){
                                            let clientMailObj = {
                                                to: item.user.email,
                                                subject: 'Доброго дня, ваш документ!',
                                                data: {
                                                    name: item.service.title,
                                                    order:item,
                                                },
                                                attachments:[
                                                    {
                                                        path:config.FRONT_URL + '/booking/getFileOrders/'+item.id,
                                                        filename:item.file.filename
                                                    }
                                                ]
                                            };
                                            emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                                        }
                                        await cronService.updateOrderSendStatus({send_status:2},{id:item.id})
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return res.status(200).json(true)
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    cronCourtStatus: async (req, res) => {
        log.info(`Start get /cronCourtStatus`);
        let languages = config.LANGUAGES;
        try{
            // let a = await axios.post(`https://opendatabot.com/api/v3/subscriptions?apiKey=${undefined}&subscriptionKey=23494714&type=court-by-number`)
            // console.log(a);

            let orders = models.orders.findAll({where: {is_court_send: true}});
            await Promise.all(orders.map(async order => {
                order = order.toJSON();
                if(!order.subscription_id) {
                    let subscription = await axios.post(`https://opendatabot.com/api/v3/subscriptions?apiKey=${undefined}&subscriptionKey=${order.subscription_key}&type=court-by-text`);
                    if(subscription.data && subscription.data.subscriptionId) {
                        order.subscription_id = subscription.data.subscriptionId;
                        await models.orders.update({subscription_id: order.subscription_id},{where: {id: order.id}});
                    }
                }
                if(order.subscription_id) {
                    let from_id;
                    if(order.history) {
                        order.history = JSON.parse(order.history);
                        if(order.history && order.history.length) {
                            from_id = order.history[0].notification_id;
                        }
                        let newHistory;
                        if(from_id) {
                            newHistory = await axios.get(`https://opendatabot.com/api/v3/history?apiKey=${undefined}&subscription_id=${order.subscription_id}&from_id=${from_id}`);
                            order.history = JSON.stringify(order.history.push(...newHistory.data.items));
                        } else {
                            newHistory = await axios.get(`https://opendatabot.com/api/v3/history?apiKey=${undefined}&subscription_id=${order.subscription_id}`);
                            order.history = JSON.stringify(newHistory.data.items);
                        }
                        if(newHistory && newHistory.data && newHistory.data.items && newHistory.data.items.length) {
                            await Promise.all(newHistory.data.items.map(async history_info => {
                                let isOrderStatusCreated = await statusService.getOrderStatusByFilter({title: history_info.typeDescription});
                                if(!isOrderStatusCreated) {
                                    let originStatus;
                                    for (let lang of languages) {
                                        let title;
                                        if(lang === languages[0]) {
                                            title = history_info.typeDescription;
                                        } else {
                                            let value = await translate(history_info.typeDescription, { client: 'gtx', from: 'uk', to: lang });
                                            title = value.text;
                                        }
                                        let statusData = {
                                            lang: lang,
                                            origin_id: originStatus && originStatus.id ? originStatus.id : 0,
                                            title,
                                            color: '#FECC00',
                                            status: config.GLOBAL_STATUSES.ACTIVE,
                                            is_default: true
                                        };
                                        let orderStatus = await statusService.createOrderStatus(statusData);
                                        if (!originStatus) originStatus = orderStatus;
                                    }
                                }
                                await notificationService.createNotification(config.NOTIFICATION_TYPES.ORDER,order.user_id, null, order.id, null);
                            }))
                        }
                    }
                }
            }));

            log.info(`End get /cronCourtStatus`);
            return res.status(200).json(true)
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
}
