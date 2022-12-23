const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const config = require('../configs/config');
const errors = require('../configs/errors');
const linksService = require('./links.service');
const log = require('../utils/logger');

module.exports = {
    //****USED */
    createCategory: async(category, trans) => {
        log.info(`Start service createCategory. ${JSON.stringify(category)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let res = await models.product_category.findOne({
                where: { lang: category.lang },
                attributes: ["id", "position"],
                order: [
                    ["position", "DESC"]
                ]
            })
            category.position = res && res.position ? res.position + 1 : 1;

            let result = await models.product_category.create(category, { transaction });

            if(result){
                result = await models.product_category.findOne({
                    where: { id: result.id },
                    include: [
                        {
                            model: models.uploaded_files,
                            as: "image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "characteristics_image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "reviews_image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "configurator_image"
                        },
                        {
                            model: models.attribute,
                            as: 'attributes',
                            attributes: ['id', 'title'],
                            through: { attributes: [] }
                        },
                    ],
                    transaction
                });
                result = result.toJSON();
                result.attribute_groups = result.attribute_groups ? JSON.parse(result.attribute_groups) : null;
                result.attributes = result.attributes && result.attributes.length ? result.attributes.map(el => el.id) : [];
                result.sections = [{
                    body: [{
                        type: "2",
                        content:
                        {
                            text_2: result.seo_hidden_text,
                            title: result.seo_title,
                            text: result.seo_text,
                        }

                    }]
                }]
            }
            
            if (!trans) await transaction.commit();
            log.info(`End service createCategory. ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    //****USED */
    updateCategory: async(params, category, trans, parent_id, origin_id,) => {
        log.info(`Start service updateCategory. ${JSON.stringify(category)}`)
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.product_category.update(category,
                { where: filter, transaction }
            );
            if(parent_id){
                let originParentCategoryId = await models.product_category.findOne({
                    where: { [Op.or]: [{ id: parent_id }, { origin_id: parent_id }] },
                    raw: true
                })
                if(originParentCategoryId && originParentCategoryId.origin_id){
                    originParentCategoryId = originParentCategoryId.origin_id;
                }else if(originParentCategoryId && originParentCategoryId.id){
                    originParentCategoryId = originParentCategoryId.id;
                }
                for (const lang of config.LANGUAGES) {
                    await models.product_category.update({ parent_id: originParentCategoryId },
                        { where: { id: origin_id }, transaction }
                    );
                    originParentCategoryId++;
                    origin_id++;
                }
                

            }else if(parent_id === 0){
                await models.product_category.update({ parent_id: 0 },
                    { where: { [Op.or]: [{ id: origin_id }, { origin_id: origin_id }] }, transaction }
                );
            }

            result = await models.product_category.findOne({
                where: filter,
                include: [
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "characteristics_image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "reviews_image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "configurator_image"
                    },
                    {
                        model: models.attribute,
                        as: 'attributes',
                        attributes: ['id', 'title'],
                        through: { attributes: [] }
                    },
                ],
                transaction
            });
            if(result){
                result = result.toJSON();
                result.attribute_groups = result.attribute_groups ? JSON.parse(result.attribute_groups) : null;
                result.attributes = result.attributes && result.attributes.length ? result.attributes.map(el => el.id) : [];
                result.sections = [{
                    body: [{
                        type: "2",
                        content:
                        {
                            text_2: result.seo_hidden_text,
                            title: result.seo_title,
                            text: result.seo_text,
                        }

                    }]
                }]
            }

            if (!trans) await transaction.commit();
            log.info(`End service updateCategory. ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            if (!trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    //****USED */
    getOriginWithProductsCategories: async(lang) => {
        log.info(`Start  getOriginWithProductsCategories data:${JSON.stringify(lang)}`)
        try {
            let result = await models.product_category.findAll({
                where: {
                    lang: lang,
                    parent_id: 0,
                    status: config.GLOBAL_STATUSES.ACTIVE
                },
                order:[['position', 'ASC']],
                include: [{
                        model: models.product,
                        as: 'product',
                        attributes: [],
                        through: { attributes: [] }
                    },
                    {
                        model: models.uploaded_files,
                        as: 'image'
                    }
                ]
            });

            if (result && result.length) {
                let originalLinks = [];
                result = result.map(item => {
                    item = item.toJSON();
                    if(item.id) originalLinks.push(`/shop/getCategory/${item.id}`);
                    return item;
                });
                if(originalLinks && originalLinks.length){
                    let links = await models.links.findAll({
                        where: { 
                            original_link: originalLinks, 
                            lang: lang
                        },
                        raw: true 
                    });
                    if(links && links.length){
                        for (let cat of result) {
                            let link = links.find(item => item.original_link == `/shop/getCategory/${cat.id}`);
                            if(link && link.slug) cat.slug = lang === config.LANGUAGES[0] ? `${link.slug}` : `${lang}/${link.slug}`;
                        }
                    }

                }
            }
            log.info(`End getOriginWithProductsCategories data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getCategories: async(admin) => {
        try {
            // log.info(`Start getCategories.`)
            //let result = await  models.product_category.findAll({raw: true})
            let include = {}
            if (!admin) {
                include = [{
                        model: models.product,
                        as: 'product',
                        attributes: [],
                        where: { status: config.GLOBAL_STATUSES.ACTIVE },
                        through: { attributes: [] }
                    },
                    {
                        model: models.uploaded_files,
                        as: 'image'
                    },
                ]
            } else {
                include = [{
                        model: models.product,
                        as: 'product',
                        attributes: [],
                        through: { attributes: [] }
                    },
                    {
                        model: models.uploaded_files,
                        as: 'image'
                    }
                ]
            }
            return models.product_category.findAll({
                include: include
            });
            // log.info(`End getCategories.`)
            // return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    //**** */
    getCategoryById: async(id) => {
        try {
            log.info(`Start getCategoryById. ${JSON.stringify(id)}`)
            let result = await models.product_category.findOne({
                    where: { id: id }
                })
                log.info(`End getCategoryById. ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    //****USED */
    getOriginCategories: async() => {
        try {
            log.info(`Start  function  getOriginCategories.`)
            let result = await models.product_category.findAll({
                    where: { origin_id: 0 }
                })
                
                
            result = result.map((item) => item.toJSON())
            log.info(`End function getCategoryById Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    //**** */
    deleteCategory: async(id) => {
        try {
            log.info(`Start function deleteCategory.Params: ${JSON.stringify(id)}`)
            await models.product_to_category.destroy({
                where: { product_category_id: id }
            })
            let result = await models.product_category.destroy({
                    where: { id: id }
                })
                log.info(`End function deleteCategory. Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    editCategory: async(id, title) => {
        try {
            log.info(`Start function editCategory. id - ${JSON.stringify(id)}, title - ${JSON.stringify(title)}`)
            await models.product_category.update({ title }, { where: { id } })
            let result = await models.product_category.findOne({
                where: { id: id }
            })
            log.info(`End function editCategory  Result: ${JSON.stringify(result)}`);
            return result
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getCategoriesByIdsForMainPage: async(ids) => {
        log.info(`Start function getCategoriesByIdsForMainPage Params: ${JSON.stringify(ids)}`);
        let result = await models.product_kit_category.findAll({
            where: {
                id: {
                    [Op.in]: ids
                }
            },
            include: [{ model: models.uploaded_files, as: 'image' }],
            raw: true,
            nest: true
        });
        if (result && result.length) {
            result = ids.map(x => { return result.find(y => { return y.id === x }) });
            result.map(categ => {
                if (!categ.slug) categ.slug = categ.id;
            });
        }
        return result;
    },
    getCategoriesForMainPage: async(ids) => {
        log.info(`Start getCategoriesForMainPage data:${JSON.stringify(ids)}`)
        let result = await models.product_category.findAll({
            where: {
                id: {
                    [Op.in]: ids
                },
                status: config.GLOBAL_STATUSES.ACTIVE
            },
            include: [{ model: models.uploaded_files, as: 'image' }],
            raw: true,
            nest: true
        });
        if (result && result.length) {
            result = ids.map(x => { return result.find(y => { return y.id === x }) });
            block.content.ids.forEach(async(item) => {
                let link = await linksService.getLinkByFilter({ original_link: `/shop/getCategory/${item.id}` })
                link = link.toJSON()
                item.slug = link.slug
            })
        }
        log.info(`End getCategoriesForMainPage data:${JSON.stringify(result)}`)
        return result;
    },
    getBrandsForMainPage: async(ids) => {
        log.info(`Start getBrandsForMainPage data:${JSON.stringify(ids)}`)
        let result = await models.brand.findAll({
            where: {
                id: {
                    [Op.in]: ids
                },
                status: config.GLOBAL_STATUSES.ACTIVE
            },
            include: [{ model: models.uploaded_files, as: 'image' }],
            raw: true,
            nest: true
        });
        if (result && result.length) {
            result = ids.map(x => { return result.find(y => { return y.id === x }) });
        }
        log.info(`End getBrandsForMainPage data:${JSON.stringify(result)}`)
        return result;
    },
    getNewsForMainPage: async(ids) => {
        log.info(`Start getNewsForMainPage data:${JSON.stringify(ids)}`)
        let result = await models.posts.findAll({
            where: {
                id: {
                    [Op.in]: ids
                },
                status: config.GLOBAL_STATUSES.ACTIVE
            },
            include: [{ model: models.uploaded_files, as: 'image' }],
            raw: true,
            nest: true
        });
        if (result && result.length) {
            result = ids.map(x => { return result.find(y => { return y.id === x }) });
            block.content.ids.forEach(async(item) => {
                let link = await linksService.getLinkByFilter({ original_link: `/getPost/${item.id}` })
                link = link.toJSON()
                item.slug = link.slug
            })
        }
        log.info(`End getNewsForMainPage data:${JSON.stringify(result)}`)
        return result;
    },
    getPromotionsForMainPage: async(ids) => {
        log.info(`Start getPromotionsForMainPage data:${JSON.stringify(ids)}`)
        let result = await models.promotions.findAll({
            where: {
                id: {
                    [Op.in]: ids
                },
                status: config.GLOBAL_STATUSES.ACTIVE
            },
            include: [{ model: models.uploaded_files, as: 'image' }],
            raw: true,
            nest: true
        });
        if (result && result.length) {
            result = ids.map(x => { return result.find(y => { return y.id === x }) });
            block.content.ids.forEach(async(item) => {
                let link = await linksService.getLinkByFilter({ original_link: `/getPromotion/${item.id}` })
                link = link.toJSON()
                item.slug = link.slug
            })
        }
        log.info(`End getPromotionsForMainPage data:${JSON.stringify(result)}`)
        return result;
    },
    // getCategoriesByFilter: async(filter) => {
    //     let result = await models.product_category.findAll({
    //         where: filter,
    //     });
    //     result = result.map((item) => item.toJSON())

    //     return result;
    // },


    changePosition: async( id, position, is_last, trans ) => {
        log.info(`Start product_category service changePosition`)
        let transaction = null;
         try {
             if(is_last) {
                 position++
            }else{
                let draggedСategory =  await models.product_category.findOne({where: {id: id}});
                let positionСategory =  await models.product_category.findOne({where: {position: position}});
                let categoryLavel = draggedСategory ? draggedСategory.parent_id : draggedСategory;
                let positionСategoryLavel = positionСategory ? positionСategory.parent_id : undefined;
                if(categoryLavel !== positionСategoryLavel){
                    throw new Error(errors.BAD_REQUEST_INVALID_CHANGE_POSITION.message);
                }
            };

            transaction = trans ? trans : await sequelize.transaction();
            await models.product_category.increment({position: 1}, { where: { position: { [Op.gte]:position } }, transaction });
            await models.product_category.update({ position: position }, { where: { [Op.or]: [{ id: id }, { origin_id: id }] }, transaction });
            if (!trans) await transaction.commit();
            log.info(`End product_category service changePosition`)
            return true
         } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
         }
 
    },
}