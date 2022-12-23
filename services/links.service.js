const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const config = require('../configs/config');
const log = require('../utils/logger');
module.exports = {
    getTranslateLink: async(model, url, linkName, lang) => {
        log.info(`Start getTranslateLink service data:${JSON.stringify(model, url, linkName, lang)}`)
        let postId = url && url.includes(`/${linkName}/`) ? url.split(`/${linkName}/`).pop() : null;
        if (!postId) {
            let foundLink = await models.links.findOne({ where: { slug: url } });
            postId = foundLink.original_link && foundLink.original_link.includes(`/${linkName}/`) ? foundLink.original_link.split(`/${linkName}/`).pop() : null;
        }
        let result = [];


        for (let i of config.LANGUAGES_MENU) {
            if (lang !== i.lang) {
                let foundItemOne = await model.findOne({ where: { id: postId, lang: lang } });

                let foundItemLink = {};
                // let  foundItemOne = await model.findOne({where: {origin_id:postId , lang : 'ru' } });

                if (foundItemOne) {
                    foundItemLink = await models.links.findOne({ where: { original_link: `/${linkName}/${foundItemOne.origin_id}` } });
                } else {
                    foundItemOne = await model.findOne({ where: { id: postId, origin_id: 0 } });
                    foundItemLink = await models.links.findOne({ where: { original_link: `/${linkName}/${foundItemOne.id}` } });
                }

                i.slug = foundItemLink && foundItemLink.slug ? foundItemLink.slug : '/';
                result.push(i);
            }

        }
        log.info(`End getTranslateLink service data:${JSON.stringify(result)}`)
        return result;
    },

    createLink: async(linkData, trans) => {
        let transaction = null;
        log.info(`Start createLink service data:${JSON.stringify(linkData)}`)
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.links.create(linkData, { transaction });

            if (!trans) await transaction.commit();
            log.info(`End createLink service data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            if (!trans) await transaction.rollback();
            throw err;
        }


    },

    getLinkBySlag: async(slug, trans) => {
        try {
            log.info(`Start getLinkBySlag service data:${JSON.stringify(slug)}`)
            let transaction = trans ? trans : null;
            return await models.links.findOne({
                where: { slug: slug },
                transaction
            });
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getLinkByFilter: async(filter, trans) => {
        try {
            log.info(`Start getLinkByFilter service data:${JSON.stringify(filter)}`)
            let transaction = null;
            trans ? transaction = trans : {};
            return await models.links.findOne({
                where: filter,
                transaction
            });
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getLinkObjByFilter: async(filter, trans) => {
        log.info(`getLinkObjByFilter service data:${JSON.stringify(filter)}`)
        let transaction = null;
        trans ? transaction = trans : {};
        return await models.links.findOne({
            where: filter,
            raw: true,
            transaction
        });
    },

    getLinkByslug: async(slug, trans) => {
        log.info(`getLinkByslug service data:${JSON.stringify(slug)}`)
        let transaction = null;
        trans ? transaction = trans : {};
        return await models.links.findOne({
            where: { slug: slug },
            transaction
        });
    },
    removeLink: async(filter, trans) => {
        log.info(`Start removeLink service data:${JSON.stringify(filter)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.links.destroy({ where: filter, transaction });

            if (!trans) await transaction.commit();
            log.info(`End removeLink service data:${JSON.stringify(true)}`)
            return true;

        } catch (err) {
            log.error(err)
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

   

    getAllLinks: async(slug, trans) => {
        log.info(`Start getAllLinks service data:${JSON.stringify(slug)}`)
        let transaction = trans ? trans : null;
        let filter = slug;
        if (typeof slug !== 'object') {
            filter = { slug: slug }
        }
        try {
            
            let result = await models.links.findAll({
                where: filter,
                transaction
            });

            log.info(`End getAllLinks service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    updateLink: async(linkData, slug, trans) => {
        log.info(`Start updateLink service data:${JSON.stringify(linkData, slug)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.links.update(linkData, { where: { slug: slug }, transaction });
            let result = true;
            if (!trans) await transaction.commit();
            log.info(`End updateLink service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateLinkService: async(linkData, slug,lang, trans) => {
        log.info(`Start updateLink service data:${JSON.stringify(linkData, slug)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.links.update(linkData, { where: { slug: slug,lang:lang }, transaction });
            let result = true;
            if (!trans) await transaction.commit();
            log.info(`End updateLink service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    }






}
