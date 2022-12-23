const { models, model } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const adminChangesHistoryService = require('./admin-changes-history.service');
const log = require("../utils/logger");
const config = require("../configs/config");
const _ = require('lodash');
const addressAttributes = [
    'street',
    'house',
    'apartment',

    'district',
    'city',

    'first_name',
    'last_name',
    'email',
    'phone',

];

const userAttributes = [

    'email'
];
const bookingAttributes = [
    'id',
    'date',

    'user_id',
    'address_id',
    'status',
    'products'

];


module.exports = {

    clear_booking: async(user_id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.cart.destroy({
                where: {
                    user_id: String(user_id)
                },
            }, { transaction })
            if (!trans) await transaction.commit();
            return true
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    get_all_carts: async(date) => {
        try {

            let getAllCarts = await models.cart.findAll({
                where: {
                    created_at: {
                        [Op.in]: [sequelize.literal('SELECT MAX(created_at) FROM `studio_glass`.cart GROUP BY user_id')],
                        [Op.lt]: date
                    }
                },
                include: [{ model: models.user, attributes: ['id', 'email', 'first_name', 'last_name'] }, ]
            })
            getAllCarts = getAllCarts.map(function(item) { return item.toJSON(); });
            return getAllCarts
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    get_all_carts_by_user: async(user_id) => {
        try {

            let getAllCarts = await models.cart.findAll({
                where: {
                    user_id: String(user_id)
                },
                include: [{ model: models.product, attributes: ['id', 'name', 'price'] }, ]
            })
            getAllCarts = getAllCarts.map(function(item) { return item.toJSON(); });

            return getAllCarts
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    addAdminComment: async(data, trans) => {
        let transaction = null;
        try {
            log.info(`Start addAdminComment Params: ${JSON.stringify(data)}`)
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.admin_comments_in_orders.create(data, transaction);
            if (!trans) await transaction.commit();
            log.info(`End addAdminComment Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            console.log(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteAdminComments: async(filter, trans) => {
        let transaction = null;
        try {
            log.info(`Start deleteAdminComments Params: ${JSON.stringify(filter)}`)
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.admin_comments_in_orders.destroy({
                where: filter,
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End deleteAdminComments Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            console.log(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },



    createBookingRevision: async(booking, trans) => {
        let transaction = null;
        try {
            log.info(
                `Start createBookingRevision. Params: ${JSON.stringify(booking)}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders_revision.create(booking, { transaction });
            result = await models.orders_revision.findOne({
                where: { id: result.id },
                transaction,
                include: [{ model: models.orders, attributes: bookingAttributes, include: { model: models.user, attributes: ['id'] } }]
            })
            if (!trans) await transaction.commit();
            log.info(
                `End createBookingRevision. Params: ${JSON.stringify(result)}`
            );
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }



    },
    createBookingHistory: async(booking, trans) => {
        let transaction = null;
        try {
            log.info(
                `Start createBookingHistory. Params: ${JSON.stringify(booking)}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.admin_changes_history.create(booking, { transaction });
            // result= await models.admin_changes_history.findOne({
            //     where: {id:result.id},
            //     transaction,
            //     include:[{model:models.user, attributes:userAttributes},
            //       {model:models.booking,attributes:bookingAttributes,include: {model: models.user, attributes: ['id','first_name','last_name']}}
            //     ]
            // })
            if (!trans) await transaction.commit();
            log.info(
                `End createBookingHistory. Result: ${JSON.stringify(result)}`
            );
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }

    },
    createBooking: async(booking, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.create(booking, { transaction });

            result = await models.orders.findOne({
                where: { id: result.id },
                transaction,
                include: [
                    { model: models.address, attributes: addressAttributes },
                    // { model: models.user, attributes: userAttributes }
                ]
            })
            if(result){
                result= result.toJSON()
            }
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    createBooking: async(booking, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.create(booking, { transaction });

            result = await models.orders.findOne({
                where: { id: result.id },
                transaction,
                include: [
                    { model: models.address, attributes: addressAttributes },
                    // { model: models.user, attributes: userAttributes }
                ]
            })
            if(result){
                result= result.toJSON()
            }
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    getAllBookings: async(settings, page, perPage, currency) => {
        try {
            let where = [];
            log.info(
                `Start  getAllBookings. Params: ${JSON.stringify({settings: settings, page: page, perPage:perPage, currency:currency})}`
            );
            if (settings.search) {
                let searchField = settings.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({
                            [Op.like]: `%${item}%`
                        });
                    });
                    let users = await models.user.findAll({where:{
                            [Op.or]: [
                                {
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
                        },
                        raw:true
                    });
                    users = users.map(i =>i.id)
                    where.push({
                        user_id:{[Op.in]:users}
                    })
                }
            }
            if(settings.category_id){
                let services = await models.service_to_category.findAll({where:{service_category_id:settings.category_id},raw:true})
                services = services.map(i =>i.service_id)
                if(services.length){
                    services = await models.service.findAll({where:{[Op.or]:[{id:{[Op.in]:services}},{origin_id:{[Op.in]:services}}]},raw:true})
                    services = services.map(i =>i.id)
                }
                let service
                if(settings.service_id){
                    let service = await models.service.findAll({where:{[Op.or]:[{id:settings.service_id},{origin_id:settings.service_id}]},raw:true})
                    service = service.map(i=>i.id)
                    const duplicates = services.filter(function(val) {
                        return service.indexOf(val) != -1;
                    });
                    where.push({
                        service_id:{[Op.in]:duplicates}
                    })
                }else{
                    where.push({
                        service_id:{[Op.in]:services}
                    })
                }

            }
            if(settings.service_id && !settings.category_id){
                let services = await models.service.findAll({where:{[Op.or]:[{id:settings.service_id},{origin_id:settings.service_id}]},raw:true})
                services = services.map(i=>i.id)
                where.push({
                    service_id:{[Op.in]:services}
                })
            }
            let whereUser = [];
            if(settings.user_role){
                whereUser.push({
                    role: settings.user_role
                })
            } else whereUser = null
            let offset = 0

            if (settings.status === 'all') {
                where.push({
                        status: {
                            [Op.ne]: config.BOOKING_STATUSES[1].value
                        }
                    })
                    // where.push({ status: settings.status});
            } else if (settings.status) {
                where.push({ status: settings.status });
            }
            if(settings.pay_type){
                where.push({pay_type:settings.pay_type})
            }
            if(settings.delivery_type){
                where.push({delivery_type:settings.delivery_type})
            }
            if (settings.dateFrom || settings.dateTo) {
                let created_at = {};
                if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom
                if (settings.dateTo) {
                    if (settings.dateFrom == settings.dateFrom) {
                        created_at[Op.lte] = new Date(settings.dateTo).setDate(new Date(settings.dateTo).getDate() + 1)
                    } else {
                        created_at[Op.lte] = settings.dateTo
                    }
                }

                // if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom.getTime()/1000;
                // if (settings.dateTo) created_at[Op.lte] = settings.dateTo.getTime()/1000;
                // if (settings.dateFrom) created_at[Op.gte] = new Date(settings.dateFrom).getTime();
                // if (settings.dateTo) {
                //     if (settings.dateFrom == settings.dateFrom) {
                //         created_at[Op.lte] = (new Date(settings.dateTo).getTime()) + 86400;
                //     } else {
                //         created_at[Op.lte] = new Date(settings.dateTo).getTime();
                //     }
                // }


                where.push({ created_at: created_at });
            }
            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            let sort
            if(!settings.sort){
                sort = [['created_at', 'DESC']]
            }
            // else if(settings.sort && settings.sort.direction && settings.sort.key =='last_name'){
            //     sort = [[{model: models.address},"last_name", settings.sort.direction]]
            // }else if(settings.sort && settings.sort.direction && settings.sort.key =='first_name'){
            //     sort = [[{model: models.address},"first_name", settings.sort.direction]]
            // }else if(settings.sort && settings.sort.direction && settings.sort.key !='first_name'&& settings.sort.key !='last_name'){
            //     sort = [[settings.sort.key, settings.sort.direction]];
            // } else sort = [['created_at', 'DESC']]


            let result = await models.orders.findAndCountAll({
                where: where,
                attributes:['id','created_at','pay_type','delivery_type','total_price','pay_status','status','user_name','user_phone','comment','service_type','additional_id',],
                limit: perPage,
                offset: offset,
                order: sort,
                distinct:true,
                include: [
                    { model: models.user, where: whereUser, attributes :["id","role","first_name","last_name","email","phone"]},
                    { model: models.service}
                ]
            })
            if (result && result.rows && result.rows.length) {
                result.rows = result.rows.map(row => row.toJSON());
                for(let item of result.rows){
                    if(!item.service && item.additional_id && item.service_type !='3'){
                        item.service = await models.service_additional.findOne({where:{id:item.additional_id},raw:true})
                        if(item.service){
                            item.origin_service = await models.service.findOne({where:{id:item.service.service_id},raw:true})
                        }
                    }
                }
            }
            log.info(
                `End  getAllBookings. Result: ${JSON.stringify(result)}`
            );
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getBookingById: async(id, trans) => {
        let transaction = null;
        try {
            log.info(
                `Start  getBookingById Params: ${JSON.stringify(id)}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.findOne({
                where: {
                    id: id,
                },
                include: [
                    { model: models.user ,attributes :["id","role",'email','first_name','last_name','phone']},
                    { model: models.service},
                    { model: models.user_uploaded_files, as: 'order_files', through: { attributes: [] } },
                    { model: models.orders_form_results },
                ],
                transaction
            })
            if (result) {
                result = result.toJSON()
                result.history = await adminChangesHistoryService.adminFindAllHistory({
                    type: 'order',
                    item_id: result.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()
                    }
                }, transaction);
                // result.history = await models.admin_changes_history.findAll({where: {type: 'booking', item_id: result.id, created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
                result.history.forEach(item => {
                    return item.toJSON()
                })
            }
            if (!trans) await transaction.commit();
            log.info(
                `End  getBookingById Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getBookingByFilter: async(filter, trans,toThank) => {
        let transaction = null;
        try {
            log.info(`Start getBookingByFilter Params: ${JSON.stringify(filter)}`);
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.findOne({
                where: filter,
                order: [[models.orders_form_results, 'id','ASC']],
                include: [
                    { model: models.user ,attributes :["id","role",'email','first_name','last_name','phone']},
                    { model: models.service, include: {model: models.service_additional_files}},
                    { model: models.user_uploaded_files, as: 'order_files', through: { attributes: [] } },
                    { model: models.user_uploaded_files, as: 'order_images', through: { attributes: ['additional_file_id'] } },
                    { model: models.orders_form_results },
                ],
                transaction
            })
            if(result){
                result = result.toJSON();
                if(!result.service_id)result.service_id = result.additional_id
                if(!result.service){
                    result.service = await models.service_additional.findOne({where:{id:result.additional_id},raw:true,transaction})
                }
                if(result.court_id){
                    result.court = await models.courts.findOne({where:{id:result.court_id},raw:true})
                }
                if(result.order_images && result.order_images.length) {
                    result.order_images = await Promise.all(result.order_images.map(async order_image => {
                        if(order_image.order_images_to_user_uploaded_files) {
                            order_image.order_image_additional = await models.service_additional_files.findOne({where: {id: order_image.order_images_to_user_uploaded_files.additional_file_id}, raw: true});
                        }
                        return order_image;
                    }));
                }
                if(result.order_files && result.order_files.length) {
                    result.order_files.sort((a,b) => a.id - b.id);
                }
                if(result.service_id){
                    result.additional_orders = await models.orders.findAll({where:{parent_order_id:result.id},order:[["created_at","DESC"]],raw:true,transaction})
                    if(result.additional_orders && result.additional_orders.length){
                        for(let item of result.additional_orders){
                            item.service = await models.service_additional.findOne({where:{id:item.additional_id},raw:true,transaction})
                        }
                    }
                }
                if(result.orders_form_results && result.orders_form_results.length && !toThank) {
                    let testGroup = _.groupBy(result.orders_form_results,'service_form_id');
                    let arr = [];
                    let i = 0
                    for (let [key, value] of Object.entries(testGroup)) {
                        i++
                        let serviceForm = await models.service_form.findOne({ where: {id: key}, raw: true });
                        let serviceForms = await models.service_form.findAll({ where: {service_id: result.service_id} });
                        serviceForms = serviceForms.map(item => item.id);
                        for (let item of value) {
                            let serviceFormField = await models.service_form_field.findOne({ where: {service_form_id: serviceForms, name_field: item.name_field} });
                            if(serviceFormField) item.placeholder = serviceFormField.placeholder;
                        }
                        if(serviceForm) {
                            serviceForm.service_form_fields = value;
                            arr.push(serviceForm);
                        }else{
                             serviceForm ={
                                 id:key,
                                 title:`Форма №${i}`,
                                 step:value[0].step,
                                 service_id:value[0].service_id,
                                 type:1,
                                 required:2,
                                 status:2,
                            }
                            serviceForm.service_form_fields = value;
                            arr.push(serviceForm);
                        }
                    }
                    result.orders_form_results = arr;
                }
                if(result.signature_request_id && !result.admin_sign) result.signing_url = `https://app.hellosign.com/sign/${result.signature_request_id}`
                result.history = await adminChangesHistoryService.adminFindAllHistory({
                    type: 'order',
                    item_id: result.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()
                    }
                }, transaction);
                result.history.forEach(item => {
                    return item.toJSON()
                })
            }
            if (!trans) await transaction.commit();

            log.info(`End  getBookingByFilter`);
            return result
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    deleteBookingById: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.booking.destroy({
                where: { id: id },
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
    deleteBookingRevisionById: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            return await models.admin_changes_history.destroy({
                where: { id: id },
                transaction
            });


        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    deleteBookingHistoryById: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            return await models.admin_changes_history.destroy({
                where: { id: id },
                transaction
            });

        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    deleteBookingAttachmentById: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            return await models.booking_attachment.destroy({ where: { id: id }, transaction });

        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    editBooking: async(orders, id, trans) => {
        let transaction = null;
        try {
            log.info(
                `Start  editBooking Params: ${JSON.stringify({orders:orders, id:id})}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            await models.orders.update(orders, { where: { id: id }, transaction })
            let result = await models.orders.findOne({
                where: { id: id },
                transaction,
            })
            if (!trans) await transaction.commit();
            log.info(
                `End  editBooking Params: ${JSON.stringify(result)}`
            );
            return result;

        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getCurrentBooking: async(where) => {
        try {

            let result = await models.booking.findOne({
                where: where,
                include: [
                    { model: models.address, as: "address", attributes: addressAttributes },
                    { model: models.user, as: "user", attributes: userAttributes }
                ]
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getCurrentCart: async(where) => {
        try {

            let result = await models.cart.findOne({
                where: where,
                include: [
                    { model: models.user, as: "user", attributes: userAttributes }
                ]
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    createCart: async(cart, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.cart.create(cart, transaction);

            result = await models.cart.findOne({
                where: { id: result.id },
                transaction,
                include: [
                    { model: models.user, attributes: userAttributes }
                ]
            })
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    editCart: async(booking, id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.cart.update(booking, { where: { id }, transaction })
            let result = await models.cart.findOne({
                where: { id: id },
                transaction,
                include: [
                    { model: models.user, attributes: userAttributes }
                ]
            })
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteCart: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.cart.destroy({
                where: { id: id },
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
    countBookingsByParam: async(whereObj) => {
        log.info(
            `Start  countBookingsByParam. Params: ${JSON.stringify(whereObj)}`
        );
        const result = await models.orders.count({
            where: whereObj
        });
        log.info(
            `End  countBookingsByParam. Result: ${JSON.stringify(result)}`
        );
        return result ? result : 0;
    },
    /*countBookingsByParam: async () => {
        let result = await models.booking.findAll({
            raw: true,
            attributes: ['id', 'status']
        });
        function bookingStatuses(status) {
            let filteredBookings = [];
            if(status || status === 0) {
                result.forEach(booking => {
                    if(booking.status === status) filteredBookings.push(booking);
                })
            }else {
                result.forEach(booking => {
                    if(booking.status !== 0) filteredBookings.push(booking);
                })
            }
            return filteredBookings.length;
        }
        let numberOfDeletedBookings = bookingStatuses(0);
        let numberOfNewBookings = bookingStatuses(1);
        let numberOfProcessedBookings = bookingStatuses(2);
        let numberOfActiveBookings = bookingStatuses(3);
        let numberOfCanceledBookings = bookingStatuses(4);
        let numberOfFailedBookings = bookingStatuses(5);
        let numberOfAllBookings = bookingStatuses();
        return {
            all: numberOfAllBookings,
            0: numberOfDeletedBookings,
            1: numberOfNewBookings,
            2: numberOfProcessedBookings,
            3: numberOfActiveBookings,
            4: numberOfCanceledBookings,
            5: numberOfFailedBookings
        };
        // let result = await models.booking.count({
        //     where: whereObj
        // });
        // if(result==0) {
        //     result=0
        // }
        // if(result==1) {
        //     result=1
        // }
        // if(result==2) {
        //     result=2
        // }
        // if(result==3) {
        //     result=3
        // }
        // if(result==4) {
        //     result=4
        // }
        // if(result==5) {
        //     result=5
        // }
        // if(result=="all"){
        //     result={ [Op.ne]: 0 }
        // }
        // return result ? result : 0;
    },*/
    makeBookingFilter: async(body, whereObj) => {
        let arr = [];
        let userArr = [];
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
                userArr.push({
                    [Op.or]: [{
                        first_name: {
                            [Op.or]: like
                        }
                    }, {
                        last_name: {
                            [Op.or]: like
                        }
                    }]
                });
                arr.push({
                    id: {
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
        return filter;
    },
    updateBookingHistoryById: async(booking, id, trans) => {
        let transaction = null;

        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.admin_changes_history.update(booking, { where: { id } }, { transaction });
            result = await models.admin_changes_history.findOne({ where: { id: result.id } }, transaction);
            if (!trans) await transaction.commit();

            return result;


        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;

        }

    }

}
