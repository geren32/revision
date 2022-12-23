const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const adminServiceService = require('../services/admin.service.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { models } = require('../sequelize-orm');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const log = require('../utils/logger');
const {slugify} = require("transliteration");
const linksService = require("../services/links.service");
const extraUtil = require("../utils/extra-util");
const requestIp = require("request-ip");
const axios = require("axios");
const pagesService = require("../services/pages.service");
const adminPreviewService = require("../services/admin.preview.service");
const metaDataService = require("../services/meta-data.service");
const adminHistoryService = require("../services/admin-changes-history.service");



module.exports = {
    saveService: async(req, res) => {
        log.info(`Start saveService data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let user_id = req.userid ? req.userid : null
        let result
        let {id,status, not_show_dia, dont_send_to_court,description,options,title,price,count_price,image,position,type,constructor,service_category,update_all,sections,slug,meta_data,template_doc, template_hello_sign,image_prev,service_additional,service_country_pricing,additional_files,service_random_text} = req.body;
        if(type && type == 1 && !price){
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        if(constructor && typeof constructor[0] == 'object' && constructor.length){
            let no_register = true
            let no_address = true
            let no_pip = true
            let in_court = true
            let no_inn = true
            // let no_date = true
            for(let step of constructor){
                if(step && step.fields){
                    // let client_city
                    let client_address
                    let email_register
                    let phone_register
                    let first
                    let last
                    let sur
                    let client_inn
                    let client_passport
                    let is_court
                    // let client_date
                    for(let field of step.fields){
                        // if(field.required == true && field.client_address == true && field.type == 10)client_city = field
                        if(field.required == true && field.client_address == true && field.type == 9)client_address = field
                        if(field.required == true && field.for_registration == true && field.type == 2)phone_register = field
                        if(field.required == true && field.for_registration == true && field.type == 4)email_register = field
                        if(field.required == true && field.register_first == true && field.type == 1)first = field
                        if(field.required == true && field.register_last == true && field.type == 1)last = field
                        // if(field.required == true && field.register_sur == true && field.type == 1)sur = field
                        if(field.required == true && field.client_inn == true && field.type == 3)client_inn = field
                        if(field.required == true && field.client_passport == true && field.type == 1)client_passport = field
                        if(field.required == true && field.is_court == true && field.type == 9)is_court = field
                        // if(field.required == true && field.client_date == true && field.type == 12)client_date = field
                    }
                    if(
                        // client_city &&
                        client_address)no_address = false
                    if(email_register && phone_register)no_register = false
                    if(first && last
                        // && sur
                    )no_pip = false
                    if(is_court)in_court = false
                    // if(client_inn && client_passport)no_inn = false
                    // if(client_date)no_date = false
                }
        }
            if(no_address){
                return res.status(errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_ADDRESS_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_ADDRESS_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_ADDRESS_NOT_VALID.code,
                });
            }
            if(in_court){
                return res.status(errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_IS_COURT.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_IS_COURT.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_IS_COURT.code,
                });
            }
            if(no_register){
                return res.status(errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NOT_VALID.code,
                });
            }
            if(no_pip){
                return res.status(errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_PIP_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_PIP_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_PIP_NOT_VALID.code,
                });
            }
            // if(no_inn){
            //     return res.status(errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN.code).json({
            //         message: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN.message,
            //         errCode: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN.code,
            //     });
            // }
            // if(no_date){
            //     return res.status(errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN.code).json({
            //         message: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN.message,
            //         errCode: errors.BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN.code,
            //     });
            // }
        }
        const transaction = await sequelize.transaction();
        try {
            if(id){
                if (req.body && Object.keys(req.body).length === 2 && id && req.body.status && req.body.status != config.GLOBAL_STATUSES.DUPLICATE_POST) {
                    result = await adminServiceService.updateServiceStatus({[Op.or]:[{id:id},{origin_id:id}]}, { status: status },id,transaction);
                }else if(status && status == config.GLOBAL_STATUSES.DUPLICATE_POST){
                    if(slug){
                       slug = slug + '-' + Date.now();
                    }
                    let old_data = await adminServiceService.getService({id:id},transaction)
                    let data = {
                        status : config.GLOBAL_STATUSES.WAITING,
                        description : old_data.description ? old_data.description : null,
                        title:old_data.title,
                        price:old_data.price,
                        count_price : old_data.count_price,
                        image_id : old_data.image && old_data.image.id ? old_data.image.id : null,
                        informer : old_data.description ? old_data.description : null,
                        type : old_data.type,
                        template_doc :old_data.template_doc,
                        template_hello_sign : old_data.template_hello_sign,
                        image_prev_id : old_data.image_prev && old_data.image_prev.id ? old_data.image_prev.id : null,
                        options: old_data.options ? JSON.stringify(old_data.options) : null,
                        not_show_dia:  old_data.not_show_dia ?  old_data.not_show_dia: null,
                        dont_send_to_court :old_data.dont_send_to_court && old_data.dont_send_to_court == true? 2 :null,

                    }
                    let service_sections = extraUtil.convertServiceSectionsForDBFormat(old_data.sections);
                    if (service_sections.length) data.service_contents = service_sections;
                    constructor = old_data.constructor && old_data.constructor.length && typeof old_data.constructor[0] == 'object' ? old_data.constructor : []
                    result = await adminServiceService.createService(data,constructor,old_data.service_category,user_id,slug,old_data.meta_data,old_data.service_additional,old_data.service_country_pricing,old_data.additional_files,service_random_text,transaction)
                }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.WAITING,
                        description : description ? description : null,
                        title,
                        price,
                        count_price,
                        image_id : image && image.id ? image.id : null,
                        type,
                        template_doc,
                        template_hello_sign,
                        image_prev_id : image_prev && image_prev.id ? image_prev.id : null,
                        options:options ? JSON.stringify(options):null,
                        informer : description ? description : null,
                        not_show_dia:  not_show_dia ?  not_show_dia: null,
                        dont_send_to_court :dont_send_to_court && dont_send_to_court == true? 2 :null,
                    }
                    let service_sections = extraUtil.convertPageSectionsForDBFormat(sections);
                    if (service_sections.length) data.service_contents = service_sections;
                    result = await adminServiceService.updateService(id,lang,update_all,data,constructor,service_category,user_id,slug,meta_data,service_additional,service_country_pricing,additional_files,service_random_text,transaction)

                }
            }else{
                let data = {
                    status : status ? status : config.GLOBAL_STATUSES.WAITING,
                    description : description ? description : null,
                    title,
                    price,
                    count_price,
                    image_id : image && image.id ? image.id : null,
                    position,
                    informer : description ? description : null,
                    type,
                    template_doc,
                    template_hello_sign,
                    image_prev_id : image_prev && image_prev.id ? image_prev.id : null,
                    options: options ? JSON.stringify(options) : null,
                    not_show_dia:  not_show_dia ?  not_show_dia: null,
                    dont_send_to_court :dont_send_to_court && dont_send_to_court == true? 2 :null,

                }
                let service_sections = extraUtil.convertServiceSectionsForDBFormat(sections);
                if (service_sections.length) data.service_contents = service_sections;
                result = await adminServiceService.createService(data,constructor,service_category,user_id,slug,meta_data,service_additional,service_country_pricing,additional_files,transaction)

            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({type:'service', item_id: result.id},transaction);

            await transaction.commit();
            log.info(`End saveService data:${JSON.stringify(result)}`)
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
    getService:async (req,res)=>{
        log.info(`Start getService data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : config.LANGUAGES[0];
        const filter = {[Op.or]:[
                {id:id,lang:lang},
                {origin_id:id,lang:lang}
            ]};
        try {
            let service = await adminServiceService.getService(filter,null);
            if (!service) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            service.history = await adminChangesHistoryService.adminFindAllHistory({type:'service', item_id: service.id});

            log.info(`End getService data:${JSON.stringify(service)}`)


            return res.status(200).json(service);

        } catch (error) {
            log.error(error);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    getAllServices:async (req,res)=>{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;
        let calc = req.query.params
        const ip = requestIp.getClientIp(req)

        let ipCountry
            if(calc){
                ipCountry  = await axios({
                    method: 'get',
                    url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                })
                if(ipCountry)ipCountry = ipCountry.data
            }
        try {
            log.info(`Start get getAllTripsMini:`);
            let filter;
            let filterwhere
            let result = {}
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED },origin_id:0};
            }
            filter = await adminServiceService.makeServiceFilter(req.body, filterwhere);
            result = await adminServiceService.adminGetAllService(filter, page, perPage, false,calc);

            if(calc){
                if(result && result.rows && result.rows.length){
                    for(let item of result.rows){
                        if(item.service_country_pricing && item.service_country_pricing.length && ipCountry && ipCountry.country){
                            for(let country_price of item.service_country_pricing){
                                if(country_price.ip == ipCountry.country){
                                    item.price = country_price.price
                                }
                            }
                        }
                    }
                }
            }
            result.statusCount =  await adminServiceService.countServiceByParam(`service`);
            log.info(`End get getAllTripsMini:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    deleteServices:async (req,res)=>{
        let { ids } = req.body;
        let result = [];
        try {
            log.info(`Start delete deleteServices:${JSON.stringify(ids)}`);

            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    let service = await adminServiceService.getService({ id: id });
                    if (!service) {
                        result.push({ id: id, deleted: false, error: `Service not found with id:${id}` });
                    }
                    if (service && service.status === config.GLOBAL_STATUSES.DELETED) {
                        await adminServiceService.deleteService(id, transaction);
                        result.push({ id: id, deleted: true, error: false });
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'service' }, transaction);


                    } else {
                        await adminServiceService.updateServiceStatus( {[Op.or]:[{id:id},{origin_id:id}]},{ status: config.GLOBAL_STATUSES.DELETED },id, transaction);
                        service = await adminServiceService.getService({ id: id });
                        result.push({id:id,status:service.status,update:'status updated'});
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'service' }, transaction);
                    }
                }
                await transaction.commit();
            }

            log.info(`End delete deleteServices:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    previewService:async(req,res)=>{
        log.info(`Start createPagePreview data:${JSON.stringify(req.body)}`)
        let transaction = await sequelize.transaction();
        try {
            let {id,status, not_show_dia, dont_send_to_court,description,options,title,price,count_price,image,position,type,constructor,service_category,update_all,sections,slug,meta_data,template_doc,template_hello_sign,image_prev,service_additional,additional_files,service_country_pricing,service_random_text} = req.body;
            const languages = config.LANGUAGES;
            status = config.GLOBAL_STATUSES.ACTIVE;
            let originPage;
            if (!type) {
                return res.status(errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code).json({
                    message: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.message,
                    errCode: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code
                });

            }
            let getOriginPage = null
            if (id) {
                getOriginPage = await adminServiceService.getService({ id: id }, null, config.LANGUAGES[0]);
            }
            await adminServiceService.deletePreviewService();
                let pageData = {
                    preview: true,
                    status : status ? status : config.GLOBAL_STATUSES.WAITING,
                    description : description ? description : null,
                    title,
                    price,
                    count_price,
                    image_id : image && image.id ? image.id : null,
                    position,
                    informer : description ? description : null,
                    type,
                    template_doc,
                    template_hello_sign,
                    image_prev_id : image_prev && image_prev.id ? image_prev.id : null,
                    options: options ? JSON.stringify(options) : null,
                    not_show_dia:  not_show_dia ?  not_show_dia: null,
                    dont_send_to_court :dont_send_to_court && dont_send_to_court == true? 2 :null,
                };

                let service_sections = extraUtil.convertServiceSectionsForDBFormat(sections);
                if (service_sections.length) pageData.service_contents = service_sections;
                let page = await adminServiceService.createService(pageData,constructor,service_category,null,slug,meta_data,service_additional,service_country_pricing,additional_files,service_random_text,transaction)

            await transaction.commit();
            let result = {
                url: '/' + page.slug
            }
            log.info(`End createPagePreview data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    //CATEGORY

    getAllServiceCategory:async (req,res)=>{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;
        try {
            log.info(`Start get getAllServiceCategory:`);
            let filter;
            let filterwhere
            let result = {}
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED },origin_id:0};
            }
            filter = await adminServiceService.makeCategoryFilter(req.body, filterwhere);
            result = await adminServiceService.adminGetAllServiceCategory(filter, page, perPage, false);

            result.statusCount =  await adminServiceService.countServiceCategoryByParam(`service_category`);
            log.info(`End get getAllServiceCategory:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    saveServiceCategory:async (req,res)=>{
        log.info(`Start saveServiceCategory data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let user_id = req.userid ? req.userid : null
        let result
        let {id,status,title,image,position,sections,slug,meta_data,updated_all} = req.body;
        if (!title && Object.keys(req.body).length != 2) {
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        const transaction = await sequelize.transaction();
        try {
            if(id){
                if (req.body && Object.keys(req.body).length === 2 && id && req.body.status) {
                    result = await adminServiceService.updateServiceCategoryStatus({[Op.or]:[{id:id},{origin_id:id}]}, { status: status },id,transaction);
                }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.WAITING,
                        title,
                        image_id : image && image.id ? image.id : null,
                    }
                    let category_sections = extraUtil.convertPageSectionsForDBFormat(sections);
                    if (category_sections.length) data.service_contents = category_sections;
                    result = await adminServiceService.updateServiceCategory(id,lang,data,updated_all,user_id,slug,meta_data,transaction)
                }
            }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.WAITING,
                        title,
                        image_id : image && image.id ? image.id : null,
                        position,
                    }
                    let category_sections = extraUtil.convertPageSectionsForDBFormat(sections);
                    if (category_sections.length) data.service_category_contents = category_sections;
                    result = await adminServiceService.createServiceCategory(data,user_id,slug,meta_data,transaction)

            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({type:'service_category', item_id: result.id},transaction);

            await transaction.commit();
            log.info(`End saveServiceCategory data:${JSON.stringify(result)}`)
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
    getServiceCategory:async (req,res)=>{
        log.info(`Start getServiceCategory data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : config.LANGUAGES[0];
        const filter = {[Op.or]:[
                {id:id,lang:lang},
                {origin_id:id,lang:lang}
            ]};
        try {
            let service = await adminServiceService.getServiceCategory(filter,null);
            if (!service) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            service.history = await adminChangesHistoryService.adminFindAllHistory({type:'service_category', item_id: service.id});

            log.info(`End getServiceCategory data:${JSON.stringify(service)}`)


            return res.status(200).json(service);

        } catch (error) {
            log.error(error);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    deleteServiceCategory:async (req,res)=>{
        let { ids } = req.body;
        let result = [];
        try {
            log.info(`Start delete deleteServiceCategory:${JSON.stringify(ids)}`);

            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    let service = await adminServiceService.getServiceCategory({ id: id });
                    if (!service) {
                        result.push({ id: id, deleted: false, error: `Service Category not found with id:${id}` });
                    }
                    if (service && service.status === config.GLOBAL_STATUSES.DELETED) {
                        await adminServiceService.deleteServiceCategory(id, transaction);
                        result.push({ id: id, deleted: true, error: false });
                    } else {
                        await adminServiceService.updateServiceCategoryStatus( {[Op.or]:[{id:id},{origin_id:id}]},{ status: config.GLOBAL_STATUSES.DELETED },id, transaction);
                        service = await adminServiceService.getServiceCategory({ id: id });
                        result.push({id:id,status:service.status,update:'status updated'});
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'service_category' }, transaction);
                    }
                }
                await transaction.commit();
            }

            log.info(`End delete deleteServiceCategory:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    //COURTS
    saveCourt:async (req,res)=>{
        log.info(`Start saveServiceCategory data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let user_id = req.userid ? req.userid : null
        let result
        let {id,status,title,city,regions,price,email,address} = req.body;
        if (req.body && Object.keys(req.body).length === 2 && id && req.body.status) {
            if (!id || !status) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
            }
        }else{
            if (!price || !title || !city || !regions ||!email || !address) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
            }
        }
        if(regions && regions.length){
            let text
            for(let i=0; i < regions.length;i++){
                if(i == 0){
                    text = regions[i]
                }else{
                    text = text +',' + regions[i]
                }
            }
            regions = text
        }
        const transaction = await sequelize.transaction();
        try {
            if(id){
                if (req.body && Object.keys(req.body).length === 2 && id && req.body.status) {
                    result = await adminServiceService.updateCourtStatus({[Op.or]:[{id:id},{origin_id:id}]}, { status: status },id,transaction);
                }else{
                    let data = {
                        status : status ? status : config.GLOBAL_STATUSES.ACTIVE,
                        title,
                        regions,
                        city,
                        price,
                        email,
                        address
                    }
                    result = await adminServiceService.updateCourt(id,lang,data,user_id,transaction)
                }
            }else{
                let data = {
                    status : status ? status : config.GLOBAL_STATUSES.ACTIVE,
                    title,
                    regions,
                    city,
                    price,
                    email,
                    address
                }
                result = await adminServiceService.createCourt(data,user_id,transaction)

            }
            result.history = await adminChangesHistoryService.adminFindAllHistory({type:'courts', item_id: result.id},transaction);

            await transaction.commit();
            log.info(`End saveServiceCategory data:${JSON.stringify(result)}`)
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
    getCourt:async (req,res)=>{
        log.info(`Start getCourt data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : config.LANGUAGES[0];
        const filter = {[Op.or]:[
                {id:id,lang:lang},
                {origin_id:id,lang:lang}
            ]};
        try {
            let service = await adminServiceService.getCourt(filter,null);
            if (!service) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            service.history = await adminChangesHistoryService.adminFindAllHistory({type:'courts', item_id: service.id});

            log.info(`End getCourt data:${JSON.stringify(service)}`)


            return res.status(200).json(service);

        } catch (error) {
            log.error(error);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    getAllCourts:async (req,res)=>{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;
        try {
            log.info(`Start get getAllCourts:`);
            let filter;
            let filterwhere
            let result = {}
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED },origin_id:0};
            }
            filter = await adminServiceService.makeCourtsFilter(req.body, filterwhere);
            result = await adminServiceService.adminGetAllCourts(filter, page, perPage, false);

            result.statusCount =  await adminServiceService.countServiceByParam(`courts`);
            log.info(`End get getAllCourts:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(JSON.stringify(error));
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    deleteCourts:async (req,res)=>{
        let { ids } = req.body;
        let result = [];
        try {
            log.info(`Start delete deleteCourts:${JSON.stringify(ids)}`);

            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    let service = await adminServiceService.getCourt({ id: id },transaction);
                    if (!service) {
                        result.push({ id: id, deleted: false, error: `Court not found with id:${id}` });
                    }
                    if (service && service.status === config.GLOBAL_STATUSES.DELETED) {
                        await adminServiceService.deleteCourt(id, transaction);
                        result.push({ id: id, deleted: true, error: false });
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'courts' }, transaction);


                    } else {
                        await adminServiceService.updateCourtStatus( {[Op.or]:[{id:id},{origin_id:id}]},{ status: config.GLOBAL_STATUSES.DELETED },id, transaction);
                        service = await adminServiceService.getCourt({ id: id },transaction);
                        result.push({id:id,status:service.status,update:'status updated'});
                        await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid ? req.userid : null, type: 'courts' }, transaction);
                    }
                }
                await transaction.commit();
            }
            log.info(`End delete deleteCourts:${JSON.stringify(result)}`);
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
