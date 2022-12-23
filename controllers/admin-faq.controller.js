const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const adminFaqService = require('../services/admin.faq.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { models } = require('../sequelize-orm');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const log = require('../utils/logger');
const {slugify} = require("transliteration");
const linksService = require("../services/links.service");
const extraUtil = require("../utils/extra-util");
const adminServiceService = require("../services/admin.service.service");



module.exports = {
    getAllFaq:async (req,res)=>{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;
        let lang = req.query.lang ? req.query.lang : 'uk';
        try {
            log.info(`Start get getAllFaq:`);
            let filter;
            let filterwhere
            let result = {}
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }};
            }
            filter = await adminFaqService.makeFaqFilter(req.body, filterwhere,lang);
            result = await adminFaqService.adminGetAllFaq(filter, page, perPage, false);

            result.statusCount =  await adminFaqService.countFaqByParam(`faq`);
            log.info(`End get getAllFaq:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getAllFaqCategory:async (req,res)=>{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;
        let lang = req.query.lang ? req.query.lang : 'uk';
        try {
            log.info(`Start get getAllFaqCategory:`);
            let filter;
            let filterwhere
            let result = {}
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }};
            }
            filter = await adminFaqService.makeFaqFilter(req.body, filterwhere,lang);
            result = await adminFaqService.adminGetAllFaqCategory(filter, page, perPage, false);

            result.statusCount =  await adminFaqService.countFaqByParam(`faq_category`);
            log.info(`End get getAllFaqCategory:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    saveFaq:async (req,res)=>{
        log.info(`Start saveFaq data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let user_id = req.userid ? req.userid : null
        let result
        let {id,status,title,position,type,published_at,sections,comment} = req.body;
        if (!title || !type) {
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        const transaction = await sequelize.transaction();
        try {
            if(id){
                if (req.body && Object.keys(req.body).length === 2 && id && req.body.status) {
                    result = await adminFaqService.updateFaqStatus({[Op.or]:[{id:id},{origin_id:id}]}, { status: status },id,transaction);
                }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.ACTIVE,
                        title,
                        type : type && type.id ? type.id :null,
                        position,
                        published_at
                    }
                    result = await adminFaqService.updateFaq(id,lang,data,user_id,comment,transaction)
                }
            }else{
                let data = {
                    status : status ? status : config.GLOBAL_STATUSES.WAITING,
                    title,
                    type : type && type.id ? type.id :null,
                    position,
                    published_at
                }
                result = await adminFaqService.createFaq(data,user_id,comment,transaction)

            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({type:'faq', item_id: result.id},transaction);
            await transaction.commit();
            log.info(`End saveFaq data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getFaq:async (req,res)=>{
        log.info(`Start getFaq data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : config.LANGUAGES[0];
        const filter = {[Op.or]:[
                {id:id,lang:lang},
                {origin_id:id,lang:lang}
            ]};
        try {
            let service = await adminFaqService.getFaq(filter,null);
            if (!service) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            service.history = await adminChangesHistoryService.adminFindAllHistory({type:'faq', item_id: service.id});

            log.info(`End getFaq data:${JSON.stringify(service)}`)
            return res.status(200).json(service);

        } catch (error) {
            log.error(error);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    deleteFaq:async (req,res)=>{
        let { ids } = req.body;
        let result = [];
        try {
            log.info(`Start delete deleteFaq:${JSON.stringify(ids)}`);

            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    let service = await adminFaqService.getFaq({ id: id },transaction);
                    if (!service) {
                        result.push({ id: id, deleted: false, error: `Faq not found with id:${id}` });
                    }
                    if (service && service.status === config.GLOBAL_STATUSES.DELETED) {
                        await adminFaqService.deleteFaq(id, transaction);
                        result.push({ id: id, deleted: true, error: false });
                    } else {
                        await adminFaqService.updateFaqStatus({[Op.or]:[{id:id},{origin_id:id}]},{ status: config.GLOBAL_STATUSES.DELETED },id, transaction);
                        service = await adminFaqService.getFaq({ id: id },transaction);
                        result.push({id:id,status:service.status,update:'status updated'});
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'faq' }, transaction);

                    }
                }
                await transaction.commit();
            }

            log.info(`End delete deleteFaq:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getAllReview:async (req,res)=>{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;
        let lang = req.query.lang ? req.query.lang : 'uk'
        try {
            log.info(`Start get getAllFaq:`);
            let filter;
            let filterwhere
            let result = {}
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }};
            }
            filter = await adminFaqService.makeFaqFilter(req.body, filterwhere,lang);
            result = await adminFaqService.adminGetAllReviews(filter, page, perPage, false);

            result.statusCount =  await adminFaqService.countReviewByParam(`reviews`);
            log.info(`End get getAllFaq:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    saveReview:async (req,res)=>{
        log.info(`Start saveReview data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let user_id = req.userid ? req.userid : null
        let result
        let {id,status,icon,user_image,user_name,comment,link,phone,contact_type} = req.body;
        if (!user_name || !comment) {
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        const transaction = await sequelize.transaction();
        try {
            if(id){
                if (req.body && Object.keys(req.body).length === 2 && id && req.body.status) {
                    result = await adminFaqService.updateReviewStatus({[Op.or]:[{id:id},{origin_id:id}]}, { status: status },id,transaction);
                }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.ACTIVE,
                        icon_id:icon && icon.id ? icon.id :null,
                        user_image_id: user_image && user_image.id ? user_image.id :null,
                        user_name,
                        comment,
                        link: link ? link:null,
                        phone: phone? phone :null,
                        contact_type : contact_type ? contact_type :null
                    }
                    result = await adminFaqService.updateReview(id,lang,data,user_id,transaction)
                }
            }else{
                let data = {
                    status : status ? status : config.GLOBAL_STATUSES.WAITING,
                    icon_id:icon && icon.id ? icon.id :null,
                    user_image_id: user_image && user_image.id ? user_image.id :null,
                    user_name,
                    comment,
                    link: link ? link:null,
                    phone: phone ? phone:null,
                    contact_type : contact_type ? contact_type :null
                }
                result = await adminFaqService.createReview(data,user_id,transaction)

            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({type:'reviews', item_id: result.id},transaction);
            await transaction.commit();
            log.info(`End saveReview data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    saveFaqCategory:async (req,res)=>{
        log.info(`Start saveFaqCategory data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let user_id = req.userid ? req.userid : null
        let result
        let {id,status,title,position} = req.body;
        if (req.body && Object.keys(req.body).length !== 2 && id && req.body.status) {
            if (!title) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
            }
        }
        const transaction = await sequelize.transaction();
        try {
            if(id){
                if (req.body && Object.keys(req.body).length === 2 && id && req.body.status) {
                    result = await adminFaqService.updateFaqCategoryStatus({[Op.or]:[{id:id},{origin_id:id}]}, { status: status },id,transaction);
                }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.ACTIVE,
                        title:title,
                        position:position ? position : 0,
                    }
                    result = await adminFaqService.updateFaqCategory(id,lang,data,user_id,transaction)
                }
            }else{
                let data = {
                    status : status ? status : config.GLOBAL_STATUSES.WAITING,
                    position:position ? position : 0,
                    title:title,
                }
                result = await adminFaqService.createFaqCategory(data,user_id,transaction)

            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({type:'faq_category', item_id: result.id},transaction);
            await transaction.commit();
            log.info(`End saveFaqCategory data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getReview:async (req,res)=>{
        log.info(`Start getReview data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : config.LANGUAGES[0];
        const filter = {[Op.or]:[
                {id:id,lang:lang},
                {origin_id:id,lang:lang}
            ]};
        try {
            let service = await adminFaqService.getReview(filter,null);
            if (!service) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            service.history = await adminChangesHistoryService.adminFindAllHistory({type:'reviews', item_id: service.id});

            log.info(`End getReview data:${JSON.stringify(service)}`)
            return res.status(200).json(service);

        } catch (error) {
            log.error(error);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    getFaqCategory:async (req,res)=>{
        log.info(`Start getReview data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : config.LANGUAGES[0];
        const filter = {[Op.or]:[
                {id:id,lang:lang},
                {origin_id:id,lang:lang}
            ]};
        try {
            let service = await adminFaqService.getFaqCategory(filter,null);
            if (!service) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            service.history = await adminChangesHistoryService.adminFindAllHistory({type:'faq_category', item_id: service.id});

            log.info(`End getReview data:${JSON.stringify(service)}`)
            return res.status(200).json(service);

        } catch (error) {
            log.error(error);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    deleteReviews:async (req,res)=>{
        let { ids } = req.body;
        let result = [];
        try {
            log.info(`Start delete deleteReviews:${JSON.stringify(ids)}`);

            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    let service = await adminFaqService.getReview({ id: id },transaction);
                    if (!service) {
                        result.push({ id: id, deleted: false, error: `Review not found with id:${id}` });
                    }
                    if (service && service.status === config.GLOBAL_STATUSES.DELETED) {
                        await adminFaqService.deleteReview(id, transaction);
                        result.push({ id: id, deleted: true, error: false });
                    } else {
                        await adminFaqService.updateReviewStatus({[Op.or]:[{id:id},{origin_id:id}]},{ status: config.GLOBAL_STATUSES.DELETED },id, transaction);
                        service = await adminFaqService.getReview({ id: id },transaction);
                        result.push({id:id,status:service.status,update:'status updated'});
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'reviews' }, transaction);

                    }
                }
                await transaction.commit();
            }

            log.info(`End delete deleteReviews:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    deleteFaqCategory:async (req,res)=>{
        let { ids } = req.body;
        let result = [];
        try {
            log.info(`Start delete deleteFaqCategory:${JSON.stringify(ids)}`);

            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    let service = await adminFaqService.getFaqCategory({ id: id },transaction);
                    if (!service) {
                        result.push({ id: id, deleted: false, error: `Review not found with id:${id}` });
                    }
                    if (service && service.status === config.GLOBAL_STATUSES.DELETED) {
                        await adminFaqService.deleteFaqCategory(id, transaction);
                        result.push({ id: id, deleted: true, error: false });
                    } else {
                        await adminFaqService.updateFaqCategoryStatus({[Op.or]:[{id:id},{origin_id:id}]},{ status: config.GLOBAL_STATUSES.DELETED },id, transaction);
                        service = await adminFaqService.getFaqCategory({ id: id },transaction);
                        result.push({id:id,status:service.status,update:'status updated'});
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'faq_category' }, transaction);

                    }
                }
                await transaction.commit();
            }

            log.info(`End delete deleteFaqCategory:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
}
