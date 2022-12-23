const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op, where } = require("sequelize");
const config = require('../configs/config');
const log = require('../utils/logger');

module.exports = {
    markAsRead: async(notification_id,user_id, trans) => {
        let transaction = null;
        log.info(`Start service markAsRead`);
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let getNotifications = await models.notifications.findAll({
                where : {
                    [Op.or]: [{ id: notification_id }, { origin_id: notification_id }]
                }
            })
            let ids = []
            if(getNotifications && getNotifications.length){
                getNotifications = getNotifications.map(item => item.toJSON())
                getNotifications.forEach(item => ids.push(item.id))
            }


            let result = await models.user_to_notifications.update({ is_read: 1 }, { where: { notification_id: ids,user_id:user_id }, transaction });

            if (!trans) await transaction.commit();
            log.info(`End service markAsRead. Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(err)
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    createNotification: async(notification_type, user_id, link, order_id, text, trans) => {
        let transaction = null;
        log.info(`Start service createNotification`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            const languages = config.LANGUAGES;
            let originNotification;
            let obj;
            let result;
            for (let lang of languages) {
                if(notification_type === config.NOTIFICATION_TYPES.ORDER) {
                    let order = await models.orders.findOne({where: {id: order_id}});
                    if(order) {
                        order = order.toJSON();
                        if(!user_id) user_id = order.user_id;
                        let orderService
                        if(order.service_id){
                             orderService = await models.service.findOne({where: { [Op.or]: [{ id: order.service_id, lang }, { origin_id: order.service_id, lang }] }});
                        }else if(order.additional_id){
                            orderService = await models.service_additional.findOne({where: {id:order.additional_id}});

                        }
                        let orderStatus = await models.order_statuses.findOne({where: { [Op.or]: [{ id: order.status, lang }, { origin_id: order.status, lang }] }});
                        if(!text) {
                            text = orderService.title + ' ' + orderStatus.title;
                        }
                        if(!link) {
                            link = lang == 'uk' ? `/client/history-order-detail/` : `/${lang}/client/history-order-detail/`;
                            link += order_id;
                        }
                    }
                } else if(notification_type === config.NOTIFICATION_TYPES.CHANGE_PASSWORD) {
                    if(!text) {
                        text = config.NOTIFICATION_TEXTS.CHANGE_PASSWORD[lang];
                    }
                } else if(notification_type === config.NOTIFICATION_TYPES.REGISTER) {
                    if(!text) {
                        text = config.NOTIFICATION_TEXTS.REGISTER[lang];
                    }
                } else if(notification_type === config.NOTIFICATION_TYPES.HELLO_SIGN_WAITING) {
                    if(!text) {
                        text = config.NOTIFICATION_TEXTS.HELLO_SIGN_WAITING[lang];
                    }
                    if(!link) {
                        link = lang == 'uk' ? `/client/cabinet` : `/${lang}/client/cabinet`;
                    }
                } else if(notification_type === config.NOTIFICATION_TYPES.HELLO_SIGN_SUCCESS) {
                    if(!text) {
                        text = config.NOTIFICATION_TEXTS.HELLO_SIGN_SUCCESS[lang];
                    }
                    if(!link) {
                        link = lang == 'uk' ? `/client/cabinet` : `/${lang}/client/cabinet`;
                    }
                } else if(notification_type === config.NOTIFICATION_TYPES.HELLO_SIGN_ORDER_WAITING) {
                    if(!text) {
                        text = config.NOTIFICATION_TEXTS.HELLO_SIGN_ORDER_WAITING[lang];
                    }
                    if(!link) {
                        link = lang == 'uk' ? `/client/history-order-detail/` : `/${lang}/client/history-order-detail/`;
                        link += order_id;
                    }
                } else if(notification_type === config.NOTIFICATION_TYPES.HELLO_SIGN_ORDER_SUCCESS) {
                    if(!text) {
                        text = config.NOTIFICATION_TEXTS.HELLO_SIGN_ORDER_SUCCESS[lang];
                    }
                    if(!link) {
                        link = lang == 'uk' ? `/client/history-order-detail/` : `/${lang}/client/history-order-detail/`;
                        link += order_id;
                    }
                }
                obj = await models.notifications.create({
                    origin_id: originNotification && originNotification.id ? originNotification.id : 0,
                    lang: lang,
                    link: link,
                    text,
                }, {transaction});
                if (!originNotification) originNotification = obj;
                let data = {
                    user_id,
                    notification_id: obj.id,
                    is_read: 0
                };
                await models.user_to_notifications.create(data,{transaction})
            }
            result = originNotification;
            if (!trans) await transaction.commit();
            log.info(`End service createNotification. Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(err)
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    countNotificationsByFilter: async(filter) => {
        log.info(`Start service countNotificationsByFilter,  Params: ${JSON.stringify(filter)}`);
        const result = await models.notifications.count({
            where: filter
        });
        log.info(`End service countNotificationsByFilter  Result: ${JSON.stringify(result)}`);
        return result ? result : 0;
    },
    countUserNotifications: async(user_id, lang) => {
        log.info(`Start service countNotificationsByFilter,  Params: ${JSON.stringify(user_id, lang)}`);

        let result = await models.user.findOne({
            where: {id: user_id},
            include: { model: models.notifications, where: {lang: lang}, as: 'user_notifications', through: {attributes:[], where: {is_read: 0}} }
        });

        if(result && result.user_notifications && result.user_notifications.length) {
            result = result.user_notifications.length;
        } else result = 0;

        log.info(`End service countNotificationsByFilter  Result: ${JSON.stringify(result)}`);
        return result ? result : 0;
    },
    getAllNotificationsByFilter: async(filter, trans) => {
        log.info(`Start service getAllNotifications, params: ${JSON.stringify({filter})}`);
        try {
            let transaction = trans ? trans : null;

            let result = await models.notifications.findAll({
                where: filter,
                transaction
            })
            if(result && result.length) result = result.map(item => item.toJSON())

            log.info(`End service getAllNotifications, result: ${JSON.stringify(result)}`);
            return result
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getAllUserNotificationsByFilter: async(filter, lang, trans) => {
        log.info(`Start service getAllUserNotificationsByFilter, params: ${JSON.stringify({filter})}`);
        try {
            let transaction = trans ? trans : null;

            let result = await models.user.findOne({
                where: filter,
                transaction,
                include: [
                    { model: models.notifications, where: {lang: lang}, as: 'user_notifications', through: {attributes:[]} }
                ]
            });
            // let result = await models.notifications.findAll({
            //     where: filter,
            //     transaction
            // })
            if(result) result = result.toJSON();

            log.info(`End service getAllUserNotificationsByFilter, result: ${JSON.stringify(result)}`);
            return result
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
}
