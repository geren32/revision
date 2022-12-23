const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const extraUtil = require('../utils/extra-util');
const linksService = require('../services/links.service');
const productTestimonialsService = require('../services/product_testimonials.service');
const config = require('../configs/config');
const moment = require('moment')
const log = require('../utils/logger');

async function getPromotion(filter, trans, fullLabels,lang) {
    let transaction = trans ? trans : null;
    const languages = config.LANGUAGES;
    try {

        let promotions = await models.promotions.findOne({
            where: filter,
            include: [
                { model: models.uploaded_files, as: "image" },
                { model: models.uploaded_files, as: "banner_image" },
                { model: models.uploaded_files, as: "banner_image_mobile" },
                {
                    model: models.mark,
                    as: 'marks',
                    attributes: ['id', 'title', 'color'],
                    include: [{ model: models.uploaded_files, as: "mark_image" }],
                    through: { attributes: [] }
                },
            ],
            transaction
        });
        promotions = promotions ? promotions.toJSON() : promotions;

        if (promotions && promotions.id) {

            if(promotions.marks && promotions.marks.length && !fullLabels){
                promotions.marks = promotions.marks.map(i => i.id);
            }

            let promotions_contents = await models.promotions_content.findAll({
                where: { promotion_id: promotions.id },
                include: [
                    { model: models.uploaded_files, as: 'block_image' },
                ],
                transaction
            });

            if (promotions_contents && promotions_contents.length) promotions_contents = promotions_contents.map(i => i.toJSON());
            promotions.body = await extraUtil.convertPostBodyForFrontendFormat(promotions_contents);

            if(promotions.body && promotions.body.length){
                promotions.body = await Promise.all(promotions.body.map( async (el) => {
                    let ids = [];
                    if(el.type == 7 && el.content && el.content.ids && el.content.ids.length){
                        for (let id of el.content.ids) {
                            let product = await models.product.findOne({
                                where: { id: id },
                                attributes:['id','origin_id','name','sku','image_id', 'hover_image_id','price','discounted_price','availability'],
                                include: [
                                    {
                                        model: models.uploaded_files,
                                        as: "image"
                                    },  
                                    {
                                        model: models.uploaded_files,
                                        as: "hover_image"
                                    },
                                    {
                                        model: models.mark,
                                        as: 'product_marks',
                                        through: { attributes: [] },
                                        include: [{
                                            model: models.uploaded_files,
                                            as: 'mark_image'
                                        }]
                                    },
                                    {
                                        model: models.attribute,
                                        as: 'product_attribute',
                                        attributes: ['id', 'title'],
                                        through: { attributes: ['value'], as: 'activeValue' }
                                    },
                                ],
                                transaction
                            })
                            let originProductId; 
                            if(product) {
                                originProductId =  product  ? product.origin_id : product.id;
                                product = product.toJSON();
                                product.slug = await linksService.getLinkObjByFilter({original_link: `/shop/getProduct/${product.id}`,lang});
                                product.product_testimonials = await productTestimonialsService.getAllProductTestimonialsByFilter({
                                        parent_id: 0,
                                        status: config.GLOBAL_STATUSES.ACTIVE,
                                        origin_product_id: originProductId, 
                                });
                                product.rating =  productTestimonialsService.getRatingArr(product.product_testimonials)
                                ids.push(product)};
                        }
                        el.content.ids = ids;
                    }
                    return el;
                }));
            }

            promotions.d_from = promotions.date_from ? moment(new Date(promotions.date_from)).format("DD.MM") : '';
            promotions.d_to = promotions.date_to ? moment(new Date(promotions.date_to)).format("DD.MM.YYYY") : '';
            
            
            if(promotions.date_to_timer &&  new Date(promotions.date_to_timer).getTime() >= new Date(moment().endOf('day')).getTime() ){
                promotions.date_to_timer =  moment(new Date(promotions.date_to_timer)).format("YYYY/MM/DD");
                promotions.isShowTimer = true;
            } 
        }

        return promotions;

    } catch (err) {
        if (transaction) await transaction.rollback();
        err.code = 400;
        throw err;
    }

}

module.exports = {

    createPromotion: async (promotion, marks, trans) => {
        let transaction = null;
        log.info(`Start function createPromotion Params: ${JSON.stringify({promotion: promotion, marks: marks})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.promotions.create(promotion, {
                include: [
                    { model: models.promotions_content }
                ],
                transaction
            });

            if (marks && marks.length && result && result.id) {
                for (let mark of marks) {
                    if (typeof mark == 'object' && mark.id) mark = mark.id;
                    await models.promotion_to_mark.create({
                        promotion_id: result.id,
                        mark_id: mark
                    }, { transaction });
                }
            }

            result = await getPromotion({ id: result.id }, transaction);

            if (!trans) await transaction.commit();
            log.info(`End function createPromotion  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getOriginPromotionFormat: async (filter, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getOriginPromotionFormat Params: ${JSON.stringify(filter)}`);
        try {

            let promotions = await models.promotions.findOne({
                where: filter,
                transaction,
                include: [
                    { model: models.promotions_content },
                    {
                        model: models.mark,
                        as: 'marks',
                        attributes: ['id', 'title', 'color'],
                        through: { attributes: [] },
                    },
                ]
            });

            // page.meta_data = await postService.getMetaDataBySlagOrUrl(page.slag, transaction);
            log.info(`End function getOriginPromotionFormat  Result: ${JSON.stringify(promotions)}`);
            return promotions;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getMetaDataBySlagOrUrl: async (url, trans) => {
        const transaction = trans ? trans : await sequelize.transaction();
        log.info(`Start function getMetaDataBySlagOrUrl Params: ${JSON.stringify(url)}`);
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItSlag = await models.links.findOne({where: {slug: slug}, transaction});

                if (isItSlag && isItSlag.original_link) {
                    metaData = await models.meta_data.findOne({where: {url: isItSlag.original_link}, transaction});
                }
            }
            if (!trans) await transaction.commit();
            log.info(`End function getMetaDataBySlagOrUrl  Result: ${JSON.stringify(metaData)}`);
            return metaData;
        } catch (err) {
            if (transaction) await transaction.rollback();
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    countPromotionByParam: async (whereObj) => {
        
        log.info(`Start function countPromotionByParam Params: ${JSON.stringify(whereObj)}`);
        try {
            let result = await models.promotions.count({
                where: whereObj
            });
            // log.info(`End function countPromotionByParam  Result: ${JSON.stringify({result})}`);
            return result ? result : 0;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    getPromotion: getPromotion,

    getAllPromotions: async (whereObj) => {
        log.info(`Start function getAllPromotions Params: ${JSON.stringify(whereObj)}`);
        let result = await models.promotions.findAll({
            where: whereObj
        });
        log.info(`End function getAllPromotions Result: ${JSON.stringify(result)}`);
        return result;
    },

    updatePromotion: async (promotionId, promotionData, bodyData, marks, trans) => {
        promotionData.updated_at = new Date().toISOString();

        let transaction = null;
        let result = null;
        log.info(`Start function Params: ${JSON.stringify({promotionId: promotionId, promotionData: promotionData, bodyData: bodyData, marks: marks})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();

            if (marks && marks.length) {
                await models.promotion_to_mark.destroy({ where: { promotion_id: promotionId }, transaction });
                for (let mark of marks) {
                    await models.promotion_to_mark.create({
                        promotion_id: promotionId,
                        mark_id: mark
                    }, { transaction });
                }
            }

           // if (bodyData && bodyData.length) {
                //delete old pages_content
                await models.promotions_content.destroy({ where: { promotion_id: promotionId }, transaction });
                //create new pages_content
                await models.promotions_content.bulkCreate(bodyData, { transaction });
           // }
            //update page
            await models.promotions.update(promotionData, { where: { id: promotionId }, transaction });
            // await models.posts_body.bulkCreate(bodyData, { include:[ {model: models.posts_body_to_uploaded_images, as: "posts_body_images" } ], transaction });

            result = await getPromotion(promotionId, transaction);

            if (!trans) await transaction.commit();
            log.info(`End function updatePromotion  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getPromotionByFilter: async (filter, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getPromotionByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.promotions.findOne({
                where: filter,
                // include: [
                //     { model: models.networks, as: "network" }
                // ],
                transaction
            });
            log.info(`End function getPromotionByFilter Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },



    adminGetAllPromotions: async (filter, page, perPage, attributes) => {
       
        log.info(`Start function adminGetAllPromotions Params: ${JSON.stringify({filter: filter, page: page, perPage: perPage, attributes})}`);
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.promotions.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include: [
                    { model: models.uploaded_files, as: "image" },
                ]
            });

            if (result && result.rows && result.rows.length) {
                result.rows = result.rows.map(i => i.toJSON());
                for (let i=0; i<result.rows.length; i++) {
                    let link = await linksService.getLinkByFilter({original_link: `/getPromotion/${result.rows[i].id}`});
                    if(link) result.rows[i].slug = link.slug;

                    let lang_change = await models.promotions.findAll({
                        where:{ [Op.or]:[ {id: result.rows[i].id}, {origin_id: result.rows[i].id} ] },
                        attributes:['id','origin_id','lang'],
                        raw: true
                    })
                    let change ={}
                    for(let id of lang_change){
                        id.history = await models.admin_changes_history.findAll({
                            where:{
                                item_id: id.id , type:"promotion"
                            },
                            raw: true
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length >1 ? true : false;
                            }
                        }
                    }
                    result.rows[i].change = change;
                }
            }
            
            log.info(`End function adminGetAllPromotions Result: ${JSON.stringify(result)}`);
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },


    makePromotionFilter: async (body, whereObj) => {
        let arr = [{ preview: {[Op.eq]: null} }];
        let sort;
        log.info(`Start function makePromotionFilter Params: ${JSON.stringify({body:body,whereObj:whereObj})}`);
        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({ title: { [Op.and]: like } });
            }
        }


        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }

        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;

            arr.push({ created_at: date });
        }
        if (body.sort && body.sort.key && body.sort.direction) {
                sort = [[body.sort.key, body.sort.direction]];
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        log.info(`End function makePromotionFilter  Result: ${JSON.stringify(filter)}`);
        return filter;
    },

    updatePromotionById: async (params, promotion, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function Params: ${JSON.stringify({params: params, promotion: promotion})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.promotions.update(promotion, { where: filter, transaction });
            let result = await models.promotions.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End function updatePromotionById  Result: ${JSON.stringify(filter)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    deletePromotionById: async (id, trans) => {

        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.promotion_to_mark.destroy({ where: {promotion_id: id}, transaction});
            await models.promotions_content.destroy({ where: {promotion_id: id}, transaction});
            let result = await models.promotions.destroy({ where: {id: id}, transaction });

            if (!trans) await transaction.commit();

            return result ? true: false;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getAllPromorions:async (data, perPage, page) => {
        log.info(`Start function getAllPromorions Params: ${JSON.stringify({data:data, perPage:perPage, page:page})}`);
        try {
            const languages = config.LANGUAGES;
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.promotions.findAndCountAll({
                where: {status: config.GLOBAL_STATUSES.ACTIVE, lang: data.lang, preview: {[Op.eq]: null}},
                offset: offset,
                limit: limit,
                order: [["updated_at", "DESC"]],
                distinct: true,
                include: [
                    { model: models.uploaded_files, as: "image" },
                ]
            });

            if (result && result.rows && result.rows.length) {
                let originalLinks = [];
                result.rows = result.rows.map(item => {
                    item = item.toJSON();
                    item.date_from = item.date_from ? moment(new Date(item.date_from)).format("DD.MM") : '';
                    item.date_to = item.date_to ? moment(new Date(item.date_to)).format("DD.MM.YYYY") : '';
                    if(item.id) originalLinks.push(`/getPromotion/${item.id}`);
                    return item;
                });
                if(originalLinks && originalLinks.length){
                    let links = await models.links.findAll({
                        where: { 
                            original_link: originalLinks, 
                            lang: data.lang
                        },
                        raw: true 
                    });
                    if(links && links.length){
                        for (let promo of result.rows) {
                            let link = links.find(item => item.original_link == `/getPromotion/${promo.id}`);
                            if(link && link.slug) promo.slug = data.lang === config.LANGUAGES[0] ? `${link.slug}` : `${data.lang}/${link.slug}`;
                        }
                    }

                }
            }
            log.info(`End function getAllPromorions Result: ${JSON.stringify(result)}`);
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

}
