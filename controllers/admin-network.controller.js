const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const citiesService = require('../services/cities.service');
const storesService = require('../services/stores.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { slugify } = require('transliteration');
slugify.config({ lowercase: true, separator: '-' });
const extraUtil = require('../utils/extra-util');
const adminHistoryService = require('../services/admin-changes-history.service');
const log = require('../utils/logger');

module.exports = {

    saveCity: async(req, res) => {
        log.info(`Start saveCity data:${JSON.stringify(req.body)}`)
        let { id, city, status } = req.body;
        const languages = config.LANGUAGES;
        let transaction = await sequelize.transaction();
        try {
            let result
            if (!id) {
                let originCity;
                let cityObj;
                for (let lang of languages) {
                    let cityData = {
                        lang: lang,
                        origin_id: originCity && originCity.id ? originCity.id : 0,
                        city,
                        status: status ? status : config.GLOBAL_STATUSES.ACTIVE
                    };

                    cityObj = await citiesService.createCity(cityData, transaction);

                    await adminHistoryService.adminCreateHistory({ item_id: cityObj.id, user_id: req.userid, type: 'city' }, transaction);

                    if (!originCity) originCity = cityObj;

                }
                originCity = originCity.toJSON();
                originCity.history = await adminHistoryService.adminFindAllHistory({
                    type: 'city',
                    item_id: originCity.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                });
                result = originCity
            } else {
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = {
                    [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                };
                let cityObj = await citiesService.getCityByFilter(filter);
                if (!cityObj) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }


                cityObj = await cityObj.update({
                    city,
                    status,
                }, { transaction });

                await adminHistoryService.adminCreateHistory({ item_id: cityObj.id, user_id: req.userid, type: 'city' }, transaction);
                cityObj = cityObj.toJSON();
                cityObj.history = await adminHistoryService.adminFindAllHistory({
                    type: 'city',
                    item_id: cityObj.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                }, transaction);

                const otherLangFilter = {
                    [Op.or]: [{ id: id }, { origin_id: id }]
                };
                await citiesService.updateCityById(otherLangFilter, {
                    status: status,
                }, transaction);

                result = cityObj
            }
            await transaction.commit();
            log.info(`End saveCity data:${JSON.stringify(result)}`)
            return res.status(200).json(result)
        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getAllCities: async(req, res) => {
        log.info(`Start getAllCities data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;

        try {
            let numberOfActive = await citiesService.countCitiesByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeleted = await citiesService.countCitiesByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAll = await citiesService.countCitiesByParam({
                origin_id: 0,
                status: {
                    [Op.ne]: config.GLOBAL_STATUSES.DELETED
                }
            });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
            };

            let filter;
            let lang
            if(req.body.lang){
                lang = req.body.lang
            } else lang = 'uk'
            let filterwhere = { lang: lang };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = {
                    lang: lang,
                    status: {
                        [Op.ne]: config.GLOBAL_STATUSES.DELETED
                    }
                };
            }
            filter = await citiesService.makeCitiesFilter(req.body, filterwhere);
            result = await citiesService.adminGetAllCities(filter, page, perPage, false);
            if (result.data && result.data.length) {
                result.data = await Promise.all(result.data.map(async(city) => {
                    let stores_number = await storesService.countStoresByParam({ city_id: city.id, origin_id: 0 })
                    return {
                        ...city,
                        stores_number
                    };
                }))
            }
            result.statusCount = statusCount;
            log.info(`End getAllCities data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getCityById: async(req, res) => {
        log.info(`Start getCityById data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {
            [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
        };

        try {
            let city = await citiesService.getCityByFilter(filter);
            if (!city) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            city = city.toJSON();
            city.history = await adminHistoryService.adminFindAllHistory({
                type: 'city',
                item_id: city.id,
                created_at: {
                    [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                }
            });
            log.info(`End getCityById data:${JSON.stringify(city)}`)
            return res.status(200).json(city);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    deleteCitiesByIds: async(req, res) => {
        log.info(`Start deleteCitiesByIds data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;
        let transaction = await sequelize.transaction();
        try {
            let result = [];
            if (ids && ids.length) {

                for (let id of ids) {
                    let city = await citiesService.getCityByFilter({ id });
                    if (!city) {
                        result.push({ id: id, deleted: false, error: `No found city with id:${id}` })
                    } else {
                        if (city && city.status == config.GLOBAL_STATUSES.DELETED) {
                            await citiesService.deleteCityById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'city' }, transaction);

                        } else {
                            city = await citiesService.updateCityById(id, { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            await citiesService.updateCityById({ origin_id: id }, { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            result.push(city);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'city' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End deleteCitiesByIds data:${JSON.stringify(result)}`)
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


    saveStore: async(req, res) => {
        log.info(`Start saveStore data:${JSON.stringify(req.body)}`)
        let { id, title, status, address, map_lat, map_lng, hours, phone, email, city_id, images, icon, icon_hover,link } = req.body;
        const languages = config.LANGUAGES;
        let result
        let transaction = await sequelize.transaction();
        try {

            if (!id) {
                status = status ? status : config.GLOBAL_STATUSES.ACTIVE;
                let originStore;
                let store;
                for (let lang of languages) {
                    let storeData = {
                        lang: lang,
                        origin_id: originStore && originStore.id ? originStore.id : 0,
                        title,
                        status,
                        address,
                        map_lat,
                        map_lng,
                        hours,
                        phone,
                        email,
                        link,
                        city_id,
                        icon_id: icon ? icon.id : null,
                        icon_hover_id: icon_hover ? icon_hover.id : null
                    };

                    if(images && images.length){
                        storeData.images = images.map((item)=> item.block_image.id)
                        storeData.images = JSON.stringify(storeData.images)
                    }


                    store = await storesService.createStore(storeData, transaction);

                    await adminHistoryService.adminCreateHistory({ item_id: store.id, user_id: req.userid, type: 'store' }, transaction);
                    if (!originStore) originStore = store;

                }
                originStore = await storesService.getStoreByFilter({ id: originStore.id },transaction);


                originStore.history = await adminHistoryService.adminFindAllHistory({
                    type: 'store',
                    item_id: originStore.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                });


                result = originStore
            } else {

                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = {
                    [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                };
                let store = await storesService.getStoreByFilter(filter);
                if (!store) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }

                let storeObj ={}

                if(title) storeObj.title = title
                if(status) storeObj.status = status
                if(address) storeObj.address = address
                if(map_lat) storeObj.map_lat = map_lat
                if(map_lng) storeObj.map_lng = map_lng
                if(link) storeObj.link = link
                if(hours) storeObj.hours = hours
                if(phone) storeObj.phone = phone
                if(email) storeObj.email = email
                if(city_id) storeObj.city_id = city_id
                if(icon && icon.id) storeObj.icon_id = icon.id
                if(icon_hover && icon_hover.id) storeObj.icon_hover_id = icon_hover.id

                if(images && images.length){
                    storeObj.images = images.map((item)=> item.block_image.id)
                    storeObj.images = JSON.stringify(storeObj.images)
                }
                store = await storesService.updateStoresById(store.id,storeObj,transaction)
                //store = await store.update(storeObj, {  transaction  });
                await adminHistoryService.adminCreateHistory({ item_id: store.id, user_id: req.userid, type: 'store' }, transaction);
                store = await storesService.getStoreByFilter({ id }, transaction);
                store.history = await adminHistoryService.adminFindAllHistory({
                    type: 'store',
                    item_id: id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                }, transaction);

                const otherLangFilter = {
                    [Op.or]: [{ id: id }, { origin_id: id }]
                };
                await storesService.updateStoresById(otherLangFilter, {
                    status,
                    map_lat,
                    map_lng,
                }, transaction);
                result = store
            }
            await transaction.commit();
            log.info(`End saveStore data:${JSON.stringify(result)}`)
            return res.status(200).json(result)
        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getAllStores: async(req, res) => {
        log.info(`Start getAllStores data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;

        try {
            let numberOfWaiting = await storesService.countStoresByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.WAITING });
            let numberOfActive = await storesService.countStoresByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeleted = await storesService.countStoresByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAll = await storesService.countStoresByParam({
                origin_id: 0,
                status: {
                    [Op.ne]: config.GLOBAL_STATUSES.DELETED
                }
            });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
                3: numberOfWaiting,
            };

            let filter;
            let lang
            if(req.body.lang){
                lang = req.body.lang
            } else lang = 'uk'
            let filterwhere = { lang: lang };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = {
                    lang: lang ,
                    status: {
                        [Op.ne]: config.GLOBAL_STATUSES.DELETED
                    }
                };
            }
            filter = await storesService.makeStoresFilter(req.body, filterwhere);
            result = await storesService.adminGetAllStores(filter, page, perPage, ['id', 'title', 'address', 'status', 'created_at', 'updated_at', 'city_id', 'phone','email','icon_id', 'images'],req.body.sort);
            result.statusCount = statusCount;
            log.info(`End getAllStores data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getStoreById: async(req, res) => {
        log.info(`Start getStoreById data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {
            [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
        };

        try {
            let store = await storesService.getStoreByFilter(filter);
            if (!store) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            store.history = await adminHistoryService.adminFindAllHistory({
                type: 'store',
                item_id: store.id,
                created_at: {
                    [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                }
            });
            log.info(`End getStoreById data:${JSON.stringify(store)}`)
            return res.status(200).json(store);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    deleteStoresByIds: async(req, res) => {
        log.info(`Start deleteStoresByIds data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;

        let transaction = await sequelize.transaction();

        try {
            let result = [];
            if (ids && ids.length) {


                for (let id of ids) {
                    let store = await storesService.getStoreByFilter({ id });
                    if (!store) {
                        result.push({ id: id, deleted: false, error: `No found store with id:${id}` })
                    } else {
                        if (store && store.status == config.GLOBAL_STATUSES.DELETED) {
                            await storesService.deleteStoreById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'store' }, transaction);
                        } else {
                            store = await storesService.updateStoresById(id, { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            await storesService.updateStoresById({ origin_id: id }, { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            result.push(store);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'store' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End deleteStoresByIds data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();

            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    }

}