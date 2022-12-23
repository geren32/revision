const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const log = require("../utils/logger");
module.exports = {
    createAddress: async (address, trans) => {
        let transaction = null;
        log.info(`Start function createAddress Params: ${JSON.stringify(address)}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.address.create(address, { transaction });
            if (!trans) await transaction.commit();
            log.info(`End function createAddress Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    findAllAddress: async () => {
        const result = await models.address.findAll();
        return result;
    },

    getAddressById: async (id) => {
        const result = await models.address.findOne({
            where: { id: id }
        });
        return result;
    },

    deleteAddressById: async (id) => {
        const result = await models.address.destroy({
            where: { id: id }
        });
        return result;
    },

    editAddress: async (id,address,trans) => {
        // ids,orders,
        let transaction = null;
        try {
            log.info(
                `Start editAddress. Params: ${JSON.stringify({id:id , address: address})}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            await models.address.update(address, { where: { id }, transaction });
            if (!trans) await transaction.commit();
            let result = models.address.findOne({
                where: { id: id },
                transaction
            })
            // await models.orders.update(orders,{where:{id:ids},transaction})
            log.info(
                `End editAddress. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    Address: async (address) => {
        const result = await models.address.create(address);
        return result;
    },
}
