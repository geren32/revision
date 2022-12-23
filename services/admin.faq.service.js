const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const log = require("../utils/logger");
const config = require('../configs/config');
const {Op} = require("sequelize");
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const extraUtil = require("../utils/extra-util");
const postService = require("./post.service");
const {slugify} = require("transliteration");
const linksService = require("./links.service");
const metaDataService = require("./meta-data.service");
const pagesService = require("./pages.service");
const errors = require("../configs/errors");

async function getReview(filter,trans){
    log.info(`Start function getReview:${JSON.stringify(filter)}`);
    let transaction = trans ? trans : null;
    try {
        let review = await models.reviews.findOne({
            where: filter,
            include:[
                {
                    model:models.uploaded_files,
                    as:"icon"
                },
                {
                    model:models.uploaded_files,
                    as:"user_image"
                }
            ],
            transaction
        });
        if(review){
            review = review ? review.toJSON() : null;
        }
        log.info(`End function getReview:${JSON.stringify(review)}`);
        if (!trans && transaction) await transaction.commit();
        return review;
    } catch (err) {
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }
}
async function getFaqCategory(filter,trans){
    log.info(`Start function getFaqCategory:${JSON.stringify(filter)}`);
    let transaction = trans ? trans : null;
    try {
        let review = await models.faq_category.findOne({
            where: filter,
            transaction
        });
        if(review){
            review = review ? review.toJSON() : null;
        }
        log.info(`End function getFaqCategory:${JSON.stringify(review)}`);
        if (!trans && transaction) await transaction.commit();
        return review;
    } catch (err) {
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }
}
async function getFaq(filter,trans){
    log.info(`Start function getFaq:${JSON.stringify(filter)}`);
    let transaction = trans ? trans : null;
    try {
        let review = await models.faq.findOne({
            where: filter,
            transaction
        });
        if(review){
            if(review.type){
                review.type = await models.faq_category.findOne({where:{id:review.type},raw:true,transaction})
            }
            review = review ? review.toJSON() : null;
            let faq_contents = await models.faqs_content.findOne({
                where: {faq_id: review.id },
                transaction
            });
            if(faq_contents){
                review.comment = faq_contents.text
            }
        }
        log.info(`End function getFaq:${JSON.stringify(review)}`);
        if (!trans && transaction) await transaction.commit();
        return review;
    } catch (err) {
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }
}

module.exports = {
    getReview:getReview,
    getFaq:getFaq,
    getFaqCategory:getFaqCategory,

    makeFaqFilter: async (body, whereObj,lang) => {
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({
                    [Op.or]: [
                        { title: { [Op.or]:{[Op.like]: `%${body.search}%`}}},

                    ]
                });
            }
        }
        if(body.status ){
            if(body.status != 'all'){
                arr.push({status:body.status})
            }
        }else{
            arr.push({status:config.GLOBAL_STATUSES.ACTIVE})

        }
        if(lang){
            arr.push({lang:lang})
        }
        if(body.category_id){
            let services = await models.service.findAll({
                attributes:['id'],
                include:[
                    {
                        model:models.service_category,
                        attributes:['id'],
                        as: "service_category",
                        through:{attributes:[]},
                        where:{id:body.category_id}
                    }
                ]
            })
            services = services.map(i => i.id)
            arr.push({id:{[Op.in]:services}})
        }
        if(body.type){
            arr.push({type:body.type})
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at],[models.trip_points_mini, 'position', 'ASC']];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }
        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] }};

        return filter;
    },
    adminGetAllFaq: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.faq.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                distinct:true,
                include:[
                    {
                        model:models.faqs_content,
                        as:"first_comment"
                    }
                ],
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                for(let item of result.rows){
                    if(item.type){
                        item.type = await models.faq_category.findOne({where:{id:item.type},raw:true})
                    }
                }
                // result.rows = await extraUtil.checkUpdateLangByObject(result.rows,models.service,'faq')
            }

            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(JSON.stringify(err));
            err.code = 400;
            throw err;
        }
    },
    adminGetAllFaqCategory: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.faq_category.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                distinct:true,
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                for(let item of result.rows){
                    item.count_faq = await models.faq.count({where:{type:item.id,origin_id:0}})
                }
                // result.rows = await extraUtil.checkUpdateLangByObject(result.rows,models.service,'faq')
            }

            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(JSON.stringify(err));
            err.code = 400;
            throw err;
        }
    },
    adminGetAllReviews: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.reviews.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                include:[
                    {
                        model:models.uploaded_files,
                        as:"icon"
                    },
                ]
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                result.rows = await extraUtil.checkUpdateLangByObject(result.rows,models.reviews,'reviews')
            }
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(JSON.stringify(err));
            err.code = 400;
            throw err;
        }
    },

    countFaqByParam: async (model) => {
        let result = await sequelize.query(
            `select
       SUM(CASE WHEN  status != ${config.GLOBAL_STATUSES.DELETED} AND origin_id = 0  THEN 1 ELSE 0 END) as  "all" ,
       SUM(CASE WHEN  status = ${config.GLOBAL_STATUSES.ACTIVE} AND origin_id = 0 THEN 1 ELSE 0 END) as  "${config.GLOBAL_STATUSES.ACTIVE}",
       SUM(CASE WHEN  status = ${config.GLOBAL_STATUSES.WAITING} AND origin_id = 0 THEN 1 ELSE 0 END) as  "${config.GLOBAL_STATUSES.WAITING}",
       SUM(CASE WHEN  status = ${config.GLOBAL_STATUSES.DELETED} AND origin_id = 0 THEN 1 ELSE 0 END) as "${config.GLOBAL_STATUSES.DELETED}"
from ${model}
`,{
                nest: true,
                type: Op.SELECT
            })
        return result && result[0] ? result[0] : 0;
    },
    countReviewByParam: async (model) => {
        let result = await sequelize.query(
            `select
       SUM(CASE WHEN  status != ${config.GLOBAL_STATUSES.DELETED} AND origin_id = 0 THEN 1 ELSE 0 END) as  "all" ,
       SUM(CASE WHEN  status = ${config.GLOBAL_STATUSES.ACTIVE} AND origin_id = 0  THEN 1 ELSE 0 END) as  "${config.GLOBAL_STATUSES.ACTIVE}",
       SUM(CASE WHEN  status = ${config.GLOBAL_STATUSES.WAITING} AND origin_id = 0  THEN 1 ELSE 0 END) as  "${config.GLOBAL_STATUSES.WAITING}",
       SUM(CASE WHEN  status = ${config.GLOBAL_STATUSES.DELETED} AND origin_id = 0  THEN 1 ELSE 0 END) as "${config.GLOBAL_STATUSES.DELETED}"
from ${model}
`,{
                nest: true,
                type: Op.SELECT
            })
        return result && result[0] ? result[0] : 0;
    },
    createFaq: async (data,user_id,comment,trans) => {
        let transaction = null;
        let languages = config.LANGUAGES;

        try {
            log.info(
                `Start createFaq. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let origin_data = data
            origin_data.origin_id = 0
            origin_data.lang = 'uk'
            let result = await models.faq.create(origin_data, {
                transaction
            })
            if(comment){
                await models.faqs_content.create({faq_id:result.id,text:comment},{transaction})
            }
            await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: user_id, type: 'faq' }, transaction);

            data.origin_id = result.id
            for(let lang of languages){
                if(lang != 'uk'){
                    data.lang = lang
                    let double_service =  await models.faq.create(data, {
                        transaction
                    })
                    if(comment){
                        await models.faqs_content.create({faq_id:double_service.id,text:comment},{transaction})
                    }
                    await adminChangesHistoryService.adminCreateHistory({ item_id: double_service.id, user_id: user_id, type: 'faq' }, transaction);
                }
            }

            result = getFaq({id:result.id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createFaq. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    createReview: async (data,user_id,trans) => {
        let transaction = null;
        let languages = config.LANGUAGES;

        try {
            log.info(
                `Start createReview. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let origin_data = data
            origin_data.origin_id = 0
            origin_data.lang = 'uk'
            let result = await models.reviews.create(origin_data, {
                transaction
            })
            await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: user_id, type: 'reviews' }, transaction);

            data.origin_id = result.id
            for(let lang of languages){
                if(lang != 'uk'){
                    data.lang = lang
                    let double_service =  await models.reviews.create(data, {
                        transaction
                    })
                    await adminChangesHistoryService.adminCreateHistory({ item_id: double_service.id, user_id: user_id, type: 'reviews' }, transaction);
                }
            }

            result = getReview({id:result.id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createReview. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    createFaqCategory: async (data,user_id,trans) => {
        let transaction = null;
        let languages = config.LANGUAGES;

        try {
            log.info(
                `Start createFaqCategory. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let origin_data = data
            origin_data.origin_id = 0
            origin_data.lang = 'uk'
            let result = await models.faq_category.create(origin_data, {
                transaction
            })
            await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: user_id, type: 'faq_category' }, transaction);

            data.origin_id = result.id
            for(let lang of languages){
                if(lang != 'uk'){
                    data.lang = lang
                    let double_service =  await models.faq_category.create(data, {
                        transaction
                    })
                    await adminChangesHistoryService.adminCreateHistory({ item_id: double_service.id, user_id: user_id, type: 'faq_category' }, transaction);
                }
            }

            result = getFaqCategory({id:result.id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createFaqCategory. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateReview: async (id,lang,data,user_id,trans) => {
        let transaction = null;

        try {
            log.info(
                `Start updateReview. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.reviews.update(data,
                {
                    where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},
                    transaction
                })
            await models.reviews.update({status:data.status,user_image_id:data.user_image_id,icon_id:data.icon_id},{where:{[Op.or]:[{id:id},{origin_id:id}]},transaction})
            result = await getReview({[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},transaction)
            await adminChangesHistoryService.adminCreateHistory({ item_id:result.id, user_id: user_id, type: 'reviews' }, transaction);
            if (!trans) await transaction.commit();

            log.info(
                `End updateReview. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateFaqCategory: async (id,lang,data,user_id,trans) => {
        let transaction = null;

        try {
            log.info(
                `Start updateFaqCategory. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.faq_category.update(data,
                {
                    where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},
                    transaction
                })
            await models.faq_category.update({status:data.status},{where:{[Op.or]:[{id:id},{origin_id:id}]},transaction})
            result = await getReview({[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},transaction)
            await adminChangesHistoryService.adminCreateHistory({ item_id:result.id, user_id: user_id, type: 'faq_category' }, transaction);
            if (!trans) await transaction.commit();

            log.info(
                `End updateFaqCategory. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateFaq: async (id,lang,data,user_id,comment,trans) => {
        let transaction = null;

        try {
            log.info(
                `Start updateFaq. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.faq.update(data,
                {
                    where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},
                    transaction
                })
            await models.faq.update({status:data.status,type:data.type,published_at:data.published_at},{where:{[Op.or]:[{id:id},{origin_id:id}]},transaction})
            result = await getFaq({[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},transaction)
            await models.faqs_content.destroy({where:{faq_id:result.id},transaction})
            if(comment){
                await models.faqs_content.create({faq_id:result.id,text:comment},{transaction})
            }
            await adminChangesHistoryService.adminCreateHistory({ item_id:result.id, user_id: user_id, type: 'faq' }, transaction);
            result = await getFaq({[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},transaction)
            if (!trans) await transaction.commit();

            log.info(
                `End updateFaq. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateReviewStatus:async (filter,data,id,trans)=>{
        let transaction = null;
        let result
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.reviews.update(data,{where:filter,transaction})

            result = await getReview({id:id},transaction)
            return result
        }catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateFaqCategoryStatus:async (filter,data,id,trans)=>{
        let transaction = null;
        let result
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.faq_category.update(data,{where:filter,transaction})

            result = await getFaqCategory({id:id},transaction)
            return result
        }catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateFaqStatus:async (filter,data,id,trans)=>{
        let transaction = null;
        let result
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.faq.update(data,{where:filter,transaction})

            result = await getFaq({id:id},transaction)
            return result
        }catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteReview:async (id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let services_ids = await models.reviews.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true,transaction})
            if(services_ids)services_ids = services_ids.map(i=>i.id)

            await models.reviews.destroy({where:{id:{[Op.in]:services_ids}},transaction})
            await models.admin_changes_history.destroy({where:{item_id:{[Op.in]:services_ids},type:'reviews'},transaction})
            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            log.error(JSON.stringify(err));
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteFaqCategory:async (id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let services_ids = await models.faq_category.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true,transaction})
            if(services_ids)services_ids = services_ids.map(i=>i.id)

            await models.faq_category.destroy({where:{id:{[Op.in]:services_ids}},transaction})
            await models.admin_changes_history.destroy({where:{item_id:{[Op.in]:services_ids},type:'faq_category'},transaction})
            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            log.error(JSON.stringify(err));
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteFaq:async (id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let services_ids = await models.faq.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true,transaction})
            if(services_ids)services_ids = services_ids.map(i=>i.id)

            await models.faq.destroy({where:{id:{[Op.in]:services_ids}},transaction})
            await models.faqs_content.destroy({where:{faq_id:{[Op.in]:services_ids}},transaction})
            await models.admin_changes_history.destroy({where:{item_id:{[Op.in]:services_ids},type:'faq'},transaction})
            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            log.error(JSON.stringify(err));
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

}
