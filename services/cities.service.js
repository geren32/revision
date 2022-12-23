const allSequelize = require('../sequelize-orm');
const { sequelize } = allSequelize;
const { Op } = require("sequelize");
const log = require('../utils/logger');
const { models } = require('../sequelize-orm');
const config = require('../configs/config');

module.exports = {

    createCity: async(city, trans) => {
        log.info(`Start createCity data:${JSON.stringify(city)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.city.create(city, {
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End createCity data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countCitiesByParam: async(whereObj) => {
        log.info(`Start countCitiesByParam data:${JSON.stringify(whereObj)}`)
        try {
            let result = await models.city.count({
                where: whereObj
            });
            log.info(`End countCitiesByParam data:${JSON.stringify(result)}`)
            return result ? result : 0;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getCityByFilter: async(filter, trans) => {
        log.info(`Start getCityByFilter data:${JSON.stringify(filter)}`)
        let transaction = trans ? trans : null;
        try {
            let result = await models.city.findOne({
                where: filter,
                transaction
            });
            log.info(`End getCityByFilter data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },



    adminGetAllCities: async(filter, page, perPage, attributes) => {
        log.info(`Start adminGetAllCities data:${JSON.stringify(filter, page, perPage, attributes)}`)
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.city.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
            });
            if (result && result.rows && result.rows.length){
                let allCities = []
                result.rows = result.rows.map((item) => item.toJSON())

                for (let i of result.rows) {
                    let lang_change = await models.city.findAll({
                        where: {

                            [Op.or]: [
                                { id: i.id },
                                { origin_id: i.id }
                            ]
                        },
                        attributes: ['id', 'origin_id', 'lang']
                    })
                    lang_change = lang_change.map(i => i.toJSON())
                    let change = {}
                    for (let id of lang_change) {
                        id.history = await models.admin_changes_history.findAll({
                            where: {

                                item_id: id.id,
                                type: "city"
                            }
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    i.change = change
                    allCities.push(i)
                }
                result.rows = allCities
            }



            log.info(`End adminGetAllCities data:${JSON.stringify(result)}`)
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


    makeCitiesFilter: async(body, whereObj) => {
        log.info(`Start makeCitiesFilter data:${JSON.stringify(body)}`)
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
                    city: {
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
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [
                    ['created_at', body.sort.created_at]
                ];
            }
        } else {
            sort = [
                ['created_at', 'DESC']
            ];
        }

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makeCitiesFilter data:${JSON.stringify(filter)}`)
        return filter;
    },

    updateCityById: async(params, city, trans) => {
        log.info(`Start updateCityById data:${JSON.stringify(params, city, trans)}`)
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.city.update(city, { where: filter, transaction });
            let result = await models.city.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End updateCityById data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    deleteCityById: async(id, trans) => {
        log.info(`Start  deleteCityById data:${JSON.stringify(id)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.stores.update({ city_id: null }, { where: { city_id: id }, transaction });
            await models.city.destroy({ where: { origin_id: id }, transaction });
            let result = await models.city.destroy({ where: { id }, transaction });

            if (!trans) await transaction.commit();
            log.info(`End  deleteCityById data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getAllCitiesSimple: async(filter) => {
        log.info(`Start  getAllCitiesSimple data:${JSON.stringify(filter)}`)
        try {
            let result = await models.city.findAll({
                where: filter,
                include: [{
                    model: models.stores,
                    where: filter,
                    required: true,
                    attributes: []
                }]
            });
            if (result && result.length) result = result.map(i => i.toJSON());
            log.info(`End  getAllCitiesSimple data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
}