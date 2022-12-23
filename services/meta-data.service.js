const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const log = require('../utils/logger');
module.exports = {

    createMetaData: async(metaData, trans) => {
        let transaction = null;
        log.info(`Start createMetaData service data:${JSON.stringify(metaData)}`)
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.meta_data.create(metaData, { transaction });

            if (!trans) await transaction.commit();
            log.info(`End createMetaData service data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            if (!trans) await transaction.rollback();
            throw err;
        }


    },

    findOrCreateMetaData: async(metaData,trans) => {
        log.info(`Start findOrCreateMetaData service data:${JSON.stringify(metaData)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.meta_data.findOrCreate(metaData);
            if(!trans) await transaction.commit();
            log.info(`End findOrCreateMetaData service data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            if (!trans) await transaction.rollback();
            throw err;
        }


    },

    deleteMetaData: async(link, trans) => {
        log.info(`Start deleteMetaData service data:${JSON.stringify(link)}`)
        let transaction = null;
        let filter = link;
        if (typeof link !== 'object') {
            filter = { url: link }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.meta_data.destroy({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End deleteMetaData service data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }


    },
    getMetaDataBySlugOrUrl: async(url, trans) => {
        log.info(`Start getMetaDataBySlugOrUrl service data:${JSON.stringify(url)}`)
        const transaction = trans ? trans : null
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItSlug = await models.links.findOne({ where: { slug: slug }, transaction });

                if (isItSlug && isItSlug.original_link) {
                    metaData = await models.meta_data.findOne({ where: { url: isItSlug.original_link }, transaction });
                }
            }

            log.info(`End getMetaDataBySlugOrUrl service data:${JSON.stringify(metaData)}`)
            return metaData;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

}