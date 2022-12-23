const config = require('../configs/config');
const log = require('../utils/logger');
const adminHistoryService = require('../services/admin-changes-history.service');
const statusService = require('../services/status.service');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const errors = require('../configs/errors');
const { models } = require('../sequelize-orm');
module.exports = {
    saveOrderStatus: async (req, res) => {
        log.info(`Start post /saveOrderStatus Params: ${JSON.stringify(req.body)}`);
        let { id, title, status, color, lang } = req.body;
        const languages = config.LANGUAGES;
        let result;
        let transaction = await sequelize.transaction();
        try {
            if (!id) {
                status = status ? status : config.GLOBAL_STATUSES.WAITING;
                let originStatus;
                let orderStatus;
                for (let lang of languages) {
                    let statusData = {
                        lang: lang,
                        origin_id: originStatus && originStatus.id ? originStatus.id : 0,
                        title,
                        color,
                        status
                    };
                    orderStatus = await statusService.createOrderStatus(statusData, transaction);
                    await adminHistoryService.adminCreateHistory({ item_id: orderStatus.id, user_id: req.userid, type: 'order_status' }, transaction);
                    if (!originStatus) originStatus = orderStatus;
                }
                originStatus = originStatus.toJSON();
                originStatus.history = await adminHistoryService.adminFindAllHistory({ type: 'order_status', item_id: originStatus.id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()} });
                result = originStatus;
            } else {
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };
                let orderStatus = await statusService.getOrderStatusByFilter(filter);
                if (!orderStatus) {
                    await transaction.rollback();
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }

                let originId = orderStatus.origin_id ? orderStatus.origin_id : orderStatus.id;
                if(status === config.GLOBAL_STATUSES.WAITING) {
                    if(config.DEFAULT_ORDER_STATUSES_IDS.includes(id) || orderStatus.is_default){
                        await transaction.rollback();
                        return res.status(400).json({
                            message: errors.BAD_REQUEST_DEFAULT_IDS_CHANGE_STATUS.message,
                            errCode: errors.BAD_REQUEST_DEFAULT_IDS_CHANGE_STATUS.code
                        });
                    }
                    let isOrderCreated = await models.orders.findOne({where: {status: originId}});
                    if(isOrderCreated) {
                        await transaction.rollback();
                        return res.status(400).json({
                            message: errors.BAD_REQUEST_STATUS_IS_USED.message,
                            errCode: errors.BAD_REQUEST_STATUS_IS_USED.code
                        });
                    }
                }

                let statusObj = {
                    title,
                    color,
                    status,
                    updated_at: new Date(),
                }

                orderStatus = await statusService.updateOrderStatusById(filter, statusObj, transaction );

                await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'order_status' }, transaction);

                const otherLangFilter = { [Op.or]: [{ id: id }, { origin_id: id }] };
                await statusService.updateOrderStatusById(otherLangFilter, {
                    status, updated_at: new Date(), color
                }, transaction);

                orderStatus = orderStatus.toJSON();
                orderStatus.history = await adminHistoryService.adminFindAllHistory({ type: 'order_status', item_id: id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()} });
                result = orderStatus;
            }
            log.info(`End post /saveOrderStatus  Result: ${JSON.stringify(result)}`);
            await transaction.commit();
            return res.status(200).json(result);
        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    getAllOrderStatus: async (req, res) => {
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        log.info(`Start /getAllOrderStatus Params: ${JSON.stringify(req.body)}`);
        try {
            let numberOfWaiting = await statusService.countOrderStatusByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.WAITING });
            let numberOfActive = await statusService.countOrderStatusByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeleted = await statusService.countOrderStatusByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAll = await statusService.countOrderStatusByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
                4: numberOfWaiting
            };

            let filter;
            let filterwhere = { origin_id: 0 };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await statusService.makeOrderStatusFilter(req.body, filterwhere);
            result = await statusService.adminGetAllOrderStatuses(filter, page, perPage, false);
            result.statusCount = statusCount;
            log.info(`End /getAllOrderStatus Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getOrderStatusById: async (req, res) => {
        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {[Op.and]: [
                { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] }
            ]};
        log.info(`Start /getOrderStatusById  Params: ${JSON.stringify(req.params)}`);
        try {
            let orderStatus = await statusService.getOrderStatusByFilter(filter);
            if (!orderStatus) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            orderStatus = orderStatus.toJSON();
            if(config.DEFAULT_ORDER_STATUSES_IDS.includes(orderStatus.id) || orderStatus.is_default){
                orderStatus.is_default = true;
            }else{
                orderStatus.is_default = false;
            }
            orderStatus.history = await adminHistoryService.adminFindAllHistory({ type: 'order_status', item_id: orderStatus.id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()} });

            log.info(`End /getOrderStatusById Result: ${JSON.stringify(orderStatus)}`);
            return res.status(200).json(orderStatus);
        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    deleteOrderStatusByIds: async (req, res) => {
        let { ids } = req.body;
        let result = [];
        log.info(`Start /deleteOrderStatusByIds Params: ${JSON.stringify(req.body)}`);
        const transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                for (let id of ids) {
                    if(config.DEFAULT_ORDER_STATUSES_IDS.includes(id)){
                        await transaction.rollback();
                        return res.status(400).json({
                            message: errors.BAD_REQUEST_DEFAULT_IDS.message,
                            errCode: errors.BAD_REQUEST_DEFAULT_IDS.code
                        });
                    }
                    let orderStatus = await statusService.getOrderStatusByFilter({ id:id });
                    if (!orderStatus) {
                        result.push({ id: id, deleted: false, error: `No found order status with id:${id}` });
                    } else if(orderStatus.is_default){
                        await transaction.rollback();
                        return res.status(400).json({
                            message: errors.BAD_REQUEST_DEFAULT_IDS.message,
                            errCode: errors.BAD_REQUEST_DEFAULT_IDS.code
                        });
                    } else {
                        let isOrderCreated = await models.orders.findOne({where: {status: id}});
                        if(isOrderCreated) {
                            await transaction.rollback();
                            return res.status(400).json({
                                message: errors.BAD_REQUEST_STATUS_IS_USED.message,
                                errCode: errors.BAD_REQUEST_STATUS_IS_USED.code
                            });
                        }
                        if (orderStatus && orderStatus.status == config.GLOBAL_STATUSES.DELETED) {
                            await statusService.deleteOrderStatusById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'order_status' }, transaction);
                        } else {
                            orderStatus = await statusService.updateOrderStatusById({ [Op.or]: [{ id: id }, { origin_id: id }] },
                                { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            result.push(orderStatus);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'order_status' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End /deleteOrderStatusByIds Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);
        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
}
