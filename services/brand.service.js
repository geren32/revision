const config = require('../configs/config');
const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const log = require('../utils/logger');

async function getBrandByFilter(filter, trans) {
    log.info(`Start getBrandByFilter data:${JSON.stringify(filter)}`)
    let transaction = trans ? trans : null;
    log.info(`Start function getBrandByFilter Params: ${JSON.stringify(filter)}`);
    try {

        let result = await models.brand.findOne({
            where: filter,
            include: [{
                model: models.uploaded_files,
                as: "image"
            }],
            transaction
        })
        if (result) {
            result = result.toJSON();
            result.sections = [{
                body: [{
                    type: "2",
                    content: {
                        hidden_text: result.seo_hidden_text ? result.seo_hidden_text : null,
                        text: result.seo_text ? result.seo_text : null,
                        title: result.seo_title ? result.seo_title : null,
                    }

                }]
            }]
            delete result.seo_hidden_text;
            delete result.seo_text;
            delete result.seo_title;
        }
        log.info(`End getBrandByFilter data:${JSON.stringify(result)}`)
        return result;

    } catch (err) {
        log.error(err)
        if (transaction) await transaction.rollback();
        err.code = 400;
        throw err;
    }

}

module.exports = {
    createBrand: async(brand, trans) => {
        let transaction = null;
        log.info(`Start function createBrand  Params: ${JSON.stringify(brand)}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.brand.create(brand, { transaction });

            result = await getBrandByFilter({ id: result.id }, transaction);

            if (!trans) await transaction.commit();
            log.info(`End function createBrand Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getBrands: async(filter) => {
        log.info(`Start getBrands data:${JSON.stringify(filter)}`)
        try {
            let result = await models.brand.findAll({
                where: filter,
            });
            log.info(`End getBrands data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getBrandByFilter: getBrandByFilter,

    deleteBrandById: async(id, transaction) => {
        try {
            log.info(`Start function deleteBrandById Params: ${JSON.stringify(id)}`);
            let result = await models.brand.destroy({ where: { id: id }, transaction })
            log.info(`End function deleteBrandById Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    updateBrandById: async(params, brand, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function  Params: ${JSON.stringify({params: params, brand:brand})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.brand.update(brand, { where: filter, transaction });
            let result = await getBrandByFilter(filter, transaction);

            if (!trans) await transaction.commit();
            log.info(`End function updateBrandById Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },
    countBrandsByParam: async(filter) => {
        log.info(`Start function countBrandsByParam  Params: ${JSON.stringify(filter)}`);
        const result = await models.brand.count({
            where: filter
        });
        log.info(`End function countBrandsByParam  Result: ${JSON.stringify(result)}`);
        return result ? result : 0;
    },
    makeBrandsFilter: async(body, whereObj) => {
        let arr = [];
        let sort;
        log.info(`Start function makeBrandsFilter  Params: ${JSON.stringify({body:body, whereObj:whereObj})}`);
        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({
                        [Op.like]: `%${item}%`
                    });
                });
                arr.push({
                    title: {
                        [Op.or]: like
                    }
                });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [
                    ['created_at', body.sort.created_at]
                ];
            }
        } else {
            sort = [
                ['created_at', 'DESC']
            ];
        }
        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End function makeBrandsFilter Result: ${JSON.stringify(filter)}`);
        return filter;
    },

    adminGetAllBrand: async(filter, page, perPage, attributes) => {
        log.info(`Start function adminGetAllBrand Params: ${JSON.stringify({filter:filter, page:page, perPage:perPage, attributes:attributes})}`);
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.brand.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include: [{
                    model: models.uploaded_files,
                    as: "image"
                }],
            });
            if (result && result.rows && result.rows.length) {
                let allBrands = []
                for (let item of result.rows) {
                    item = item.toJSON();
                    let lang_change = await models.brand.findAll({
                        where: {
                            [Op.or]: [{ id: item.id }, { origin_id: item.id }]
                        },
                        attributes: ['id', 'origin_id', 'lang'],
                        raw: true
                    })
                    let change = {}
                    for (let id of lang_change) {
                        id.history = await models.admin_changes_history.findAll({
                            where: {
                                item_id: id.id,
                                type: "brand"
                            },
                            raw: true
                        })
                        for (const lang of config.LANGUAGES) {
                            if (id.lang === lang) {
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    item.change = change
                    allBrands.push(item)
                }
                result.rows = allBrands
            }
            log.info(`End function  adminGetAllBrand Result: ${JSON.stringify(result)}`);
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    get_all_brands_with_products: async(lang) => {
        log.info(`Start get_all_brands_with_products data:${JSON.stringify(lang)}`)
        try {
            let allBrands = await models.brand.findAll({
                distinct: true,
                where: {
                    lang: lang
                },
                include: [{
                        model: models.uploaded_files,
                        as: "image",
                    },
                    {
                        model: models.product,
                    },
                ],
            });
            allBrands = allBrands.map(item => item.toJSON());
            let result = []

            allBrands.forEach((item) => {
                if (item.products && item.products.length) {
                    result.push(item)
                }
            })
            log.info(`End get_all_brands_with_products data:${JSON.stringify(result)}`)
            return result

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getOriginWithProductsBrandsByCategory: async(category, lang, filter, filterByAttribute, filterByCategory) => {
        log.info(`Start getOriginWithProductsBrandsByCategory data:${JSON.stringify(category, lang, filter, filterByAttribute, filterByCategory)}`)
        if (filterByAttribute) filterByAttribute = filterByAttribute.where
        try {
            let result = await models.product_category.findOne({
                where: {
                    id: category,
                    lang: lang
                },
                required: true,
                include: [{
                    model: models.product,
                    as: 'product',
                    where: filter.where,
                    include: [{
                            model: models.brand,
                            required: true
                        },
                        {
                            model: models.attribute,
                            as: 'product_attribute',
                            required: true,
                            //distinct: true,
                            attributes: ['id', 'title', 'value', 'status', 'type', 'unit_of_measurement'],
                            through: { attributes: ['value'], as: 'activeValue', where: filterByAttribute },
                            include: [{
                                model: models.attribute_ranges,
                                //as: "attribute_range"
                            }]

                        },
                        {
                            model: models.product_category,
                            as: 'category',
                            required: true,
                            through: { attributes: ['product_category_id'], where: filterByCategory.where }
                        },
                    ]
                }]


            });
            if (result) {
                result = result.toJSON()
            }

            //result = result.map((item) => item.toJSON())
            log.info(`End getOriginWithProductsBrandsByCategory data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getMetaDataBySlagOrUrl: async(url, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getMetaDataBySlagOrUrl Params: ${JSON.stringify(url)}`);
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItSlag = await models.links.findOne({ where: { slug: slug }, transaction });

                if (isItSlag && isItSlag.original_link) {
                    metaData = await models.meta_data.findOne({ where: { url: isItSlag.original_link }, transaction });
                }
            }
            log.info(`End function getMetaDataBySlagOrUrl Result: ${JSON.stringify(metaData)}`);
            return metaData;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    // getAllPosibleBrands: async(filter, filterByCategory) => {
    //     try {
    //         let result = await models.product.findAll({
    //             where: filter.where,
    //             include: [{
    //                 model: models.product_category,
    //                 as: 'category',
    //                 where: filterByCategory.where,
    //                 required: true
    //             }]
    //         });
    //         result = result.map((item) => item.toJSON())
    //         return result;
    //     } catch (err) {
    //         err.code = 400;
    //         throw err;
    //     }
    // },

}