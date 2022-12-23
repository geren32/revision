const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const adminPromocodeService = require('../services/admin-promocode.service')
const config = require('../configs/config');
const errors = require('../configs/errors');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const userService = require('../services/user.service');
const log = require('../utils/logger');

module.exports = {
    getAllPromocodes: async(req, res) => {
        log.info(`Start getAllPromocodes data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfNotActive = await adminPromocodeService.countPromocodeByParam({ status: config.PROMOCODE_STATUSES[3].value });
            let numberOfActive = await adminPromocodeService.countPromocodeByParam({ status: config.PROMOCODE_STATUSES[2].value });
            let numberOfDeleted = await adminPromocodeService.countPromocodeByParam({ status: config.PROMOCODE_STATUSES[1].value });
            let numberOfUsed = await adminPromocodeService.countPromocodeByParam({ status: config.PROMOCODE_STATUSES[4].value });
            let numberOfAll = await adminPromocodeService.countPromocodeByParam({
                status: {
                    [Op.ne]: config.PROMOCODE_STATUSES[4].value
                }
            });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
                3: numberOfNotActive,
                4: numberOfUsed,
            };

            let filterwhere
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = {
                    status: {
                        [Op.ne]: config.PROMOCODE_STATUSES[1].value
                    }
                };
            }
            let filter = await adminPromocodeService.makePromocodeFilter(req.body, filterwhere);
            let result = await adminPromocodeService.getPromocodes(filter, page, perPage);
            result.statusCount = statusCount;
            log.info(`End getAllPromocodes data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    savePromocode: async(req, res) => {
        log.info(`Start savePromocode data:${JSON.stringify(req.body)}`)
        let transaction = await sequelize.transaction();
        let promocode_data = req.body
        let final_result
        try {
            if (!promocode_data.id) {
                if (!promocode_data.title || !promocode_data.discount || (promocode_data.type !== config.PROMOCODES_TYPES.PERCENT && promocode_data.type !== config.PROMOCODES_TYPES.VALUE) || !promocode_data.total_usage) {

                    return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                        message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                        errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });
                }
                if (parseInt(promocode_data.usage_count) >= parseInt(promocode_data.total_usage)) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_PROMOCODE_USAGE_CANT_BE_GRATER_THAN_TOTAL_USAGE.message,
                        errCode: errors.BAD_REQUEST_PROMOCODE_USAGE_CANT_BE_GRATER_THAN_TOTAL_USAGE.code,
                    });
                }

                if (promocode_data.discount > 90 && promocode_data.type == config.PROMOCODES_TYPES.PERCENT) {

                    return res.status(400).json({
                        message: errors.BAD_REQUEST_PROMOCODE_DISCOUNT_PROCENT_CANT_BE_MORE_THAN_90.message,
                        errCode: errors.BAD_REQUEST_PROMOCODE_DISCOUNT_PROCENT_CANT_BE_MORE_THAN_90.code,
                    });
                }
              

                let findPromocode = await adminPromocodeService.getPromocode({ title: promocode_data.title });
                if (findPromocode) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_PROMOCODE_ALREADY_EXIST.message,
                        errCode: errors.BAD_REQUEST_PROMOCODE_ALREADY_EXIST.code,
                    });
                }
                promocode_data.status = config.PROMOCODE_STATUSES[2].value
                const result = await adminPromocodeService.createPromocode(promocode_data, transaction);
                await adminChangesHistoryService.adminCreateHistory({
                    item_id: result.id,
                    user_id: req.userid,
                    type: 'promocode'
                }, transaction);

                //await transaction.commit();
                //log.info(`End savePromocode data:${JSON.stringify(result)}`)
                final_result = result
                //return res.status(200).json(result);
            } else if (promocode_data.id && promocode_data.status && Object.keys(promocode_data).length == 2) {
                const result = await adminPromocodeService.updatePromocode(promocode_data, { id: promocode_data.id }, transaction);
                await adminChangesHistoryService.adminCreateHistory({
                    item_id: result.id,
                    user_id: req.userid,
                    type: 'promocode'
                }, transaction);
                //await transaction.commit();
                //log.info(`End savePromocode data:${JSON.stringify(result)}`)
                //return res.status(200).json(result);
                final_result = result
            } else {
                if (!promocode_data.title || !promocode_data.discount || !promocode_data.status || (promocode_data.type !== config.PROMOCODES_TYPES.PERCENT && promocode_data.type !== config.PROMOCODES_TYPES.VALUE) || !promocode_data.total_usage) {
                    return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                        message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                        errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });
                }
                if (parseInt(promocode_data.usage_count) >= parseInt(promocode_data.total_usage)) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_PROMOCODE_USAGE_CANT_BE_GRATER_THAN_TOTAL_USAGE.message,
                        errCode: errors.BAD_REQUEST_PROMOCODE_USAGE_CANT_BE_GRATER_THAN_TOTAL_USAGE.code,
                    });
                }
                if (promocode_data.discount > 90 && promocode_data.type == config.PROMOCODES_TYPES.PERCENT) {

                    return res.status(400).json({
                        message: errors.BAD_REQUEST_PROMOCODE_DISCOUNT_PROCENT_CANT_BE_MORE_THAN_90.message,
                        errCode: errors.BAD_REQUEST_PROMOCODE_DISCOUNT_PROCENT_CANT_BE_MORE_THAN_90.code,
                    });
                }
                if (promocode_data.type != config.PROMOCODES_TYPES.PERCENT && promocode_data.type != config.PROMOCODES_TYPES.VALUE) {

                    return res.status(400).json({
                        message: errors.BAD_REQUEST_PROMOCODE_TYPE_IS_INVALID.message,
                        errCode: errors.BAD_REQUEST_PROMOCODE_TYPE_IS_INVALID.code,
                    });
                }
              
                let findPromocode = await adminPromocodeService.getPromocode({ id: promocode_data.id });
                if (!findPromocode) {
                    return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                    });
                }
                const result = await adminPromocodeService.updatePromocode(promocode_data, { id: promocode_data.id }, transaction);
                await adminChangesHistoryService.adminCreateHistory({
                    item_id: result.id,
                    user_id: req.userid,
                    type: 'promocode'
                }, transaction);
                
               
                //return res.status(200).json(result);
                final_result = result
            }
            await transaction.commit();
            log.info(`End savePromocode data:${JSON.stringify(final_result)}`)
            return res.status(200).json(final_result);
        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getPromocodeById: async(req, res) => {
        log.info(`Start getPromocodeById data:${JSON.stringify(req.body)}`)
        try {
            const id = req.params.id;
            let promocode = await adminPromocodeService.getPromocode({ id: id });

            if (!promocode) {
                return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                });
            }
            if (promocode.user_id != 0) {

                let getUser = await userService.getUserById(promocode.user_id)
                if (getUser) {
                    promocode.user = getUser
                } else promocode.user = null
            } else promocode.user = null
            promocode.history = await adminChangesHistoryService.adminFindAllHistory({
                type: 'promocode',
                item_id: promocode.id,
                created_at: {
                    [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                }
            });
            log.info(`End getPromocodeById data:${JSON.stringify(promocode)}`)
            return res.status(200).json(promocode);

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: 4001
            });

        }
    },
    deletePromocodes: async(req, res) => {
        log.info(`Start deletePromocodes data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;
      
        const transaction = await sequelize.transaction();
        try {
            let result = [];
            if (ids && ids.length) {
                for (let id of ids) {
                    let promocode = await adminPromocodeService.getPromocode({ id: id });
                    if (!promocode) {
                        return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                        });
                    }
                    if (promocode.status != config.PROMOCODE_STATUSES[1].value) {
                        await adminPromocodeService.updatePromocode({ status: config.PROMOCODE_STATUSES[1].value }, { id: id }, transaction);
                        result.push({ id: id, basket: true });
                    } else {
                        await adminPromocodeService.deletePromocode({ id: id, status: config.PROMOCODE_STATUSES[1].value }, transaction);

                        result.push({ id: id, deleted: true })
                    }
                }
            }
            await transaction.commit();
            log.info(`End deletePromocodes data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    }
}