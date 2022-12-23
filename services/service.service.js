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

async function getService (filter, trans) {
    log.info(`Start function getService:${JSON.stringify(filter)}`);
    let transaction = trans ? trans : null;
    try {
        let service = await models.service.findOne({
            where: filter,
            order:[[models.service_form,'step','ASC'],[models.service_form,models.service_form_field,'position','ASC']],
            include:[
                {
                    model:models.service_form,
                    include:[
                        {
                            model:models.service_form_field,
                            // as:"fields"
                        },
                        {
                            model:models.uploaded_files,
                            as:"image"
                        }
                    ]
                },
                {
                    model:models.service_category,
                    as: "service_category",
                    through:{attributes:[]}
                },
                {
                    model:models.uploaded_files,
                    as:"image"
                }
            ],
            transaction
        });
        if(service){
            service = service ? service.toJSON() : null;

            service.service_country_pricing = await models.service_country_pricing.findAll({where:{service_id:service.id},raw:true,transaction})


            if (service.service_category && service.service_category.length){
                service.service_category = service.service_category[0]
            }else{
                service.service_category = null
            }
            if(service.service_forms && service.service_forms.length){
                service.constructor  = service.service_forms
                delete (service.service_forms)
                for(let item of service.constructor){
                    if(item.service_form_fields && item.service_form_fields.length){
                        item.fields = item.service_form_fields
                        delete (item.service_form_fields)
                    }
                }
            }
            let service_contents = await models.service_content.findAll({
                where: { service_id: service.id },
                order: [
                    ["sequence_number", "ASC"]
                ],
                include: [
                    { model: models.uploaded_files, as: 'block_image' },
                ],
                transaction
            });
            if (service_contents && service_contents.length) service_contents = service_contents.map(i => i.toJSON());
            service.sections = await extraUtil.convertPageSectionsForFrontendFormat(service_contents,service.lang);
            service.meta_data = await postService.getMetaDataByslugOrUrl(`/shop/getService/${service.id}`, transaction);
            let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service', service.id, 'service', service.lang),lang:service.lang });
            if (link)service.slug = link.slug;
        }
        log.info(`End function getService:${JSON.stringify(service)}`);
        if (!trans && transaction) await transaction.commit();
        return service;
    } catch (err) {
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }

}
async function getCategory(filter,trans){
    log.info(`Start getPage service data:${JSON.stringify(filter)}`)
    let transaction = trans ? trans : null;
    try {

        let page = await models.service_category.findOne({
            where: filter,
            include:[
                {
                    model:models.uploaded_files,
                    as:"image"
                }
            ],
            transaction
        });
        page = page ? page.toJSON() : page;
        if (page && page.id) {
            let pages_contents = await models.service_category_content.findAll({
                where: { service_category_id: page.id },
                order: [
                    ["sequence_number", "ASC"]
                ],
                include: [
                    { model: models.uploaded_files, as: 'block_image' },
                ],
                transaction
            });
            if (pages_contents && pages_contents.length) pages_contents = pages_contents.map(i => i.toJSON());
            page.sections = await extraUtil.convertPageSectionsForFrontendFormat(pages_contents, page.lang);
            page.meta_data = await postService.getMetaDataByslugOrUrl(`/getPage/${page.id}`, transaction);
        }
        log.info(`End getPage service data:${JSON.stringify(page)}`)
        return page;
    } catch (err) {
        log.error(err)
        if (transaction && !trans) await transaction.rollback();
        err.code = 400;
        throw err;
    }
}


module.exports = {
    getService:getService,
    getCategory:getCategory,

    getAllLinksByServices:async(id)=>{
        log.info(`Start function getAllLinksByServices:${JSON.stringify(id)}`);
        let result
        try {
            let service = await models.service.findOne({where:{id:id},raw:true})
            if(service){
                let filter_id
                if(service.origin_id == '0'){
                    filter_id = service.id
                }else{
                    filter_id = service.origin_id
                }
                let services = await models.service.findAll({where:{[Op.or]:[{id:filter_id},{origin_id:filter_id}]},raw:true})
                if(services && services.length){
                    services = services.map(i=> `/shop/getService/${i.id}`)
                    result = await models.links.findAll({where:{original_link:{[Op.in]:services}},raw:true})
                }
            }
            log.info(`End function getAllLinksByServices:${JSON.stringify(result)}`);
            return result
        }catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getAllLinksByServicesCategory:async(id)=>{
        log.info(`Start function getAllLinksByServices:${JSON.stringify(id)}`);
        let result
        try {
            let service = await models.service_category.findOne({where:{id:id},raw:true})
            if(service){
                let filter_id
                if(service.origin_id == '0'){
                    filter_id = service.id
                }else{
                    filter_id = service.origin_id
                }
                let services = await models.service_category.findAll({where:{[Op.or]:[{id:filter_id},{origin_id:filter_id}]},raw:true})
                if(services && services.length){
                    services = services.map(i=> `/shop/getServiceCategory/${i.id}`)
                    result = await models.links.findAll({where:{original_link:{[Op.in]:services}},raw:true})
                }
            }
            log.info(`End function getAllLinksByServices:${JSON.stringify(result)}`);
            return result
        }catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getAllCategoryServices:async (page,perPage,cat_id,lang,search,ipCountry)=>{
        log.info(`Start function getAllLinksByServices:${JSON.stringify(cat_id)}`);
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let filter = {
                lang:lang
            }
            if(search){
                let searchField = search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({ [Op.like]: `%${item}%` });
                    });
                     filter.title = { [Op.or]:{[Op.like]: `%${search}%`}}
                }
            }
            let result = await models.service.findAndCountAll({
                where: filter,
                offset: offset,
                limit: limit,
                order: [['position','DESC']],
                distinct:true,
                include:[
                    {
                        model:models.service_category,
                        as: "service_category",
                        through:{attributes:[]},
                        where:{id:cat_id}
                    },
                    {
                        model:models.uploaded_files,
                        as:"image_prev"
                    },
                ],
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                for(let item of result.rows){
                    item.service_country_pricing = await models.service_country_pricing.findAll({where:{service_id:item.id},raw:true})
                    item.link = await models.links.findOne({where:{original_link:`/shop/getService/${item.id}`},raw:true})
                    if(item.link)item.link = item.link.slug
                    if(item.service_country_pricing && item.service_country_pricing.length && ipCountry && ipCountry.country){
                        for(let country_price of item.service_country_pricing){
                            if(country_price.ip == ipCountry.country){
                                item.price = country_price.price
                            }
                        }
                    }
                }
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
    getAllActiveCategory:async (filter)=>{
        let result=[]
           let categories = await models.service_category.findAll(
            {
                where:filter,
                raw:true
            }
        )
        if(categories && categories.length){
            for(let item of categories){
                item.countService = await models.service_to_category.findOne({where:{service_category_id:item.id},raw:true})
                if(item.countService){
                    item.link = await models.links.findOne({where:{
                            original_link:`/shop/getServiceCategory/${item.id}`
                        },
                        raw:true
                    })
                    if(item.link)item.link = item.link.slug
                    result.push(item)
                }

            }
        }
        return result
    }
}
