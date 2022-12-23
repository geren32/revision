const { models, model } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const adminChangesHistoryService= require('./admin-changes-history.service');


module.exports ={
    countOrdersByParam: async (whereObj) => {
        const result = await models.orders.count({
            where: whereObj
        });
        return result ? result : 0;
    },
    getAllOrders: async (settings, page, perPage, currency) => {
        try {
            let where = [];
            // let where = {
            //     // id: { [Op.eq]: sequelize.col('orders.booking_id') },
            //     // '$orders.variation_id$': { [Op.eq]: sequelize.col('orders.product.product_variations.id') }
            // }
            if (settings.search) {
                let searchField = settings.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({ [Op.like]: `%${item}%` });
                    });
                    where.push({
                        [Op.or]: [
                            {id: { [Op.or]: like }},
                            { '$address.first_name$': { [Op.or]: like } },
                            { '$address.last_name$': { [Op.or]: like } }
                        ]
                    });
                }
            }
            let offset = 0
            // if(settings.dealer_id) {
            //     where.push({ dealer_id: settings.dealer_id});
            // }
            if (settings.dealer_id &&  settings.dealer_id.length) {
                let dealer_ids = [];
                settings.dealer_id.forEach((item) => {
                    dealer_ids.push({ dealer_id: item });
                });
                where.push({ [Op.or]: dealer_ids });
            }
            if (settings.status === 'all') {
                where.push({status: { [Op.ne]: 0 }})
                // where.push({ status: settings.status});
            } else if (settings.status) {
                where.push({ status: settings.status});
            }


            if (settings.dateFrom || settings.dateTo) {
                let created_at = {};
                // if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom.getTime()/1000;
                // if (settings.dateTo) created_at[Op.lte] = settings.dateTo.getTime()/1000;
                if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom
                if (settings.dateTo) {
                    if (settings.dateFrom == settings.dateFrom) {
                        created_at[Op.lte] = settings.dateTo
                    } else {
                        created_at[Op.lte] = settings.dateTo
                    }
                }


                where.push({ created_at: created_at });
            }

            if (settings.priceFrom || settings.priceTo) {
                let total_price = {};
                if (settings.priceFrom) total_price[Op.gte] = settings.priceFrom/currency;
                if (settings.priceTo) total_price[Op.lte] = settings.priceTo/currency;

                where.push({ total_price: total_price });
            }
            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            let result = await models.orders.findAndCountAll({
                // where: {[Op.and]:[ ...where ]},
                where: where,
                attributes:['id','status','created_at','pay_type','delivery_type','total_price',],
                limit: perPage,
                offset: offset,
                // sort: [['created_at', 'DESC']],
                order: [["created_at", "DESC"]],
                distinct:true,
                include: [
                    // { model: models.orders_product },
                    { model: models.address ,attributes :["first_name","last_name"]},

                ]
            })
            if(result && result.rows && result.rows.length) {

            }
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getOrder: async (id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.findOne({
                where: {
                    id: id,
                },
                attributes:['id','delivery_type','pay_type','total_price','comment','updated_at','created_at',"status"],
                include: [
                    {
                        model: models.orders_product,
                        attributes:['price','quantity'],
                        include:[
                            {
                                model: models.product,
                                attributes:["name",'sku'],
                                include:[
                                    {
                                                    model: models.uploaded_files,
                                                    as: "image"
                                                },
                                ]

                            }
                        ]
                    },
                    { model: models.address},
                    {model:models.orders_revision},

                ], transaction
            })
            if(result) {
                result = result.toJSON()
                if (result.orders && result.orders.length){
                    result.orders.forEach((e)=>{
                        e.quantity = parseInt(e.quantity)
                        e.price = parseInt(e.price)
                        e.total_price = e.quantity * e.price
                       
                    })
                }
                result.history = await adminChangesHistoryService.adminFindAllHistory({type: 'order', item_id: result.id, }, transaction);
                // result.history = await models.admin_changes_history.findAll({where: {type: 'booking', item_id: result.id, created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
                result.history.forEach( item => {
                    return item.toJSON()
                })
                // result.revisions = result.booking_revisions.reverse();
                // result.revisions.reverse();
            }
            if (!trans) await transaction.commit();
            return result
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    deleteOrders: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.orders_revision.destroy({
                where: { orders_id: id }, transaction } );
            await models.orders.destroy({
                where:{id:id},
                transaction
            })
            // await models.orders_product.destroy({
            //     where:{
            //         orders_id:id
            //     },transaction
            // })
            return true

        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    editOrder: async (booking, id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.orders.update(booking, { where: { id: id }, transaction })
            let result = await models.orders.findOne({
                where: { id: id },
                transaction,
                include: [
                    { model: models.address },
                    // { model: models.user, attributes: userAttributes }
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
    updateOrderStatus: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.orders.update(data, { where: { id: id }, transaction });
            if (!trans) await transaction.commit();
            let result = await models.orders.findOne({
                where:{
                    id:id
                }
            })
            result = result.toJSON()

            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    createOrdersRevision: async (booking,trans)=>{
        let transaction=null;
        try{
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders_revision.create(booking);

            result = await models.orders_revision.findOne({
                where: {id:result.id},
                transaction,
                // include: [ {model:models.booking,attributes:bookingAttributes,include: {model: models.user, attributes: ['id','first_name','last_name']}}]
            })
            if (!trans) await transaction.commit();
            return result;
        }
        catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    createOrdersHistory: async(booking,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result= await models.admin_changes_history.create(booking,{transaction});
            // result= await models.admin_changes_history.findOne({
            //     where: {id:result.id},
            //     transaction,
            //     include:[{model:models.user, attributes:userAttributes},
            //       {model:models.booking,attributes:bookingAttributes,include: {model: models.user, attributes: ['id','first_name','last_name']}}
            //     ]
            // })
            if (!trans) await transaction.commit();
            return result;
        }
        catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }

    },
}
