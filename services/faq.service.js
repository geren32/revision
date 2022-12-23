const { models } = require('../sequelize-orm');
const {sequelize} = require('../sequelize-orm');
const { Op } = require("sequelize");
const config = require('../configs/config');
const extraUtil = require('../utils/extra-util');
const linksService = require('../services/links.service');
const log = require('../utils/logger');
const _ = require('lodash');

async function getFaq(filter, trans) {
    log.info(`Start getFaq service data:${JSON.stringify(filter)}`)
    let transaction = trans ? trans : null;
    try {

        let faq = await models.faq.findOne({
            where: filter,
            transaction
        });

        faq = faq ? faq.toJSON() : faq;

        if (faq && faq.id) {


            let faqs_contents = await models.faqs_content.findAll({
                where: { faq_id: faq.id },
                // order: [["sequence_number", "ASC"]],
                include: [

                    { model: models.uploaded_files, as: 'block_image' },

                ],
                transaction
            });

            if (faqs_contents && faqs_contents.length) faqs_contents = faqs_contents.map(i => i.toJSON());
            faq.body = await extraUtil.convertFaqBodyForFrontendFormat(faqs_contents);

        }
        log.info(`End getFaq service data:${JSON.stringify(faq)}`)
        return faq;

    } catch (err) {
        log.error(err)
        if (transaction) await transaction.rollback();
        err.code = 400;
        throw err;
    }

}



module.exports = {

    createFaq: async(faq, trans) => {
        log.info(`Start createFaq service data:${JSON.stringify(faq)}`)
        let transaction = null;
        try {

            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.faq.create(faq, {
                include: [

                    { model: models.faqs_content }
                ],
                transaction
            });


            result = await getFaq({ id: result.id }, transaction);

            if (!trans) await transaction.commit();
            log.info(`End createFaq service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getMetaDataBySlugOrUrl: async(url, trans) => {
        log.info(`Start getMetaDataBySlugOrUrl service data:${JSON.stringify(url)}`)
        const transaction = trans ? trans : await sequelize.transaction();
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItSlug = await models.links.findOne({ where: { slug: slug }, transaction });

                if (isItSlug && isItSlug.original_link) {
                    metaData = await models.meta_data.findOne({ where: { url: isItSlug.original_link }, transaction });
                }
            }

            if (!trans) await transaction.commit();
            log.info(`End getMetaDataBySlugOrUrl service data:${JSON.stringify(metaData)}`)
            return metaData;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateFaq: async(faqId, faqData, bodyData, trans) => {
        log.info(`Start updateFaq service data:${JSON.stringify(faqId, faqData, bodyData, trans)}`)
        faqData.updated_at = Math.floor(new Date().getTime() / 1000);

        let transaction = null;
        let result = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();


            //delete old pages_content
            await models.faqs_content.destroy({ where: { faq_id: faqId }, transaction });
            //create new pages_content
            await models.faqs_content.bulkCreate(bodyData, { transaction });

            //update page
            await models.faq.update(faqData, { where: { id: faqId }, transaction });


            result = await getFaq(faqId, transaction);

            if (!trans) await transaction.commit();
            log.info(`End updateFaq service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getMetaDataByslugOrUrl: async(url, trans) => {
        log.info(`Start getMetaDataByslugOrUrl data:${JSON.stringify(url, trans)}`)
        const transaction = trans ? trans : await sequelize.transaction();
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItslug = await models.links.findOne({ where: { slug: slug }, transaction });

                if (isItslug && isItslug.link) {
                    metaData = await models.meta_data.findOne({ where: { url: isItslug.link }, transaction });
                }
            }

            if (!trans) await transaction.commit();
            log.info(`End getMetaDataByslugOrUrl data:${JSON.stringify(metaData)}`)
            return metaData;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    countFaqByParam:async(model)=>{
        log.info(`Start countFaqByParam data:${JSON.stringify(model)}`)
        try{
            let result = await sequelize.query(
                `select 
          SUM(CASE WHEN origin_id = 0 AND status != ${config.GLOBAL_STATUSES.DELETED}  THEN 1 ELSE 0 END) as  "all" ,
          SUM(CASE WHEN origin_id = 0 AND  status = ${config.GLOBAL_STATUSES.WAITING}  THEN 1 ELSE 0 END) as  "${config.GLOBAL_STATUSES.WAITING}",
          SUM(CASE WHEN origin_id = 0 AND status = ${config.GLOBAL_STATUSES.ACTIVE} THEN 1 ELSE 0 END) as "${config.GLOBAL_STATUSES.ACTIVE}",
          SUM(CASE WHEN  origin_id = 0 AND status = ${config.GLOBAL_STATUSES.DELETED} THEN 1 ELSE 0 END) as "${config.GLOBAL_STATUSES.DELETED}"
   from ${model} 
   `,{
                    nest: true,
                    type: Op.SELECT
                })
            log.info(`End countFaqByParam data:${JSON.stringify(result)}`)
            return result && result[0] ? result[0] : 0;
        }
        catch(err){
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getOriginFaqFormat: async(filter, trans) => {
        log.info(`Start getOriginFaqFormat service data:${JSON.stringify(filter, trans)}`)
        let transaction = trans ? trans : null;
        try {

            let post = await models.faq.findOne({
                where: filter,
                transaction,
                include: [
                    { model: models.faqs_content }
                ]
            });

            // page.meta_data = await postService.getMetaDataBySlagOrUrl(page.slag, transaction);
            log.info(`End getOriginPostFormat service data:${JSON.stringify(post)}`)
            return post;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getFaq: getFaq,

    getAllFaqs: async(lang,faqs) => {
        log.info(`Start getAllFaqs data:${JSON.stringify(lang)}`)
        let result =[]
        try {
            if(faqs && faqs.length){
                for(let item of faqs){
                    let category = await models.faq_category.findOne({where:{[Op.or]:[{id:item.category_id,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},{origin_id:item.category_id,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE}]},raw:true})
                    let faq = item.ids.map(i =>i.id)
                    faq = await models.faq.findAll({
                        where:{[Op.or]:[{id:{[Op.in]:faq},lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},{origin_id:{[Op.in]:faq},lang:lang,status:config.GLOBAL_STATUSES.ACTIVE}]},
                        include:[
                            {
                                model:models.faqs_content,
                                as:"first_comment"
                            }
                        ],
                    })
                    if(faq && faq.length){
                        faq = faq.map(i=>i.toJSON())
                        item = category
                        item.faq = faq
                        result.push(item)
                    }
                }
            }

            log.info(`End getAllFaqs data:${JSON.stringify(result)}`)
            return result;
        }catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    groupFaqs:async (faqs)=>{
        let result = []
        if(faqs && faqs.length){
            faqs = faqs.map(i=>i.toJSON())
            let types = Array.from(new Set(faqs.map(el => el.type )))
            types.forEach((el, index) =>{
                result[index] = faqs.filter(elem => elem.type == el )
            })
            faqs = result
        }
        return faqs
    },

    adminGetAllFaqs: async(filter, page, perPage, attributes) => {
        log.info(`Start adminGetAllFaqs data:${JSON.stringify(filter, page, perPage, attributes)}`)
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.faq.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,

            });
            if (result && result.rows && result.rows.length){
                let allFaqs = []
                result.rows = result.rows.map((item) => item.toJSON())

                for (let i of result.rows) {
                    let link = await linksService.getLinkByFilter({ original_link: `/getFaq/${i.id}` });
                    i.slug = link && link.slug ? link.slug : '';
                    let lang_change = await models.faq.findAll({
                        where: {

                            [Op.or]: [
                                { id: i.id },
                                { origin_id: i.id }
                            ]
                        },
                        attributes: ['id', 'origin_id', 'lang']
                    })
                    lang_change = lang_change.map(i => i.toJSON())
                    let change = {}
                    for (let id of lang_change) {
                        id.history = await models.admin_changes_history.findAll({
                            where: {

                                item_id: id.id,
                                type: "faq"
                            }
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    i.change = change
                    allFaqs.push(i)
                }
                result.rows = allFaqs
            }
            log.info(`End adminGetAllFaqs data:${JSON.stringify(result)}`)
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


    makeFaqFilter: async(body, whereObj) => {
        log.info(`Start makeFaqFilter data:${JSON.stringify(body, whereObj)}`)
        let arr = [];
        let sort;

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
                        [Op.and]: like
                    }
                });
            }
        }
        if(body.lang){
            arr.push({lang :body.lang})
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }else{
            arr.push({ status: config.GLOBAL_STATUSES.ACTIVE });
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;

            arr.push({ published_at: date });
        }
        if (body.sort) {
            if (body.sort.published_at) {
                sort = [
                    ['published_at', body.sort.published_at]
                ];
            }
        } else {
            sort = [
                ['published_at', 'DESC']
            ];
        }

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makeFaqFilter data:${JSON.stringify(filter)}`)
        return filter;
    },

    deleteFaqById: async(faqId, trans) => {
        log.info(`Start deleteFaqById data:${JSON.stringify(faqId, trans)}`)
        let transaction = null;
        let filter = faqId;
        // if (typeof faqId !== 'object') {
        //     filter = { id: faqId }
        // }
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.faqs_content.destroy({ where: { faq_id: filter }, transaction });
            let result = await models.faq.destroy({ where: { id: filter }, transaction });
            if (!trans) await transaction.commit();
            log.info(`End deleteFaqById data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deletePostToCategory: async(postId, trans) => {
        let transaction = null;
        let filter = postId;
        if (typeof postId !== 'object') {
            filter = { post_id: postId }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.post_to_category.destroy({ where: filter, transaction });
            if (!trans) await transaction.commit();

            return result;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deletePostBodyAndPostsImages: async(postId, trans) => {
        let transaction = null;
        let filter = postId;
        if (typeof postId !== 'object') {
            filter = { post_id: postId }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let postBodyIds = await models.posts_body.findAll({ where: filter, attributes: ['id'], transaction });
            postBodyIds = postBodyIds.map(i => { return i.id });
            //delete posts_body and posts_body_to_uploaded_images
            await models.posts_body.destroy({
                where: {
                    id: {
                        [Op.in]: postBodyIds
                    }
                },
                transaction
            });
            await models.posts_body_to_uploaded_images.destroy({
                where: {
                    posts_body_id: {
                        [Op.in]: postBodyIds
                    }
                },
                transaction
            });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updateFaqById: async(params, faq, trans) => {
        log.info(`Start updateFaqById service data:${JSON.stringify(params, faq, trans)}`)
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.faq.update(faq, { where: filter, transaction });
            let result = await models.faq.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End updateFaqById service data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },


    changePositionPost: async(posts, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of posts) {

                await models.posts.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }


            result = await models.posts.findAll({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                },
                order: [
                    ["position", "ASC"]
                ],
                transaction
            })
            // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },
    setPositionPosts: async() => {
        try {
            let result = await models.posts.findAll();

            for (let item of result) {
                await models.posts.update({ position: item.id }, { where: { id: item.id } })

            }
            return true

        } catch (err) {


        }
    },
    changePositionPosts: async(posts, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of posts) {

                await models.posts.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }


            result = await models.posts.findAll({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                },
                order: [
                    ["position", "ASC"]
                ],
                transaction
            })
            // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },

}
