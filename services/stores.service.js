const allSequelize = require('../sequelize-orm');
const { sequelize } = allSequelize;
//const models = allSequelize.sequelize.models;
//const modelsOut = allSequelize.sequelizeOut.models;
const { Op } = require("sequelize");
const config = require('../configs/config');

const { models } = require('../sequelize-orm');
const log = require('../utils/logger');

module.exports = {

    createStore: async(store, trans) => {
        log.info(`Start createStore data:${JSON.stringify(store)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.stores.create(store, {
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End createStore data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countStoresByParam: async(whereObj) => {
        log.info(`Start countStoresByParam data:${JSON.stringify(whereObj)}`)
        try {
            let result = await models.stores.count({
                where: whereObj
            });
            log.info(`End countStoresByParam data:${JSON.stringify(result)}`)
            return result ? result : 0;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getStoreByFilter: async(filter, trans) => {
        log.info(`Start getStoreByFilter data:${JSON.stringify(filter)}`)
        let transaction = trans ? trans : null;
        try {
            let result = await models.stores.findOne({
                where: filter,
                include: [
                    //{ model: models.networks, as: "network" },
                    { model: models.city, as: "city" },
                    { model: models.uploaded_files, as: 'icon' },
                    { model: models.uploaded_files, as: 'icon_hover' },
                ],
                transaction
            });
            if (result) {
                
                result = result.toJSON()
                let images_result
                if (result.images) {
                    let images = JSON.parse(result.images)
                    images_result = await models.uploaded_files.findAll({
                        where: {
                            id: {
                                [Op.in]: images
                            }
                        },
                        transaction
                    })
                }
                if (images_result && images_result.length) {
                    images_result = images_result.map((item) => item.toJSON())

                    let arr = []
                    images_result.forEach((item) => arr.push({ "block_image": item }))
                    result.images = arr
                } else result.images = []
            }
            log.info(`End getStoreByFilter data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },



    adminGetAllStores: async(filter, page, perPage, attributes,sort) => {
        log.info(`Start adminGetAllStores data:${JSON.stringify(filter, page, perPage, attributes)}`)
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;


            if(!sort){
                sort = [['created_at', 'DESC']]
            } else if(sort && sort.direction && sort.key =='city'){
                sort = [[{model: models.city},"city", sort.direction]]
            } else if(sort && sort.direction && sort.key !='city'){
                sort = [[sort.key, sort.direction]];
            } else  sort = [['created_at', 'DESC']]
            

            let result = await models.stores.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: sort,
                attributes: attributes,
                distinct: true,
                include: [
                    { model: models.city, as: "city" },
                    { model: models.uploaded_files, as: 'icon' },
                    { model: models.uploaded_files, as: 'icon_hover' },
                ],
            });



            if (result && result.rows && result.rows.length) {

                let allStores = []
                result.rows = result.rows.map((item) => item.toJSON())
                for (let i of result.rows) {
                    let images_result
                    if (i.images) {
                        let images = JSON.parse(i.images)
                        images_result = await models.uploaded_files.findAll({
                            where: {
                                id: {
                                    [Op.in]: images
                                }
                            }
                        })
                    }
                    if (images_result && images_result.length) {
                        images_result = images_result.map((item) => item.toJSON())

                        let arr = []
                        images_result.forEach((item) => arr.push({ "block_image": item }))
                        i.images = arr
                    }
                    let lang_change = await models.stores.findAll({
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
                                type: "store"
                            }
                        })
                        for (const lang of config.LANGUAGES) {
                            if (id.lang === lang) {
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    i.change = change
                    allStores.push(i)
                }
                result.rows = allStores
            }



            log.info(`End adminGetAllStores data:${JSON.stringify(result)}`)
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


    makeStoresFilter: async(body, whereObj) => {
        log.info(`Start makeStoresFilter data:${JSON.stringify(body)}`)
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
        if (body.city_id) {
            arr.push({ city_id: body.city_id });
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

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makeStoresFilter data:${JSON.stringify(filter)}`)
        return filter;
    },

    updateStoresById: async(params, store, trans) => {
        log.info(`Start updateStoresById data:${JSON.stringify(params, store)}`)
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.stores.update(store, { where: filter, transaction });
            let result = await models.stores.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End updateStoresById data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    deleteStoreById: async(id, transaction, transactionOut) => {
        log.info(`Start deleteStoreById data:${JSON.stringify(id)}`)
        try {
            //await modelsOut.shopping_history.update({ store_id: null }, { where: { store_id: id }, transaction: transactionOut });
            await models.stores.destroy({ where: { origin_id: id }, transaction });
            let result = await models.stores.destroy({ where: { id }, transaction });
            log.info(`End deleteStoreById data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getStoreIdByFilter: async(body, attributes) => {
        log.info(`Start getStoreIdByFilter data:${JSON.stringify(body, attributes)}`)
        try {
            let arr = [{ status: config.GLOBAL_STATUSES.ACTIVE }];

            if (body.network_id) {
                arr.push({ network_id: body.network_id });
            }
            if (body.city_id) {
                arr.push({ city_id: body.city_id });
            }
            if (body.store_id) {
                arr.push({ id: body.store_id });
            }
            let result = await models.stores.findAll({
                where: {
                    [Op.and]: arr
                },
                attributes: attributes
            });
            log.info(`End getStoreIdByFilter data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
}