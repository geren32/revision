const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const statusService = require("./status.service");
const moment = require("moment");


const addressAttributes = [
    'street',
    'apartment',
    'entrance',
    'floor',
    'intercom',
    'district',
    'city',
    'country',
    'first_name',
    'last_name',
    'email',
    'phone'
];
const productAttributes = [
    'variation',
    'type',
    'status',
    'short_description',
    'description',
    'name',
    'price',
    'old_price',
    'availability',
    'brand_id',
    'model_id',
    'sku',
    'promotional',
    'novelty',
    'popular',
    'image_id',
    'slug'
];
const userAttributes = [

    'email'

];
const bookingAttributes = [
    'id',
    'date',
    'total_price',
    'user_id',
    'address_id',
    'status',
    'price_UAH'
];
const variationAttributes = [
    'id',
    'product_id',
    'price',
    'old_price',
    'status',
    'sku',
    'gallery'
];


module.exports = {
    getFieldById:async (filter,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.service_form_field.findOne({where:filter,raw:true})

            if (!trans) await transaction.commit();

            return result
        }  catch (err) {
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    create_new_order: async(data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.create(data, { transaction })
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    ordersGetAllOrdersFiles:async (id)=>{
        let result = await models.orders_to_user_uploaded_files.findAll({where:{order_id:id},raw:true})
        if(result && result.length){
            result = result.map(i => i.user_uploaded_files_id)
            result = await models.user_uploaded_files.findAll({where:{id:{[Op.in]:result}},raw:true})
        }
        return result
    },

    getAllOrdersByUser: async(id, page, perPage,lang) => {
        let offset;
        try {
            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            let result = await models.orders.findAndCountAll({
                offset: offset,
                limit: perPage,
                where: { user_id: String(id),parent_order_id :null},
                attributes: ['id', 'status', 'created_at', 'pay_type', 'delivery_type', 'total_price','service_id','additional_id','parent_order_id'],
                order: [
                    ['created_at', 'DESC']
                ]
            })
            result.rows = result.rows.map(function(i) {
                return i.toJSON()
            })
            if(result && result.rows){
                for(let item of result.rows){
                    if(!item.parent_order_id){
                        item.additional_orders = await models.orders.findAll({where:{parent_order_id:item.id},order:[['created_at','DESC']],raw:true})
                        if(item.additional_orders && item.additional_orders.length){
                            for(let additional of item.additional_orders){
                                if(additional.additional_id){
                                    additional.service = await models.service_additional.findOne({where:{id:additional.additional_id},raw:true})
                                }
                                let orderStatus = await statusService.getOrderStatusByFilter({ [Op.or]: [{ id: item.status, lang: lang }, { origin_id: item.status, lang: lang }] });
                                if(orderStatus) {
                                    orderStatus = orderStatus.toJSON();
                                    additional.statusText = orderStatus.title;
                                    additional.statusColor = orderStatus.color;
                                }
                            }
                        }
                    }
                    if(item.service_id){
                        item.additional_check = await models.service_additional.count({where:{service_id:item.service_id}})
                    }
                }
            }
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getOrderById: async(id) => {
        try {
            let result = await models.orders.findOne({
                where: {
                    id: id,
                },
                attributes: ['id', 'delivery_type','delivery_price', 'pay_type', 'total_price','products', 'comment', 'updated_at', 'created_at', "status"],
                include: [
                    // {
                    //     model: models.product,
                    //     attributes: ["name", "sku", "width", "height", "thickness", "price"],
                    //     include: [{
                    //         model: models.uploaded_files,
                    //         as: "image"
                    //     }, ]
                    // },
                    { model: models.address },
                    { model: models.orders_revision },
                    {model : models.promocode}

                ],
            })
            if (result) {
                result = result.toJSON()
                if(result.products && result.products.length){
                    for(let item of result.products){
                        if(item.product_id){
                            let product = await models.product.findOne({where:{id:item.product_id},raw: true})
                            item.product= product;
                        }
                    }
                }
                if (result.orders && result.orders.length) {
                    result.orders.forEach((e) => {
                        e.quantity = parseInt(e.quantity)
                        e.price = parseInt(e.price)
                        e.total_price = e.quantity * e.price
                    })
                }

            }
            return result
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    createOrder: async(order,forms_all,pre_order_create,trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            if(pre_order_create){
                await models.orders.update(order, {where:{id:pre_order_create},transaction });
                let result = await models.orders.findOne({where:{id:pre_order_create},transaction,raw:true})
                await models.orders_form_results.destroy({where:{orders_id:pre_order_create},transaction})
                if(forms_all && forms_all.length){
                    for(let step of forms_all){
                        if(step.fields && step.fields.length){
                            for(let field of step.fields){
                                if(field.type && field.type == 13) {
                                    field.title = field.value ? 2 : 1;
                                }
                                if(field.is_defendant && field.is_defendant == '2' && !field.value){
                                    field.value = "невідомо"
                                }
                                let field_data={
                                    service_id :step.service_id,
                                    step :step.step,
                                    orders_id :result.id,
                                    title:field.title ? field.title :null,
                                    type:field.type,
                                    name_field:field.name_field,
                                    value:field.value ? field.value :null,
                                    position:field.position,
                                    service_form_id:field.service_form_id,
                                    is_private :field.is_private && field.is_private == 'true' ? field.is_private :null,
                                    apartment : field.apartment ? field.apartment : null,
                                    house : field.house ? field.house : null,
                                    service_form_field_id : field.service_form_field_id ? field.service_form_field_id : null,
                                }
                                await models.orders_form_results.create(field_data,{transaction})
                            }
                        }else if(!step.fields){
                            if(step.service_form_fields && step.service_form_fields.length){
                                for(let field of step.service_form_fields){
                                    if(field.type && field.type == 13) {
                                        field.title = field.value ? 2 : 1;
                                    }
                                    if(field.type == 12 && field.value){
                                        field.value = moment(field.value).format('DD.MM.YYYY')
                                    }
                                    if(field.is_defendant && field.is_defendant == '2' && !field.value){
                                        field.value = "невідомо"
                                    }
                                    let field_data={
                                        service_id :step.service_id,
                                        step :step.step,
                                        orders_id :result.id,
                                        title:field.title ? field.title :null,
                                        type:field.type,
                                        name_field:field.name_field,
                                        value:field.value ? field.value :null,
                                        position:field.position,
                                        service_form_id:field.service_form_id,
                                        is_private :field.is_private && field.is_private == 'true' ? field.is_private :null,
                                        apartment : field.apartment ? field.apartment : null,
                                        house : field.house ? field.house : null,
                                        service_form_field_id : field.service_form_field_id ? field.service_form_field_id : null,
                                    }
                                    await models.orders_form_results.create(field_data,{transaction})
                                }
                            }
                        }
                    }
                }

                if (!trans && transaction) await transaction.commit();
                return result;
            }else{
                let result = await models.orders.create(order, { transaction });
                if(forms_all && forms_all.length){
                    for(let step of forms_all){
                        if(step.fields && step.fields.length){
                            for(let field of step.fields){
                                if(field.type && field.type == 13) {
                                    field.title = field.value ? 2 : 1;
                                }
                                if(field.is_defendant && field.is_defendant == '2' && !field.value){
                                    field.value = "невідомо"
                                }
                                let field_data={
                                    service_id :step.service_id,
                                    step :step.step,
                                    orders_id :result.id,
                                    title:field.title ? field.title :null,
                                    type:field.type,
                                    name_field:field.name_field,
                                    value:field.value ? field.value :null,
                                    position:field.position,
                                    service_form_id:field.service_form_id,
                                    is_private :field.is_private && field.is_private == 'true' ? field.is_private :null,
                                    apartment : field.apartment ? field.apartment : null,
                                    house : field.house ? field.house : null,
                                    service_form_field_id : field.service_form_field_id ? field.service_form_field_id : null,
                                }
                                await models.orders_form_results.create(field_data,{transaction})
                            }
                        }else if(!step.fields){
                            if(step.service_form_fields && step.service_form_fields.length){
                                for(let field of step.service_form_fields){
                                    if(field.type && field.type == 13) {
                                        field.title = field.value ? 2 : 1;
                                    }
                                    if(field.is_defendant && field.is_defendant == '2' && !field.value){
                                        field.value = "невідомо"
                                    }
                                    if(field.type == 12 && field.value){
                                        field.value = moment(field.value).format('DD.MM.YYYY')
                                    }
                                    let field_data={
                                        service_id :step.service_id,
                                        step :step.step,
                                        orders_id :result.id,
                                        title:field.title ? field.title :null,
                                        type:field.type,
                                        name_field:field.name_field,
                                        value:field.value ? field.value :null,
                                        position:field.position,
                                        service_form_id:field.service_form_id,
                                        is_private :field.is_private && field.is_private == 'true' ? field.is_private :null,
                                        apartment : field.apartment ? field.apartment : null,
                                        house : field.house ? field.house : null,
                                        service_form_field_id : field.service_form_field_id ? field.service_form_field_id : null,
                                    }
                                    await models.orders_form_results.create(field_data,{transaction})
                                }
                            }
                        }
                    }
                }

                if (!trans && transaction) await transaction.commit();
                return result;
            }
        } catch (err) {
            err.code = 400;
            if (!trans && transaction) await transaction.rollback();
            throw err;
        }
    },
    addFormFieldsToOrder:async (id,order_id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let fields = await models.orders_form_results.findAll({where:{orders_id:order_id},raw:true,transaction})
            if(fields && fields.length){
                for(let item of fields){
                    let field_data ={
                        title:item.title,
                        type:item.type,
                        name_field :item.name_field,
                        value:item.value,
                        orders_id:id,
                        step:item.step,
                        service_id:item.service_id,
                        position :item.position,
                        service_form_id:item.service_form_id,
                    }
                    await models.orders_form_results.create(field_data,{transaction})
                }
            }

            if (!trans && transaction) await transaction.commit();
            return true;
        } catch (err) {
            err.code = 400;
            if (!trans && transaction) await transaction.rollback();
            throw err;
        }
    },
    getService:async (filter,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.service.findOne( { where:filter,raw:true,transaction});
            if(result){
                result.service_country_pricing = await models.service_country_pricing.findAll({where:{service_id:result.id},raw:true,transaction})
                result.service_random_text = await models.service_random_text.findAll({where:{service_id:result.id},raw:true,transaction})
            }
            if (!trans && transaction) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (!trans && transaction) await transaction.rollback();
            throw err;
        }
    },
    getServiceAdditional:async (filter,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.service_additional.findOne( { where:filter,raw:true,transaction});
            if(result){
                if(result.service_id){
                    let options = await models.service.findOne({where:{id:result.service_id},raw:true,attributes:['id','options'],transaction})
                    if(options)result.options = options.options
                }
                result.service_country_pricing = await models.service_additional_country_pricing.findAll({where:{service_id:result.id},raw:true,transaction})
            }
            if (!trans && transaction) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (!trans && transaction) await transaction.rollback();
            throw err;
        }
    },
    getCourt:async (filter,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.courts.findOne( { where:filter,raw:true,transaction});
            if (!trans && transaction) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (!trans && transaction) await transaction.rollback();
            throw err;
        }
    },

    deleteOrder: async(id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.orders.destroy({
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
    editOrder: async(order, id, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.orders.update(order, { where: { id }, transaction });
            if (!trans) await transaction.commit();
            let result = await models.orders.findOne({
                where: { id: id },
                include: [{
                    model: models.booking,
                    as: "booking",
                    attributes: bookingAttributes,
                    include: [
                        { model: models.address, as: "address", attributes: addressAttributes },
                        { model: models.user, as: "user", attributes: userAttributes }
                    ]
                },
                    {
                        model: models.product,
                        as: "product",
                        attributes: productAttributes,
                        include: [
                            //TODO: Make for attributes
                            { model: models.model, as: "model", attributes: ['title'] },
                            { model: models.brand, as: "brand", attributes: ['title'] },
                            {
                                model: models.product_category,
                                as: 'category',
                                attributes: ['id', 'title', 'slug'],
                                through: { attributes: [] }
                            },
                            {
                                model: models.product_variations,
                                as: "product_variations",
                                attributes: variationAttributes,
                                include: [{
                                    model: models.attribute,
                                    as: 'attribute',
                                    attributes: ['id', 'title', 'value', 'status', 'type'],
                                    through: { attributes: ['value'], as: 'activeValue' }
                                }]
                            },
                        ]
                    }
                ]
            })

            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    getOrdersByFilter: async(filter, trans) => {
        let transaction = trans ? trans : null;
        try {
            let result = await models.orders.findOne({
                where: filter,
                include:[
                    {model: models.orders_form_results},
                    {model:models.user,attributes:["id",'email','phone','first_name','last_name']}
                ],
                transaction
            });
            return result ? result.toJSON() : null;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },




}
