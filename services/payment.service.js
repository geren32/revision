const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');


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
    'image_id'
];
const userAttributes = [
    'last_name',
    'first_name',
    'email',
    'phone',
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


    create_new_order: async(data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let order = await models.orders.create(data, { transaction })
            if (!trans) await transaction.commit();
            return order.toJSON()
        } catch (err) {
        
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    update_order: async(updating_data, find_by, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.orders.update(updating_data, {
                where: {
                    id: find_by
                }
            }, { transaction });
            if (!trans) await transaction.commit();
            return true
        } catch (err) {
          
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    find_order: async(find_by) => {
        try {
            let order = await models.orders.findOne({
                where: {
                    id: find_by
                }
            });
            if (order) {
                return order.toJSON()
            } else return false
        } catch (err) {
            
            err.code = 400;
            throw err;
        }
    }
    



}