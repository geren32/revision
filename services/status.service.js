const allSequelize = require('../sequelize-orm');
const { sequelize } = allSequelize;
const { Op } = require("sequelize");
const config = require('../configs/config');
const { models } = require('../sequelize-orm');
const log = require('../utils/logger');

module.exports = {

    createOrderStatus: async(data, trans) => {
        log.info(`Start createOrderStatus data:${JSON.stringify(data)}`);
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.order_statuses.create(data, {
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End createOrderStatus data:${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countOrderStatusByParam: async(whereObj) => {
        log.info(`Start countOrderStatusByParam data:${JSON.stringify(whereObj)}`);
        try {
            let result = await models.order_statuses.count({
                where: whereObj
            });
            log.info(`End countOrderStatusByParam data:${JSON.stringify(result)}`);
            return result ? result : 0;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getOrderStatusByFilter: async(filter, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getOrderStatusByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.order_statuses.findOne({
                where: filter,
                transaction
            });
            log.info(`End function getOrderStatusByFilter  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getOrderStatusesByFilter: async(filter, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getOrderStatusesByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.order_statuses.findAll({
                where: filter,
                transaction
            });
            log.info(`End function getOrderStatusesByFilter  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    updateOrderStatusById: async (params, data, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function updateOrderStatusById Params: ${JSON.stringify({params: params, order_status:data})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.order_statuses.update(data, { where: filter, transaction });
            let result = await models.order_statuses.findOne({
                where: filter,
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End function updateOrderStatusById  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    adminGetAllOrderStatuses: async (filter, page, perPage, attributes) => {
        try {
            log.info(`Start function adminGetAllOrderStatuses Params: ${JSON.stringify({filter: filter, page: page, perPage: perPage, attributes: attributes})}`);
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.order_statuses.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort
            });
            if (result && result.rows && result.rows.length){
                let AllOrderStatuses = [];
                for(let item of result.rows){
                    item = item.toJSON();
                    if(config.DEFAULT_ORDER_STATUSES_IDS.includes(item.id) || item.is_default){
                        item.is_default = true;
                    }else{
                        item.is_default = false;
                    }
                    let lang_change = await models.order_statuses.findAll({
                        where:{ [Op.or]:[ {id:item.id}, {origin_id:item.id} ] },
                        attributes:['id','origin_id','lang'],
                        raw: true
                    })
                    let change = {};
                    for(let id of lang_change){
                        id.history = await models.admin_changes_history.findAll({
                            where:{
                                item_id:id.id ,type:"order_status"
                            },
                            raw: true
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    item.change = change;
                    AllOrderStatuses.push(item);
                }
                result.rows = AllOrderStatuses;
            }
            log.info(`End function  adminGetAllOrderStatuses  Result: ${JSON.stringify(result)}`);
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },


    makeOrderStatusFilter: async(body, whereObj) => {
        log.info(`Start makeOrderStatusFilter data:${JSON.stringify(body)}`)
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({
                        [Op.like]: `%${item}%`
                    });
                });
                arr.push({
                    title: {
                        [Op.or]: like
                    }
                });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.lang) {
            arr.push({ lang: body.lang });
        } else {
            arr.push({ lang: config.LANGUAGES[0] });
        }

        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;
            arr.push({ created_at: date });
        }

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makeOrderStatusFilter data:${JSON.stringify(filter)}`)
        return filter;
    },

    deleteOrderStatusById: async(id, transaction) => {
        log.info(`Start deleteOrderStatusById data:${JSON.stringify(id)}`)
        try {
            await models.order_statuses.destroy({ where: { origin_id: id }, transaction });
            let result = await models.order_statuses.destroy({ where: { id }, transaction });
            log.info(`End deleteOrderStatusById data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
}
