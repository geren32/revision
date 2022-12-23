const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const Sequelize = require('sequelize');
const log = require('../utils/logger');

module.exports = {

    adminCreateHistory: async(data, trans) => {
        log.info(`Start adminCreateHistory data:${JSON.stringify(data)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            //data.created_at = Math.floor(new Date().getTime() / 1000);
            const result = await models.admin_changes_history.create(data, { transaction });
            if (!trans) await transaction.commit();
            log.info(`End adminCreateHistory data:${JSON.stringify(result)}`)
            return result

        } catch (err) {
            log.error(`${err}`);
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    adminFindAllHistory: async(filter, trans) => {
        log.info(`Start adminFindAllHistory data:${JSON.stringify(filter)}`)
        let transaction = trans ? trans : null;
        try {

            const result = await models.admin_changes_history.findAll({
                where: filter,
                order: [
                    ["created_at", "DESC"]
                ],
                include: { model: models.user, attributes: ['id', 'email','first_name','last_name'] },
                transaction
            });
            log.info(`End adminFindAllHistory data:${JSON.stringify(result)}`)
            return result

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    add_to_order_revision: async(data, trans) => {
        log.info(`Start add_to_order_revision data:${JSON.stringify(data)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            const result = await models.orders_revision.create(data, { transaction });
            if (!trans) await transaction.commit();
            log.info(`End add_to_order_revision data:${JSON.stringify(result)}`)
            return result

        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

}
