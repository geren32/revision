const sequelize = require('../sequelize-orm');
const { models } = require('../sequelize-orm');
const log = require('../utils/logger');


 async function getUserCarts (userId){
    log.info(`Start function getUserCarts Params: ${JSON.stringify({userId:userId})}`);
    try {
        let result = await models.cart.findAll({ 
            where: { user_id: String(userId) } 
        });
        if(result && result.length){
            result = result.map((el) => {
                el = el.toJSON();
                if(el.product_collection){
                    el.product_collection = JSON.parse(el.product_collection);
                }
                if(el.general_options){
                    el.general_options = JSON.parse(el.general_options);
                }
                if(el.additional_options){
                    el.additional_options = JSON.parse(el.additional_options);
                }
                return el;
            })
        }
        log.info(`End function getUserCarts  Result: ${JSON.stringify(result)}`);
        return result;
    } catch (err) {
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }
}

module.exports = {
    writeUserCartAfterLogin: async(userId, tempUser, trans) => {
        let transaction = null;
        log.info(`Start function writeUserCartAfterLogin Params: ${JSON.stringify({userId: userId,tempUser:tempUser})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let carts = await getUserCarts(tempUser);
            //await models.cart.destroy({ where: { user_id: String(userId) }, transaction });
            await models.cart.destroy({ where: { user_id: String(tempUser) }, transaction });
            for (const cart of carts) {
                await models.cart.create({
                    user_id: userId,
                    product_id: cart.product_id,
                    quantity: cart.quantity,
                    product_s: cart.product_s,
                    product_h: cart.product_h,
                    final_price: cart.final_price,
                    total_price: cart.total_price,
                    product_collection: cart.product_collection ? JSON.stringify(cart.product_collection) : null,
                    general_options: cart.general_options ? JSON.stringify(cart.general_options) : null,
                    additional_options: cart.additional_options ? JSON.stringify(cart.additional_options) : null,
                }, {
                    transaction
                });
            }
            if (!trans) await transaction.commit();
            log.info(`End function writeUserCartAfterLogin  Result: ${JSON.stringify(true)}`);
            return true;
        } catch (err) {
            log.error(`${err}`)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getUserCartByFilter: async(filter) => {
        log.info(`Start function getUserCartByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.cart.findOne({ 
                where: filter 
            });
            log.info(`End function getUserCartByFilter  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    deleteUserCartByFilter: async(filter) => {
        log.info(`Start function deleteUserCartByFilter Params: ${JSON.stringify(filter)}`);
        filter.user_id = String(filter.user_id)
        try {
            let result = await models.cart.destroy({ where: filter });
            log.info(`End function deleteUserCartByFilter  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getUserCarts: getUserCarts,
    createUserCart: async(cart) => {
        log.info(`Start function createUserCart Params: ${JSON.stringify(cart)}`);
        try {
            let result = await models.cart.create(cart);
            log.info(`End function createUserCart  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    
}