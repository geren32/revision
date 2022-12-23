const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const pagesService = require('../services/pages.service');
const linksService = require('../services/links.service');
const postService = require('../services/post.service');
const metaDataService = require('../services/meta-data.service');
const promotionService = require('../services/promotions.service');
const log = require('../utils/logger');

module.exports = {

    deletePreviewNews: async() => {
        log.info(`Start deletePreviewNews service`)
        try {
            let result = [];
            let ids = await postService.getAllNews({
                preview: {
                    [Op.ne]: null
                }
            });
            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    id = id.id;
                    const original_link = `/getPost/${id}`;
                    
                    await postService.deletePostById(id, transaction);
                    await linksService.removeLink({ original_link: original_link }, transaction);
                    await metaDataService.deleteMetaData({ url: original_link }, transaction);
                    result.push({ id: id, deleted: true, error: false });
                }
                await transaction.commit();
            }
            log.info(`End deletePreviewNews service data: ${JSON.stringify(result)}`)
            return result;

        } catch (error) {
            log.error(error)
            throw new Error(error);
        }
    },


    deletePreviewPage: async() => {
        log.info(`Start deletePreviewPage service`)
        try {
            let result = [];
            let ids = await pagesService.getAllPages({
                preview: {
                    [Op.ne]: null
                }
            });
            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    id = id.id;
                    const original_link = `/getPage/${id}`;
                    await pagesService.removePage(id, transaction);
                    await linksService.removeLink({ original_link: original_link }, transaction);
                    await metaDataService.deleteMetaData({ url: original_link }, transaction);
                    result.push({ id: id, deleted: true, error: false });
                }
                await transaction.commit();
            }
            log.info(`End deletePreviewPage service data: ${JSON.stringify(result)}`)
            return result;

        } catch (error) {
            log.error(error)
            throw new Error(error);
        }
    },
    deletePreviewPromotions: async() => {
        log.info(`Start deletePreviewPromotions service`)
        try {
            let result = [];
            let ids = await promotionService.getAllPromotions({
                preview: {
                    [Op.ne]: null
                }
            });
            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    id = id.id;
                    const original_link = `/getPromotion/${id}`;
                    await promotionService.deletePromotionById(id, transaction);
                    await linksService.removeLink({ original_link: original_link }, transaction);
                    await metaDataService.deleteMetaData({ url: original_link }, transaction);
                    result.push({ id: id, deleted: true, error: false });
                }
                await transaction.commit();
            }
            log.info(`End deletePreviewPromotions service data: ${JSON.stringify(result)}`)
            return result;

        } catch (error) {
            log.error(error)
            throw new Error(error);
        }
    },



}