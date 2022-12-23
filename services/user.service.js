const { models, model } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op, json } = require("sequelize");
const config = require('../configs/config');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const log = require("../utils/logger");
const userAttributes = [
    'email',
    'role'

];



module.exports = {
    getUserByPhone:async (phone)=>{
        return await models.user.findOne({where:{phone:phone},raw:true})
    },
    uploadUserDocuments:async (document,id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let document_file = await models.user_uploaded_files.create(document,{transaction,raw:true})
            if(document_file){
                await models.orders_to_user_uploaded_files.create({
                    order_id:id,
                    user_uploaded_files_id:document_file.id
                },{transaction})
            }
            return true;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }

    },
    uploadFormFiles:async (document,id)=>{
        try {
            let document_file = await models.user_uploaded_files.create(document,{raw:true})
            if(document_file){
                await models.form_comments_to_uploaded_files.create({
                    form_comment_id:id,
                    uploaded_files_id:document_file.id
                },)
            }
            return document_file;
        } catch (err) {
            err.code = 400;
            throw err;
        }

    },
    getOutUserInfo: async(params, attributes, withInclude) => {
        let filter = params;
        if (typeof params !== 'object') {
            filter = { id: params }
        }
        try {
            let result;
            if(withInclude) {
                result = await models.user.findOne({
                    where: filter,
                    attributes: attributes,
                    include: [
                        {model: models.user_uploaded_files, as: 'user_contract'}
                    ]
                });
                if(result) result = result.toJSON();
            } else {
                result = await models.user.findOne({
                    where: filter,
                    attributes: attributes,
                    raw: true
                });
            }

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    createUser: async(user, trans) => {
        let transaction = null;
        try {

            transaction = trans ? trans : await sequelize.transaction();
            const result = await models.user.create(user, {
                transaction
            });
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    getUser: async(params, attributes) => {
        log.info(`Start getUser data:${JSON.stringify(params, attributes)}`)
        let filter = params;

        if (typeof params !== 'object') {
            filter = { id: params }
        }
        const result = await models.user.findOne({
            where: filter,
            attributes: attributes,
        });
        log.info(`End getUser data:${JSON.stringify(result)}`)
        return result;
    },
    getAllUsersByRegions: async(filter) => {

        try {
            let result = await models.user.findAll({
                where: filter,
                include: [
                    { model: models.dealer, attributes: ['id', 'company_name', 'manager_sr_id'], include: [{ model: models.manager_sr }] }
                ]
            })

            return result;
        } catch (error) {
            error.code = 400
        }


    },
    getAllUser: async(params, attributes) => {
        let filter = params;
        if (typeof params !== 'object') {
            filter = { id: params }
        }
        const result = await models.user.findAll({
            where: filter,
            attributes: attributes
        });
        return result;
    },

    getUserDetails: async(params, attributes, withInclude) => {
        log.info(`Start getUserDetails service ${JSON.stringify(params, attributes)}`)
        let filter = params;
        if (typeof params !== 'object') {
            filter = { id: params }
        }
        let result = await models.user.findOne({
            where: filter,
        });
        if (result) {
            result = result.toJSON();
            if(result.is_private && result.is_private == 2){
                result.is_private = true
            }else{
                result.is_private = false
            }
            if(withInclude) {
                result.orders = await models.orders.findAll({
                    where: {user_id: result.id},
                    include: [
                        {
                            model: models.service, include: {
                                model: models.service_category, as: "service_category", through:{attributes:[]}
                            }
                        }
                    ]
                });
            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({ type: 'user', item_id: result.id });
        }
        log.info(`End getUserDetails service ${JSON.stringify(result)}`)
        return result;
    },

    getAllUsers: async(attributes) => {
        const result = await models.user.findAndCountAll({
            attributes: attributes
        });

        return result.count > 0 && result.rows.length ? {
            users: result.rows,
            count: result.count
        } : { users: [], count: 0 };
    },

    getUserById: async(user_id) => {
        try {

            let result = await models.user.findByPk(user_id, {
                attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'phone', 'created_at'],
            });
            result = result.toJSON()
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    filterUser: async(filter) => {
        try {

            let result = await models.user.findOne({ where: filter });

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllUsers: async(filter, page, perPage, attributes) => {
        try {

            const offset = perPage * (page - 1);
            const limit = perPage;

            let result = await models.user.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
            });


            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminCountsStatus: async(statusCode) => {
        try {

            let result = await models.user.count({
                where: { status: statusCode },
            });

            return result ? result : 0;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminCountsAllStatus: async() => {
        try {

            let result = await models.user.count({
                where: {
                    status: {
                        [Op.ne]: config.GLOBAL_STATUSES.DELETED
                    },
                }
            });
            return result ? result : 0;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminCountsDealerByRegionId: async(regionId) => {
        try {

            let result = await models.user.count({
                where: {
                    [Op.and]: [
                        { status: config.GLOBAL_STATUSES.ACTIVE },
                        { role: config.DEALER_ROLE },

                    ]
                }
            });

            return result ? result : 0;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetDealerByRegionId: async(regionId, attributes) => {
        try {

            let result = await models.user.findAll({
                where: {
                    [Op.and]: [
                        { status: config.GLOBAL_STATUSES.ACTIVE },
                        { role: config.DEALER_ROLE },
                    ]
                },
                attributes: attributes,
                include: [{
                    model: models.dealer,
                    attributes: ['company_name']
                }]
            });

            return result;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    findUsersByFilter: async(filter) => {
        let result = await models.user.findAll({
            where: filter,
            attributes: ['id', 'email', 'role'],

        })
        return result;
    },
    updateUserByFilter: async(data, filter) => {
        try {
            log.info(`Start updateUserByFilter Params: ${JSON.stringify(data)}`)
            await models.user.update(data, { where: filter });
            let result = await models.user.findOne({ where: filter });
            log.info(`End updateUserByFilter Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    addUserAddress: async(data, trans) => {
        let transaction = null;
        try {
            log.info(`Start addUserAddress Params: ${JSON.stringify(data)}`)
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.user_address.create(data, transaction);
            if (!trans) await transaction.commit();
            log.info(`End addUserAddress Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteUserAddress: async(filter, trans) => {
        let transaction = null;
        try {
            log.info(`Start deleteUserAddress Params: ${JSON.stringify(filter)}`)
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.user_address.destroy({
                where: filter,
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End deleteUserAddress Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    editUserAddress: async(data, filter, trans) => {
        let transaction = null;
        try {
            log.info(`Start editUserByFilter Params: ${JSON.stringify(data)}`)
            transaction = trans ? trans : await sequelize.transaction();
            await models.user_address.update(data, { where: filter }, transaction);
            let result = await models.user_address.findOne({ where: filter });
            if (!trans) await transaction.commit();
            log.info(`End editUserByFilter Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getAllAddress: async(user_id) => {
        try {
            log.info(`Start getAllAddress Params: ${JSON.stringify(user_id)}`)
            let result = await models.user_address.findAll({ where: { user_id: user_id } });
            result = result.map((item) => item.toJSON())
            log.info(`End getAllAddress Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    findUsersAddressesByFiler: async(filter) => {
        let result = await models.user_address.findAll({
            where: filter
        })
        result = result.map((item) => item.toJSON())
        return result;
    },

    deleteUserById: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.user.destroy( { where: id, transaction });
            let result = await models.user.findOne({ where: id, transaction });
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updateUser: async(filter, data, trans) => {
        let transaction = null;
        try {

            transaction = trans ? trans : await sequelize.transaction();
            await models.user.update(data, {
                where: filter,
                transaction
            });
            // let result = await models.user.findOne({
            //     where: {
            //         id: id
            //     },
            //     transaction
            // });
            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    makeUserFilter: async(body, whereObj) => {

        let arr = [];

        let sort;


        if (body.search) {
            let searchField = body.search.trim().split(" ");
            let searchPhone = body.search.replace(/[- )(]/g,'')
            searchPhone = searchPhone.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                let phoneLike = [];
                searchField.forEach((item) => {
                    like.push({
                        [Op.like]: `%${item}%`
                    });
                });
                searchPhone.forEach((item) => {
                    phoneLike.push({
                        [Op.like]: `%${item}%`
                    });
                });
                arr.push({
                    [Op.or]: [{
                        first_name: {
                            [Op.or]: like
                        }
                    },
                        {
                            last_name: {
                                [Op.or]: like
                            }
                        },
                        {
                            filter_phone: {
                                [Op.or]: phoneLike
                            }
                        },
                        {
                            email: {
                                [Op.or]: like
                            }
                        }
                    ]
                });
            }
        }
        if (body.role && body.role.length) {
            let types = [];
            body.role.forEach((item) => {
                types.push({ role: item });
            });
            arr.push({
                [Op.or]: types
            });
        }

        if (body.phone) {
            //body.phone = body.phone.replace(body.phone,/^\+?3?8?([\ ])(\(\d{3}\))([\ ])(\d{3}[\ ]\d{2}[\ ]\d{2})/g)
            arr.push({
                phone: body.phone
            });
        }
        if (body.email) {
            arr.push({
                email: body.email
            });
        }

        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.dateFrom || body.dateTo) {
            let created_at = {};
            if (body.dateFrom) created_at[Op.gte] = body.dateFrom;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    created_at[Op.lte] = new Date(body.dateTo).setDate(new Date(body.dateTo).getDate() + 1);
                } else {
                    created_at[Op.lte] = body.dateTo;
                }
            }
            arr.push({ created_at: created_at });
        }

        if (body.sort) {
            if (body.sort.created_at) {
                sort = [
                    ['created_at', body.sort.created_at]
                ];
            } else sort = [['created_at', 'DESC']];
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


        return filter;
    },
    updateClientById: async(client, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.client.update(client, { where: { id }, transaction })

            result = await models.client.findOne({
                where: {
                    id: result.id
                },
                include: [{ model: models.user, attributes: userAttributes }]
            })

            if (!trans) await transaction.commit();

            return result;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }





    },
    findAllAcivity: async() => {
        let result = await models.activity.findAll({
            attributes: ['id', 'title'],
        })

        return result.map(function(item) {
            return item.toJSON();
        })


    },

    findAllPositionAcivity: async() => {
        let result = await models.position_activity.findAll({
            attributes: ['id', 'title'],
        })
        return result.map(function(item) {
            return (item.toJSON())
        })

    },

    deleteClient: async(id) => {
        let filter = id;
        if (typeof filter !== 'object') {
            filter = { id: id };
        }
        try {
            let client = await models.client.destroy({
                where: filter
            });

            return client;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getClientById: async(where) => {

        try {
            let result = await models.client.findOne({
                where: where,
                include: [
                    { model: models.user, attributes: userAttributes }
                ]
            })

            return result
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getClient: async(params, attributes) => {
        let filter = params;
        if (typeof params !== 'object') {
            filter = { id: params }
        }
        const result = await models.client.findOne({
            where: filter,
            attributes: attributes
        });
        return result;
    },
    createPhoneNumber: async(phone, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.phone_numbers.create(phone, { transaction });

            if (!trans) await transaction.commit();
            return result;


        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }




    },
    deleteNumberByDealerId: async(dealer_id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.phone_numbers.destroy({
                where: { dealer_id: dealer_id },
                transaction
            })
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    makeUserOutGlobalFilter: async(body, whereObj) => {

        let arr = [];
        let sort;
        let userIds = [];
        let userIdsSecond = [];

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
                    [Op.or]: [{
                        first_name: {
                            [Op.or]: like
                        }
                    },
                        {
                            last_name: {
                                [Op.or]: like
                            }
                        }
                    ]
                });
            }
        }
        // if (body.gender) {
        //     arr.push({ gender: body.gender });
        // }
        // if (body.age && (body.age.from || body.age.to)) {
        //     //31536000 number of seconds in a year
        //     let date = {};
        //     if (body.age.from) {
        //         let dateFrom = new Date(Date.now() - 31536000000 * body.age.from).toISOString();
        //         //dateFrom = new Date(`01/01/${new Date(dateFrom).getFullYear()}`).toISOString();
        //         date[Op.lte] = dateFrom;
        //     }
        //     if (body.age.to) {
        //         let dateTo = new Date(Date.now() - 31536000000 * body.age.to).toISOString();
        //         dateTo = new Date(`01/01/${new Date(dateTo).getFullYear()}`).toISOString();
        //         date[Op.gte] = dateTo;
        //     }

        //     arr.push({ date_of_birth: date });
        // }
        // if (body.contact_by) {
        //     arr.push({ contact_by: body.contact_by });
        // }
        if (body.city) {
            arr.push({ city: body.city });
        }
        if (body.street) {
            arr.push({ street: body.street });
        }
        // if (body.mariage_status || body.mariage_status === 0) {
        //     arr.push({ mariage_status: body.mariage_status });
        // }
        // if (body.child_count || body.child_count === 0) {
        //     arr.push({ child_count: body.child_count });
        // }
        // if (body.car_status || body.car_status === 0) {
        //     arr.push({ car_status: body.car_status });
        // }
        // if (body.social_status || body.social_status === 0) {
        //     arr.push({ social_status: body.social_status });
        // }
        // if (body.count_receipt_week && (body.count_receipt_week.from || body.count_receipt_week.to)) {
        //     let data = {};
        //     if (body.count_receipt_week.from) {
        //         data[Op.gte] = body.count_receipt_week.from;
        //     }
        //     if (body.count_receipt_week.to) {
        //         data[Op.lte] = body.count_receipt_week.to;
        //     }

        //     arr.push({ count_receipt_week: data });
        // }
        // if (body.count_receipt_month && (body.count_receipt_month.from || body.count_receipt_month.to)) {
        //     let data = {};
        //     if (body.count_receipt_month.from) {
        //         data[Op.gte] = body.count_receipt_month.from;
        //     }
        //     if (body.count_receipt_month.to) {
        //         data[Op.lte] = body.count_receipt_month.to;
        //     }

        //     arr.push({ count_receipt_month: data });
        // }
        // if (body.average_receipt_week && (body.average_receipt_week.from || body.average_receipt_week.to)) {
        //     let data = {};
        //     if (body.average_receipt_week.from) {
        //         data[Op.gte] = body.average_receipt_week.from;
        //     }
        //     if (body.average_receipt_week.to) {
        //         data[Op.lte] = body.average_receipt_week.to;
        //     }

        //     arr.push({ average_receipt_week: data });
        // }
        // if (body.average_receipt_month && (body.average_receipt_month.from || body.average_receipt_month.to)) {
        //     let data = {};
        //     if (body.average_receipt_month.from) {
        //         data[Op.gte] = body.average_receipt_month.from;
        //     }
        //     if (body.average_receipt_month.to) {
        //         data[Op.lte] = body.average_receipt_month.to;
        //     }

        //     arr.push({ average_receipt_month: data });
        // }
        // if (body.product_turnover_month && (body.product_turnover_month.from || body.product_turnover_month.to)) {
        //     let data = {};
        //     if (body.product_turnover_month.from) {
        //         data[Op.gte] = body.product_turnover_month.from;
        //     }
        //     if (body.product_turnover_month.to) {
        //         data[Op.lte] = body.product_turnover_month.to;
        //     }

        //     arr.push({ product_turnover_month: data });
        // }

        // if (body.is_new_user || body.is_new_user === 0) {
        //     // 2629800000 ms = 1 month
        //     const monthAgo = new Date(Date.now() - 2629800000).toISOString();
        //     const date = body.is_new_user ? {
        //         [Op.gte]: monthAgo } : {
        //         [Op.lte]: monthAgo };

        //     userIds = userIds.concat(await modelsOut.cards.findAll({
        //         where: {
        //             status: config.GLOBAL_STATUSES.ACTIVE,
        //             date_from: date
        //         },
        //         attributes: [
        //             [sequelize.fn('DISTINCT', sequelize.col('user_id')), 'user_id']
        //         ],
        //         raw: true
        //     }));
        //     userIds = userIds.map(el => el.user_id);
        // }

        // if (body.card_status || body.card_status === 0) {
        //     // 2629800000 ms = 1 month
        //     const monthAgo = new Date(Date.now() - 2629800000).toISOString();
        //     const date = body.card_status ? {
        //         [Op.gte]: monthAgo } : {
        //         [Op.lte]: monthAgo };

        //     userIdsSecond = userIdsSecond.concat(await modelsOut.shopping_history.findAll({
        //         where: {
        //             date: date
        //         },
        //         attributes: [
        //             [sequelize.fn('DISTINCT', sequelize.col('user_id')), 'user_id']
        //         ],
        //         raw: true
        //     }));
        //     userIdsSecond = userIdsSecond.map(el => el.user_id);
        // }

        if (body.sort) {
            if (body.sort.id) {
                sort = [
                    ['id', body.sort.id]
                ];
            }
        } else {
            sort = [
                ['id', 'DESC']
            ];
        }

        let ids = [];
        if (userIds && userIds.length) {
            ids.push({
                user_id: {
                    [Op.in]: userIds
                }
            })
        }
        if (userIdsSecond && userIdsSecond.length) {
            ids.push({
                user_id: {
                    [Op.in]: userIdsSecond
                }
            })
        }

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr, ...ids]
            }
        };


        return filter;
    },

    calculateBonus: async(price, user_id) => {
        //Ціна має невраховувати  ціну доставки
        let userBonus = 0;
        log.info(`Start  calculateBonus Params: ${JSON.stringify({total_price,bonusesCount,user_id})}`);
        try {
            let bonuses = await models.configs.findOne({ where: { type: 'bonuses' }, raw: true });
            let user = await models.user.findOne({ where: { id: user_id }, raw: true })
            bonuses = JSON.parse(bonuses.value);
            if (bonuses) {
                if (bonuses.type_of_discount == config.BONUSES_TYPE.PERCENT) {
                    userBonus = Math.round(((price - bonuses.min_price_for_use) / 100) * bonuses.discount);
                }
                if (bonuses.type_of_discount == config.BONUSES_TYPE.VALUE) {
                    userBonus = Math.round((price - bonuses.min_price_for_use) / bonuses.discount)
                }
            }
            let result = await models.user.update({ bonuses: user.bonuses + userBonus }, { where: { id: user_id } })
            log.info(`End  calculateBonus Result: ${JSON.stringify(result)}`);
            return result
        } catch (err) {
            throw err;
        }

    },
    writeOffBonuses: async(total_price, bonusesCount, user_id) => {
        let pricewithBonuses = 0;
        log.info(`Start  writeOffBonuses Params: ${JSON.stringify({total_price,bonusesCount,user_id})}`);
        try {
            let user = await models.user.findOne({ where: { id: user_id }, raw: true })
            // let bonuses= await models.configs.findOne({ where: { type: 'bonuses' }, raw: true });
            // bonuses = JSON.parse(bonuses.value);
            // if(total_price>=bonuses.min_price_for_use && bonusesCount <= user.bonuses){
            await models.user.update({ bonuses: user.bonuses - bonusesCount }, { where: { id: user_id } })
            pricewithBonuses = total_price - bonusesCount;

            log.info(`End  writeOffBonuses Result: ${JSON.stringify(pricewithBonuses)}`);
            return pricewithBonuses;
        } catch (error) {
            log.error(error)
            throw error;
        }

    },



    getSessionByFilter: async(filter) => {
        log.info(
            `Start function getSessionByFilter Data: ${JSON.stringify(filter)} `
        );
        try {
            let result = await models.session.findOne({ where: filter });

            log.info(
                `End function getSessionByFilter Data: ${JSON.stringify(
                    result.toJSON()
                )} `
            );
            return result.toJSON();
        } catch (error) {
            error.code = 400;
            throw error;
        }
    },
    createSession: async(newItem, trans) => {
        let transaction = trans ? trans : await sequelize.transaction();
        log.info(`Start function createSession data: ${JSON.stringify(newItem)}`);
        try {
            let result = await models.session.create(newItem, { transaction });

            if (!trans) await transaction.commit();
            log.info(
                `End function createSession Result: ${JSON.stringify(result)}`
            );
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            log.error(`${err}`);
            throw err;
        }
    },
    updateSession: async(filter, newItem, trans) => {
        let transaction = trans ? trans : await sequelize.transaction();
        log.info(`Start function updateSession data: ${JSON.stringify(newItem)}`);
        try {

            let result = await models.session.update(newItem, {
                where: filter,
                transaction,
            });

            if (!trans) await transaction.commit();
            log.info(
                `End function updateSession Result: ${JSON.stringify(result)}`
            );
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            log.error(`${err}`);
            throw err;
        }
    },
    deleteSession: async(filter, trans) => {
        log.info(
            `Start function deleteSession service data:${JSON.stringify(filter)}`
        );
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.session.destroy({
                where: filter,
                transaction,
            });

            if (!trans) await transaction.commit();
            log.info(
                `End function deleteSession service data:${JSON.stringify(result)}`
            );
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    finUserPhoneAndEmailExist:async (phone,email)=>{
        log.info(
            `Start function finUserPhoneAndEmailExist service data:${JSON.stringify(phone,email)}`
        );
        let validate ={
            status:200,
            email:true,
            phone:true,
        }
        try {
            let result = await models.user.findAll({
                where: {[Op.or]:[{phone:phone},{email:email}]},
                raw:true
            },);
            if(result.length){
                for(let item of result){
                    if(item.phone == phone && item.email == email){
                        validate.status = 200
                        validate.phone = true
                        validate.email = true
                    }else{
                        validate.status = 400
                        validate.phone = false
                        validate.email = false
                    }
                }
            }
            log.info(
                `End function finUserPhoneAndEmailExist service data:${JSON.stringify(result)}`
            );
            return validate;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getDocumentByOrder:async (id)=>{
        let result
        let file_id = await models.orders_to_user_uploaded_files.findOne({where:{order_id:id},raw:true})
        if(file_id){
            result = await models.user_uploaded_files.findOne({where:{id:file_id.user_uploaded_files_id},raw:true})
        }
        return result
    },
    getPreDocumentByOrder:async (id)=>{
        try {
            let result
            if(id){
                result = await models.user_uploaded_files.findOne({where:{id:id},raw:true})
            }
            return result
        }catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getCourtByOrder:async (filter,region,OnlyOne)=>{
        let result = {
            price:null
        }
        let courts = await models.courts.findAll({where:filter,raw:true})
        if(courts && courts.length && region){
            for(let item of courts){
                if(item.regions){
                    item.regions = item.regions.split(',')
                    for(let region_item of item.regions){
                        if(region_item == region){
                            result = item
                        }
                    }
                }
            }
        }
        if(OnlyOne && courts && courts.length){
            result = courts[0]
        }
        return result
    },
    getAdditionalService:async (filter,toPage,onlyOne)=>{
        try {
            let result = await models.service_additional.findAll({where:filter,raw:true})
            if(result && result.length){
                for(let item of result){
                    item.service_country_pricing = await models.service_additional_country_pricing.findAll({where:{service_id:item.id},raw:true})
                    if(toPage){
                        item.service = await models.service.findOne({where:{id:item.service_id},raw:true,attributes:['id','title']})
                    }
                }
                if(onlyOne){
                    result = result[0]
                }
            }
            return result
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

}
