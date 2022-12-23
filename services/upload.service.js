const { models, model } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op, json } = require("sequelize");
const config = require('../configs/config');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const log = require('../utils/logger');

module.exports = {
    getAllFiles: async(settings) => {
        log.info(`Start getAllFiles data:${JSON.stringify(settings)}`)
        try {
            let page = settings.current_page ? parseInt(settings.current_page) : null;
            let perPage = settings.items_per_page ? parseInt(settings.items_per_page) : null;
            const languages = config.LANGUAGES;
            const lang = settings.lang ? settings.lang : languages[0];
            let where = [{ lang: lang }];

            if (settings.search) {
                let searchField = settings.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({
                            [Op.like]: `%${item}%`
                        });
                    });
                    where.push({
                        [Op.or]: [{
                            filename: {
                                [Op.or]: like
                            }
                        },
                        {
                            alt_text: {
                                [Op.or]: like
                            }
                        },
                        {
                            description: {
                                [Op.or]: like
                            }
                        }]
                    });
                }
            }
            let offset = 0
            if (settings.dateFrom || settings.dateTo) {
                let created_at = {};

                if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom
                if (settings.dateTo) {
                    if (settings.dateFrom == settings.dateFrom) {
                        created_at[Op.lte] = new Date(settings.dateTo).setDate(new Date(settings.dateTo).getDate() + 1)
                    } else {
                        created_at[Op.lte] = settings.dateTo
                    }
                }

                // if (settings.dateFrom) created_at[Op.gte] = new Date(settings.dateFrom).getTime() / 1000;
                // if (settings.dateTo) {
                //     if (settings.dateFrom == settings.dateFrom) {
                //         created_at[Op.lte] = (new Date(settings.dateTo).getTime() / 1000) + 86400;
                //     } else {
                //         created_at[Op.lte] = new Date(settings.dateTo).getTime() / 1000;
                //     }
                // }
                where.push({ created_at: created_at });
            }
            if (settings.file_type) {
                where.push({
                    [Op.or]: { file_type: settings.file_type }
                });
            }
            if (settings.status !== 'all') {
                if (settings.status === 'other') {
                    where.push({
                        [Op.or]: { type: null }
                    });
                } else {
                    where.push({
                        [Op.or]: { type: settings.status }
                    });
                }
            }

            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            console.log(where)
            let result = await models.uploaded_files.findAndCountAll({
                where: where,
                offset: offset,
                limit: perPage,
                sort: [
                    ['created_at', 'DESC']
                ],
                order: [
                    ["created_at", "DESC"]
                ],
                distinct: true
            })
            log.info(`End getAllFiles data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    countFiles: async(language) => {
        log.info(`Start countFiles data:${JSON.stringify(language)}`)
        const languages = config.LANGUAGES;
        const lang = language ? language : languages[0];

        let result = await models.uploaded_files.findAll({
            where: { lang: lang },
            raw: true,
            attributes: ['id', 'type']
        });

        function imageType(type) {
            let filteredImages;
            if (type) {
                filteredImages = result.filter(file => file.type === type).length;
            } else {
                filteredImages = result.filter(file => file.type === null).length;
            }
            return filteredImages;
        }
        let pages = imageType('pages');
        let banner = imageType('banner');
        let editor = imageType('editor');
        let products = imageType('products');
        let blog = imageType('blog');
        let categories = imageType('categories');
        let network = imageType('network');
        let configurator = imageType('configurator');
        let other = imageType(null);
        log.info(`End countFiles`)
        return {
            all: pages + banner + editor + products + blog + categories + network + configurator + other,
            folders: {
                pages: pages,
                banner: banner,
                editor: editor,
                products: products,
                blog: blog,
                categories: categories,
                network: network,
                configurator: configurator,
                other: other,
            }
        };
    },

    bulkCreateUploadRows: async(data) => {
        let result = await models.uploaded_files.bulkCreate();

        return result;
    },

    createUploadRow: async(data) => {
        let result = await models.uploaded_files.create(data);

        return result;
    },
}