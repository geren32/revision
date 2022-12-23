const _ = require('lodash');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const { models, transaction } = require('../sequelize-orm');
const log = require('../utils/logger');
module.exports = {

    getPromocode: async(filter) => {
        log.info(`Start getPromocode service data:${JSON.stringify(filter)}`)
        try {
            let result = await models.promocode.findOne({
                where: filter
            })
            if (result) {
                result = result.toJSON();
                log.info(`End getPromocode service data:${JSON.stringify(result)}`)
                return result
            } else return false
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    makePromocodeFilter: async(body, whereObj) => {
        log.info(`Start makePromocodeFilter service data:${JSON.stringify(body)}`)
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

        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;

            arr.push({ created_at: date });
        }
        if (body.sort && body.sort.key && body.sort.direction) {
            sort = [[body.sort.key, body.sort.direction]];
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makePromocodeFilter service data:${JSON.stringify(filter)}`)
        return filter;
    },
    countPromocodeByParam: async(whereObj) => {
        log.info(`Start countPromocodeByParam service data:${JSON.stringify(whereObj)}`)
        try {
            let result = await models.promocode.count({
                where: whereObj
            });
            log.info(`End countPromocodeByParam service data:${JSON.stringify(result)}`)
            return result ? result : 0;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getPromocodes: async(filter, page, perPage) => {
        log.info(`Start getPromocodes service data:${JSON.stringify(filter, page, perPage)}`)
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.promocode.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                distinct: true
            })
            log.info(`End getPromocodes service data:${JSON.stringify(result)}`)
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    createPromocode: async(data, trans) => {
        log.info(`Start createPromocode service data:${JSON.stringify(data)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            data.usage_count = 0
            let result = await models.promocode.create(data, transaction)
            result = result.toJSON();
            if (!trans) await transaction.commit();
            log.info(`End createPromocode service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updatePromocode: async(data, find_by, trans) => {
        log.info(`Start updatePromocode service data:${JSON.stringify(data, find_by)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.promocode.update(data, { where: find_by, transaction })
            let result = await models.promocode.findOne({ where: find_by, transaction })

            if (!trans) await transaction.commit();
            log.info(`End updatePromocode service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deletePromocode: async(data, trans) => {
        log.info(`Start deletePromocode service data:${JSON.stringify(data)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.promocode.destroy({ where: { id: data.id }, transaction })
            if (!trans) await transaction.commit();
            log.info(`End deletePromocode service data:${JSON.stringify(true)}`)
            return true;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

}