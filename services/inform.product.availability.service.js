const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const log = require('../utils/logger');

module.exports = {
     createInformProductAvailability: async (informObj) => {
        log.info(`Start function Params: ${JSON.stringify(informObj)}`);
        try {
            let result = await models.inform_product_availability.create(informObj);
            log.info(`End function  createInformProductAvailability Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
     getInformProductAvailabilitysByFilter: async (filter) => {
        log.info(`Start function getInformProductAvailabilitysByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.inform_product_availability.findAll({
                where: filter,
            })
            log.info(`End function getInformProductAvailabilitysByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getOneInformProductAvailabilitysByFilter: async (filter) => {
        log.info(`Start function Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.inform_product_availability.findOne({
                where: filter,
            })
            log.info(`End function getOneInformProductAvailabilitysByFilter  Result: ${JSON.stringify(result.toJSON())}`);
            return result.toJSON();
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    
     deleteInformProductAvailabilitysByFilter: async (filter) => {
        log.info(`Start function deleteInformProductAvailabilitysByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.inform_product_availability.destroy({
                where: filter
            })
            log.info(`End function deleteInformProductAvailabilitysByFilter  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    updateInformAvailabilityById: async(params, product, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function updateInformAvailabilityById  Params: ${JSON.stringify({params: params, product:product})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.inform_product_availability.update(product, { where: filter, transaction });
            let result = await models.inform_product_availability.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End function updateInformAvailabilityById Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },
     


}
