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
const adminServiceService = require("./admin.service.service");

async function getCourt(filter,trans){
    log.info(`Start function getCourt:${JSON.stringify(filter)}`);
    let transaction = trans ? trans : null;
    try {
        let court = await models.courts.findOne({
            where: filter,
            transaction
        });
        if(court){
            court = court ? court.toJSON() : null;
            court.regions = court.regions ? court.regions.split(','):null;
        }
        log.info(`End function getCourt:${JSON.stringify(court)}`);
        if (!trans && transaction) await transaction.commit();
        return court;
    } catch (err) {
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }
}

async function getServiceCategory(filter,trans){
    log.info(`Start function getServiceCategory:${JSON.stringify(filter)}`);
    let transaction = trans ? trans : null;
    try {
        let service_category = await models.service_category.findOne({
            where: filter,
            // order:[[models.service_form,'step','ASC'],[models.service_form,models.service_form_field,'position','ASC']],
            include:[
                {
                    model:models.uploaded_files,
                    as:"image"
                }
            ],
            transaction
        });
        if(service_category){
            service_category = service_category ? service_category.toJSON() : null;

            let service_contents = await models.service_category_content.findAll({
                where: { service_category_id: service_category.id },
                order: [
                    ["sequence_number", "ASC"]
                ],
                include: [
                    { model: models.uploaded_files, as: 'block_image' },
                ],
                transaction
            });
            if (service_contents && service_contents.length) service_contents = service_contents.map(i => i.toJSON());
            service_category.sections = await extraUtil.convertPageSectionsForFrontendFormat(service_contents,service_category.lang);
            service_category.meta_data = await postService.getMetaDataByslugOrUrl(`/shop/getServiceCategory/${service_category.id}`, transaction);
            let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service_category', service_category.id, 'service_category', service_category.lang),lang:service_category.lang });
            if (link)service_category.slug = link.slug;
        }
        log.info(`End function getServiceCategory:${JSON.stringify(service_category)}`);
        if (!trans && transaction) await transaction.commit();
        return service_category;
    } catch (err) {
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }
}

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
                },
                {
                    model:models.uploaded_files,
                    as:"image_prev"
                },
            ],
            transaction
        });
        if(service){
            service = service ? service.toJSON() : null;
            service.options = service.options ? JSON.parse(service.options) : null;
            service.service_additional = await models.service_additional.findAll({where:{service_id:service.id},raw:true,transaction})
            if(service.service_additional && service.service_additional.length){
                for(let additional of service.service_additional){
                    additional.service_country_pricing = await models.service_additional_country_pricing.findAll({where:{service_id:additional.id},raw:true,transaction})
                }
            }
            service.service_random_text = await models.service_random_text.findAll({where:{service_id:service.id},raw:true,transaction})
            service.additional_files = await models.service_additional_files.findAll({where:{service_id:service.id},raw:true,transaction})
            service.service_country_pricing = await models.service_country_pricing.findAll({where:{service_id:service.id},raw:true,transaction})
            if (service.service_category && service.service_category.length){
                // service.service_category = service.service_category[0]
            }else{
                service.service_category = null
            }
            service.dont_send_to_court = service.dont_send_to_court && service.dont_send_to_court == 2 ? true :false;
            if(service.service_forms && service.service_forms.length){
                service.constructor  = service.service_forms
                delete (service.service_forms)
                for(let item of service.constructor){
                    if(item.service_form_fields && item.service_form_fields.length){
                        for(let field of item.service_form_fields){
                            if(field.required && field.required == 2){
                                field.required = true
                            }else{
                                field.required = false
                            }
                            if(field.for_registration && field.for_registration == 2){
                                field.for_registration = true
                            }else{
                                field.for_registration = false
                            }
                            if(field.client_address && field.client_address == 2){
                                field.client_address = true
                            }else{
                                field.client_address = false
                            }
                            if(field.register_first && field.register_first == 2){
                                field.register_first = true
                            }else{
                                field.register_first = false
                            }
                            if(field.register_last && field.register_last == 2){
                                field.register_last = true
                            }else{
                                field.register_last = false
                            }
                            if(field.register_sur && field.register_sur == 2){
                                field.register_sur = true
                            }else{
                                field.register_sur = false
                            }
                            if(field.client_inn && field.client_inn == 2){
                                field.client_inn = true
                            }else{
                                field.client_inn = false
                            }
                            if(field.client_passport && field.client_passport == 2){
                                field.client_passport = true
                            }else{
                                field.client_passport = false
                            }
                            if(field.client_date && field.client_date == 2){
                                field.client_date = true
                            }else{
                                field.client_date = false
                            }
                            if(field.client_index && field.client_index == 2){
                                field.client_index = true
                            }else{
                                field.client_index = false
                            }
                            if(field.is_defendant && field.is_defendant == 2){
                                field.is_defendant = true
                            }else{
                                field.is_defendant = false
                            }
                            if(field.is_court && field.is_court == 2){
                                field.is_court = true
                            }else{
                                field.is_court = false
                            }
                            if(field.doc_1){
                                field.doc_1 = JSON.parse(field.doc_1)
                            }
                            if(field.doc_2){
                                field.doc_2 = JSON.parse(field.doc_2)
                            }
                        }
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
            let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service', service.id, 'service', service.lang),lang:service.lang },transaction);
            if (link)service.slug = link.slug;
        }
        log.info(`End function getService:${JSON.stringify(service)}`);
        if (!trans && transaction) await transaction.commit();
        return service;
    } catch (err) {
        console.log(err,'546554754785685635656')
        if (transaction && !trans) await transaction.rollback();
        log.error(`${err}`);
        err.code = 400;
        throw err;
    }

}


module.exports = {


    getService:getService,
    getServiceCategory:getServiceCategory,
    getCourt:getCourt,

    deletePreviewService: async() => {
        log.info(`Start deletePreviewService service`)
        try {
            let result = [];
            let ids = await models.service.findAll({
                where:{
                    preview: {
                        [Op.ne]: null
                    }
                },
                raw:true
            });
            if (ids && ids.length) {
                const transaction = await sequelize.transaction();
                for (let id of ids) {
                    await adminServiceService.deleteService(id, transaction);
                    result.push({ id: id, deleted: true, error: false });
                }
                await transaction.commit();
            }
            log.info(`End deletePreviewService service data: ${JSON.stringify(result)}`)
            return result;

        } catch (error) {
            log.error(error)
            throw new Error(error);
        }
    },

    createService: async (data,constructor,service_category,user_id,slug,meta_data,service_additional,service_country_pricing,additional_files,service_random_text,trans) => {
        let transaction = null;
        let languages = config.LANGUAGES;

        try {
            log.info(
                `Start createService. Params: ${JSON.stringify({data,constructor,service_category})}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            let position
            if(!data.position){
                let last_position = await models.service.findOne({order:[["position","DESC"]],attributes:['position'],raw:true},transaction)
                if(last_position){
                    data.position = last_position.position + 1
                    position = data.position
                }
            }
            let origin_data = data
            origin_data.origin_id = 0
            origin_data.lang = 'uk'
            let result = await models.service.create(origin_data, {
                include: [
                    { model: models.service_content }
                ],
                transaction
            })
            await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: user_id, type: 'service' }, transaction);

            let currentSlug;
            if (!slug) {
                // transliterate
                currentSlug = slugify(result.title);
                let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, Lang:result.lang }, transaction);
                let localSlug = currentSlug
                let i = 1
                while (checkSlag) {
                    localSlug = currentSlug
                    localSlug = localSlug + "-" + i
                    checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:result.lang }, transaction);
                    i++
                }
                currentSlug = localSlug
            } else {
                let checkSlag = await linksService.getLinkByFilter({ slug, Lang:result.lang }, transaction);
                let localSlug = slug
                let i = 1
                while (checkSlag) {
                    localSlug = slug
                    localSlug = localSlug + "-" + i
                    checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:result.lang }, transaction);
                    i++
                }
                slug = localSlug
                currentSlug = slug
            }
            let url = await extraUtil.generateLinkUrlForPage("service", result.id, 'service', result.lang);
            let linkData = {
                slug: currentSlug,
                original_link: await extraUtil.generateLinkUrlForPage("service", result.id, 'service', result.lang),
                type: 'service',
                lang:result.lang
            };
            let link = await linksService.createLink(linkData, transaction);
            if (link) result.slug = link.slug;
            let metaData;
            if (meta_data) {
                metaData = {
                    url: url,
                }
            }

            if(meta_data.meta_title){
                metaData.meta_title = meta_data.meta_title;
            } else  metaData.meta_title = result.title
            if(meta_data.meta_desc) {
                metaData.meta_desc = meta_data.meta_desc;
            } else metaData.meta_desc = null

            if (meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
            if (meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;

            if (metaData) result.meta_data = await metaDataService.createMetaData(metaData, transaction);


            if(service_country_pricing && service_country_pricing.length){
                for(let item of service_country_pricing){
                    let country_price_data = {
                        service_id:result.id,
                        ip:item.ip,
                        price:item.price
                    }
                    await models.service_country_pricing.create(country_price_data,{transaction})
                }
            }
            if(additional_files && additional_files.length){
                for(let item of additional_files){
                    let additional_file_data={
                        service_id:result.id,
                        title:item.title,
                        tag:item.tag
                    }
                    await models.service_additional_files.create(additional_file_data,{transaction})
                }
            }
            if(service_random_text && service_random_text.length){
                for(let item of service_random_text){
                    let random_data ={
                        service_id :result.id,
                        text:item.text
                    }
                    await models.service_random_text.create(random_data,{transaction})
                }
            }
            if(service_category && service_category.id){
                await models.service_to_category.create({
                    service_id:result.id,
                    service_category_id:service_category.id
                },{transaction})
            }
            if(constructor && constructor.length){
                let form
                let i = 0
                for(let item of constructor){
                    i++
                    let form_data={
                        service_id:result.id,
                        title:item.title,
                        lang:result.lang,
                        origin_id : 0,
                        status:item.status ? item.status : config.GLOBAL_STATUSES.ACTIVE,
                        image_id:item.image && item.image.id ? item.image.id : null,
                        type:item.type ? item.type : 1,
                        required:item.required ? item.required :2,
                        step:item.step ? item.step : i,
                    }
                    form = await models.service_form.create(form_data,{transaction})
                    let pos = 0
                    if(item.fields && item.fields.length){
                        for (let field of item.fields){
                            pos++
                            let form_field_data={
                                title:field.title,
                                name_field:field.name_field,
                                type:field.type,
                                required: field.required ? 2 : 1,
                                service_form_id:form.id,
                                position:field.position ? field.position : pos,
                                placeholder:field.placeholder ? field.placeholder : (field.title ? field.title : field.name_field),
                                width: field.width ? field.width : 'big',
                                for_registration: field.for_registration ? 2 : 1,
                                client_address: field.client_address ? 2 :1,
                                register_first: field.register_first ? 2 :1,
                                register_last: field.register_last ? 2 :1,
                                register_sur: field.register_sur ? 2 :1,
                                client_inn :field.client_inn ? 2 : 1,
                                client_passport:field.client_passport ? 2 : 1,
                                client_date:field.client_date ? 2 : 1,
                                maxlength: field.maxlength ? field.maxlength :null,
                                hint: field.hint ? field.hint :null,
                                child_name_field: field.child_name_field ? field.child_name_field :null,
                                doc_1 : field.doc_1 ? JSON.stringify(field.doc_1):null,
                                doc_2 : field.doc_2 ? JSON.stringify(field.doc_2):null,
                                is_defendant : field.is_defendant ? 2 : 1,
                                is_court: field.is_court ? 2 : 1,
                            }
                            await models.service_form_field.create(form_field_data,{transaction})
                        }
                    }
                }
            }
            if(service_additional && service_additional.length){
                for(let item of service_additional){
                    let additional_data ={
                        service_id:result.id,
                        title:item.title,
                        price:item.price,
                        template_doc:item.template_doc
                    }
                    let additional_object = await models.service_additional.create(additional_data,{transaction})
                    if(item.service_country_pricing && item.service_country_pricing.length){
                        for(let price_additional of item.service_country_pricing){
                            let additional_data_pricing={
                                service_id:additional_object.id,
                                ip:price_additional.ip,
                                price:price_additional.price
                            }
                            await models.service_additional_country_pricing.create(additional_data_pricing,{transaction})
                        }
                    }
                }
            }
            data.origin_id = result.id
            for(let lang of languages){
                if(lang != 'uk'){
                    data.lang = lang
                    data.position = position
                   let double_service =  await models.service.create(data, {
                       include: [
                           { model: models.service_content }
                       ],
                       transaction
                   })
                    let currentSlug_double;
                    if (!slug) {
                        // transliterate
                        currentSlug_double = slugify(double_service.title);
                        let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug_double, Lang:double_service.lang }, transaction);
                        let localSlug = currentSlug_double
                        let i = 1
                        while (checkSlag) {
                            localSlug = currentSlug_double
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:double_service.lang }, transaction);
                            i++
                        }
                        currentSlug_double = localSlug
                    } else {
                        let checkSlag = await linksService.getLinkByFilter({ slug, Lang:double_service.lang }, transaction);
                        let localSlug = slug
                        let i = 1
                        while (checkSlag) {
                            localSlug = slug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:double_service.lang }, transaction);
                            i++
                        }
                        slug = localSlug
                        currentSlug_double = slug
                    }
                     url = await extraUtil.generateLinkUrlForPage("service", double_service.id, 'service', double_service.lang);
                     linkData = {
                        slug: currentSlug_double,
                        original_link: await extraUtil.generateLinkUrlForPage("service", double_service.id, 'service', double_service.lang),
                        type: 'service',
                        lang:double_service.lang
                    };
                     link = await linksService.createLink(linkData, transaction);
                    if (link) result.slug = link.slug;
                    if (meta_data) {
                        metaData = {
                            url: url,
                        }
                    }


                    if(meta_data.meta_title){
                        metaData.meta_title = meta_data.meta_title;
                    } else  metaData.meta_title = double_service.title
                    if(meta_data.meta_desc) {
                        metaData.meta_desc = meta_data.meta_desc;
                    } else metaData.meta_desc = null

                    if (meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                    if (meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;

                    if (metaData) double_service.meta_data = await metaDataService.createMetaData(metaData, transaction);




                    await adminChangesHistoryService.adminCreateHistory({ item_id: double_service.id, user_id: user_id, type: 'service' }, transaction);
                    if(service_category && service_category.id){
                        await models.service_to_category.create({
                            service_id:double_service.id,
                            service_category_id:service_category.id
                        },{transaction})
                    }
                    if(constructor && constructor.length){
                        let form
                        let i = 0
                        for(let item of constructor){
                            i++
                            let form_data={
                                service_id:double_service.id,
                                title:item.title,
                                lang:double_service.lang,
                                origin_id : 0,
                                status:item.status ? item.status : config.GLOBAL_STATUSES.ACTIVE,
                                image_id:item.image && item.image.id ? item.image.id : null,
                                type:item.type ? item.type : 1,
                                required:item.required ? item.required :2,
                                step:item.step ? item.step : i,
                            }
                            form = await models.service_form.create(form_data,{transaction})
                            if(item.fields && item.fields.length){
                                let pos = 0
                                for (let field of item.fields){
                                    pos++
                                    let form_field_data={
                                        title:field.title,
                                        name_field:field.name_field,
                                        type:field.type,
                                        required: field.required ? 2 : 1,
                                        service_form_id:form.id,
                                        position:field.position ? field.position : pos,
                                        placeholder:field.placeholder ? field.placeholder : (field.title ? field.title : field.name_field),
                                        width: field.width ? field.width : 'big',
                                        for_registration: field.for_registration ? 2 : 1,
                                        client_address: field.client_address ? 2 :1,
                                        register_first: field.register_first ? 2 :1,
                                        register_last: field.register_last ? 2 :1,
                                        register_sur: field.register_sur ? 2 :1,
                                        client_inn :field.client_inn ? 2 : 1,
                                        client_passport:field.client_passport ? 2 : 1,
                                        client_date:field.client_date ? 2 : 1,
                                        maxlength: field.maxlength ? field.maxlength :null,
                                        hint: field.hint ? field.hint :null,
                                        child_name_field: field.child_name_field ? field.child_name_field :null,
                                        doc_1 : field.doc_1 ? JSON.stringify(field.doc_1):null,
                                        doc_2 : field.doc_2 ? JSON.stringify(field.doc_2):null,
                                        is_defendant : field.is_defendant ? 2 : 1,
                                        is_court: field.is_court ? 2 : 1,
                                    }
                                    await models.service_form_field.create(form_field_data,{transaction})
                                }
                            }
                        }
                    }
                    if(service_random_text && service_random_text.length){
                        for(let item of service_random_text){
                            let random_data ={
                                service_id :double_service.id,
                                text:item.text
                            }
                            await models.service_random_text.create(random_data,{transaction})
                        }
                    }
                    if(service_country_pricing && service_country_pricing.length){
                        for(let item of service_country_pricing){
                            let country_price_data = {
                                service_id:double_service.id,
                                ip:item.ip,
                                price:item.price
                            }
                            await models.service_country_pricing.create(country_price_data,{transaction})
                        }
                    }
                    if(additional_files && additional_files.length){
                        for(let item of additional_files){
                            let additional_file_data={
                                service_id:double_service.id,
                                title:item.title,
                                tag:item.tag
                            }
                            await models.service_additional_files.create(additional_file_data,{transaction})
                        }
                    }
                    if(service_additional && service_additional.length){
                        for(let item of service_additional){
                            let additional_data ={
                                service_id:double_service.id,
                                title:item.title,
                                price:item.price,
                                template_doc:item.template_doc
                            }
                            let additional_object = await models.service_additional.create(additional_data,{transaction})
                            if(item.service_country_pricing && item.service_country_pricing.length){
                                for(let price_additional of item.service_country_pricing){
                                    let additional_data_pricing={
                                        service_id:additional_object.id,
                                        ip:price_additional.ip,
                                        price:price_additional.price
                                    }
                                    await models.service_additional_country_pricing.create(additional_data_pricing,{transaction})
                                }
                            }
                        }
                    }
                }

            }
            result = getService({id:result.id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createService. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateCourtStatus:async (filter,data,id,trans)=>{
        let transaction = null;
        let result
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.courts.update(data,{where:filter,transaction})

            result = await getCourt({id:id},transaction)
            return result
        }catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateServiceStatus:async (filter,data,id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.service.update(data,{where:filter,transaction})

            let result = await getService({id:id},transaction)
            return result
        }catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateServiceCategoryStatus:async (filter,data,id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.service_category.update(data,{where:filter,transaction})

            let result = await getServiceCategory({id:id},transaction)
            return result
        }catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    createServiceCategory: async (data,user_id,slug,meta_data,trans) => {
        let transaction = null;
        let languages = config.LANGUAGES;

        try {
            log.info(
                `Start createServiceCategory. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            let position
            if(!data.position){
                let last_position = await models.service_category.findOne({order:[["position","DESC"]],attributes:['position'],raw:true},transaction)
                if(last_position){
                    data.position = last_position.position + 1
                    position = data.position
                }
            }
            let origin_data = data
            origin_data.origin_id = 0
            origin_data.lang = 'uk'
            let result = await models.service_category.create(origin_data, {
                include: [
                    { model: models.service_category_content }
                ],
                transaction
            })
            await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: user_id, type: 'service_category' }, transaction);

            let currentSlug;
            if (!slug) {
                // transliterate
                currentSlug = slugify(result.title);
                let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, Lang:result.lang }, transaction);
                let localSlug = currentSlug
                let i = 1
                while (checkSlag) {
                    localSlug = currentSlug
                    localSlug = localSlug + "-" + i
                    checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:result.lang }, transaction);
                    i++
                }
                currentSlug = localSlug
            } else {
                let checkSlag = await linksService.getLinkByFilter({ slug, Lang:result.lang }, transaction);
                let localSlug = slug
                let i = 1
                while (checkSlag) {
                    localSlug = slug
                    localSlug = localSlug + "-" + i
                    checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:result.lang }, transaction);
                    i++
                }
                slug = localSlug
                currentSlug = slug
            }
            let url = await extraUtil.generateLinkUrlForPage("service_category", result.id, 'service_category', result.lang);
            let linkData = {
                slug: currentSlug,
                original_link: await extraUtil.generateLinkUrlForPage("service_category", result.id, 'service_category', result.lang),
                type: 'service_category',
                lang:result.lang
            };
            let link = await linksService.createLink(linkData, transaction);
            if (link) result.slug = link.slug;
            let metaData;
            if (meta_data) {
                metaData = {
                    url: url,
                }
            }

            if(meta_data.meta_title){
                metaData.meta_title = meta_data.meta_title;
            } else  metaData.meta_title = result.title
            if(meta_data.meta_desc) {
                metaData.meta_desc = meta_data.meta_desc;
            } else metaData.meta_desc = null

            if (meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
            if (meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;

            if (metaData) result.meta_data = await metaDataService.createMetaData(metaData, transaction);

            data.origin_id = result.id
            for(let lang of languages){
                if(lang != 'uk'){
                    data.lang = lang
                    data.position = position
                    let double_service =  await models.service_category.create(data, {
                        include: [
                            { model: models.service_category_content }
                        ],
                        transaction
                    })
                    let currentSlug_double;
                    if (!slug) {
                        // transliterate
                        currentSlug_double = slugify(double_service.title);
                        let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug_double, Lang:double_service.lang }, transaction);
                        let localSlug = currentSlug_double
                        let i = 1
                        while (checkSlag) {
                            localSlug = currentSlug_double
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:double_service.lang }, transaction);
                            i++
                        }
                        currentSlug_double = localSlug
                    } else {
                        let checkSlag = await linksService.getLinkByFilter({ slug, Lang:double_service.lang }, transaction);
                        let localSlug = slug
                        let i = 1
                        while (checkSlag) {
                            localSlug = slug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({ slug: localSlug, Lang:double_service.lang }, transaction);
                            i++
                        }
                        slug = localSlug
                        currentSlug_double = slug
                    }
                    url = await extraUtil.generateLinkUrlForPage("service_category", double_service.id, 'service_category', double_service.lang);
                    linkData = {
                        slug: currentSlug_double,
                        original_link: await extraUtil.generateLinkUrlForPage("service_category", double_service.id, 'service_category', double_service.lang),
                        type: 'service_category',
                        lang:double_service.lang
                    };
                    link = await linksService.createLink(linkData, transaction);
                    if (link) result.slug = link.slug;
                    if (meta_data) {
                        metaData = {
                            url: url,
                        }
                    }


                    if(meta_data.meta_title){
                        metaData.meta_title = meta_data.meta_title;
                    } else  metaData.meta_title = double_service.title
                    if(meta_data.meta_desc) {
                        metaData.meta_desc = meta_data.meta_desc;
                    } else metaData.meta_desc = null

                    if (meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                    if (meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;

                    if (metaData) double_service.meta_data = await metaDataService.createMetaData(metaData, transaction);

                    await adminChangesHistoryService.adminCreateHistory({ item_id: double_service.id, user_id: user_id, type: 'service_category' }, transaction);
                }

            }
            result = getServiceCategory({id:result.id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createServiceCategory. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    createCourt: async (data,user_id,trans) => {
        let transaction = null;
        let languages = config.LANGUAGES;

        try {
            log.info(
                `Start createCourt. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let origin_data = data
            origin_data.origin_id = 0
            origin_data.lang = 'uk'
            let result = await models.courts.create(origin_data, {
                transaction
            })
            await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: user_id, type: 'courts' }, transaction);

            data.origin_id = result.id
            for(let lang of languages){
                if(lang != 'uk'){
                    data.lang = lang
                    let double_service =  await models.courts.create(data, {
                        transaction
                    })
                    await adminChangesHistoryService.adminCreateHistory({ item_id: double_service.id, user_id: user_id, type: 'courts' }, transaction);
                }

            }
            result = getCourt({id:result.id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createCourt. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateCourt: async (id,lang,data,user_id,trans) => {
        let transaction = null;

        try {
            log.info(
                `Start createCourt. Params: ${JSON.stringify({data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.courts.update(data,
                {
                where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},
                transaction
            })
            await models.courts.update({status:data.status,price:data.price},{where:{[Op.or]:[{id:id},{origin_id:id}]},transaction})
            await adminChangesHistoryService.adminCreateHistory({ item_id:id, user_id: user_id, type: 'courts' }, transaction);

            result = getCourt({id:id},transaction)

            if (!trans) await transaction.commit();

            log.info(
                `End createCourt. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateService:async (id,lang,update_all,data,constructor,service_category,user_id,slug,meta_data,service_additional,service_country_pricing,additional_files,service_random_text,trans)=>{
        let transaction = null;
        let languages = config.LANGUAGES;
        let result
        let services = await models.service.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true})
        let services_ids = services.map(i=>i.id)
        try {
            log.info(
                `Start updateService. Params: ${JSON.stringify({id,lang,data,constructor,service_category})}`
            );
            let additional_files_ids = [];
            if(additional_files && additional_files.length) {
                additional_files_ids = additional_files.map(item => item.id);
            }
            transaction = trans ? trans : await sequelize.transaction();
            if(update_all){
                await models.service.update(data,{where:{id:{[Op.in]:services_ids}},transaction})
                await models.service_content.destroy({where:{service_id:{[Op.in]:services_ids}}})
                await models.service_to_category.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
                await models.service_additional.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
                await models.service_country_pricing.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
                await models.service_additional_files.destroy({where:{service_id:{[Op.in]:services_ids},id:{[Op.notIn]:additional_files_ids}},transaction})
                await models.service_random_text.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})

                let form_ids = await models.service_form.findAll({where:{service_id:{[Op.in]:services_ids}},raw:true,transaction})
                let additional_services = await models.service_additional.findAll({where:{service_id:{[Op.in]:services_ids}},raw:true,transaction})
                additional_services = additional_services.map(i=>i.id)
                form_ids = form_ids.map(i => i.id)
                await models.service_form.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
                await models.service_form_field.destroy({where:{service_form_id:{[Op.in]:form_ids}},transaction})
                await models.service_additional_country_pricing.destroy({where:{service_id:{[Op.in]:additional_services}},raw:true})
                for(let i of services){
                    await adminChangesHistoryService.adminCreateHistory({ item_id: i.id, user_id: user_id, type: 'service' }, transaction);
                    if(service_category && service_category.id){
                        await models.service_to_category.create({
                            service_id:i.id,
                            service_category_id:service_category.id
                        },{transaction})
                    }
                    if(service_country_pricing && service_country_pricing.length){
                        for(let item of service_country_pricing){
                            let country_price_data = {
                                service_id:i.id,
                                ip:item.ip,
                                price:item.price

                            }
                            await models.service_country_pricing.create(country_price_data,{transaction})
                        }
                    }
                    if(service_random_text && service_random_text.length){
                        for(let item of service_random_text){
                            let random_data ={
                                service_id :i.id,
                                text:item.text
                            }
                            await models.service_random_text.create(random_data,{transaction})
                        }
                    }
                    if(service_additional && service_additional.length){
                        for(let item of service_additional){
                            let additional_data ={
                                service_id:i.id,
                                title:item.title,
                                price:item.price,
                                template_doc:item.template_doc
                            }
                            let additional_object = await models.service_additional.create(additional_data,{transaction})
                            if(item.service_country_pricing && item.service_country_pricing.length){
                                for(let price_additional of item.service_country_pricing){
                                    let additional_data_pricing={
                                        service_id:additional_object.id,
                                        ip:price_additional.ip,
                                        price:price_additional.price
                                    }
                                    await models.service_additional_country_pricing.create(additional_data_pricing,{transaction})
                                }
                            }
                        }
                    }
                    if(additional_files && additional_files.length){
                        for(let item of additional_files){
                            if(!item.id) {
                                let additional_file_data={
                                    service_id:i.id,
                                    title:item.title,
                                    tag:item.tag
                                }
                                await models.service_additional_files.create(additional_file_data,{transaction})
                            } else {
                                let additional_file_data = {
                                    title:item.title,
                                    tag:item.tag
                                }
                                await models.service_additional_files.update(additional_file_data, {where: {id: item.id}, transaction});
                            }
                        }
                    }
                    if(constructor && constructor.length){
                        let form
                        let a = 0
                        for(let item of constructor){
                            a++
                            let form_data={
                                service_id:i.id,
                                title:item.title,
                                lang:i.lang,
                                origin_id : 0,
                                status:item.status ? item.status : config.GLOBAL_STATUSES.ACTIVE,
                                image_id:item.image && item.image.id ? item.image.id : null,
                                type:item.type ? item.type : 1,
                                required:item.required ? item.required :2,
                                step:item.step ? item.step : a,

                            }
                            form = await models.service_form.create(form_data,{transaction})
                            if(item.fields && item.fields.length){
                                let pos = 0
                                for (let field of item.fields){
                                    pos++
                                    let form_field_data={
                                        title:field.title,
                                        name_field:field.name_field,
                                        type:field.type,
                                        required: field.required ? 2 : 1,
                                        service_form_id:form.id,
                                        position:field.position ? field.position : pos,
                                        placeholder:field.placeholder ? field.placeholder : (field.title ? field.title : field.name_field),
                                        width: field.width ? field.width : 'big',
                                        for_registration: field.for_registration ? 2 : 1,
                                        client_address: field.client_address ? 2 :1,
                                        register_first: field.register_first ? 2 :1,
                                        register_last: field.register_last ? 2 :1,
                                        register_sur: field.register_sur ? 2 :1,
                                        client_inn :field.client_inn ? 2 : 1,
                                        client_passport:field.client_passport ? 2 : 1,
                                        client_date:field.client_date ? 2 : 1,
                                        maxlength: field.maxlength ? field.maxlength :null,
                                        hint: field.hint ? field.hint :null,
                                        child_name_field: field.child_name_field ? field.child_name_field :null,
                                        doc_1 : field.doc_1 ? JSON.stringify(field.doc_1):null,
                                        doc_2 : field.doc_2 ? JSON.stringify(field.doc_2):null,
                                        is_defendant : field.is_defendant ? 2 : 1,
                                        is_court: field.is_court ? 2 : 1,
                                    }
                                    await models.service_form_field.create(form_field_data,{transaction})
                                }
                            }
                        }
                    }
                    if(data.service_contents && data.service_contents.length){
                        for(let content of data.service_contents){
                            content.service_id = i.id
                        }
                        await models.service_content.bulkCreate(data.service_contents,{transaction})
                    }


                    let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service', i.id, 'service', i.lang),lang:i.lang }, transaction);
                    const linkslug = link && link.slug ? link.slug : null;

                    if (!slug) {
                        // transliterate
                        slug = slugify(data.title);
                        let checkSlag = await linksService.getLinkByFilter({slug: slug,lang:i.lang}, transaction);
                        let localSlug = slug
                        let a = 1
                        while(checkSlag){
                            localSlug = slug
                            localSlug = localSlug + "-" + a
                            checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang:i.lang}, transaction);
                            a++
                        }
                        slug = localSlug


                    } else {
                        let checkSlag = await linksService.getAllLinks({ slug, lang:i.lang }, transaction);
                        if (checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                        if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {
                            await transaction.rollback();
                            throw new Error
                        }
                    }


                    let metaData = {};

                    if(meta_data.meta_title){
                        metaData.meta_title = meta_data.meta_title;
                    } else  metaData.meta_title = data.title
                    if(meta_data.meta_desc) {
                        metaData.meta_desc = meta_data.meta_desc;
                    } else metaData.meta_desc = null
                    if (meta_data && meta_data.meta_keys){
                        metaData.meta_keys = meta_data.meta_keys
                    } else  metaData.meta_keys = null
                    if (meta_data && meta_data.meta_canonical){
                        metaData.meta_canonical = meta_data.meta_canonical
                    } else metaData.meta_canonical = null


                    if (link && link.slug !== slug) {
                        await linksService.updateLinkService({ slug: slug }, link.slug,i.lang, transaction);
                    }

                    let oldUrl = extraUtil.generateLinkUrlForPage('service', i.id, 'service',i.lang);

                    let [findedMetaData, isCreated] = await metaDataService.findOrCreateMetaData({ where: { url: oldUrl }, defaults: (metaData.url ? metaData : {...metaData, url: oldUrl }) }, transaction);
                    if (findedMetaData && !isCreated) {
                        await findedMetaData.update(metaData, { transaction });
                    }
                }
            }else{
                await models.service.update(data,{where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},transaction})

                let service = await models.service.findOne({where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},raw:true,transaction})
                await adminChangesHistoryService.adminCreateHistory({ item_id: service.id, user_id: user_id, type: 'service' }, transaction);

                let service_form_ids = await models.service_form.findAll({where:{service_id:service.id},transaction})
                service_form_ids = service_form_ids.map(i=>i.id)
                let additional_services = await models.service_additional.findAll({where:{service_id:service.id},raw:true,transaction})
                additional_services = additional_services.map(i=>i.id)
                await models.service_content.destroy({where:{service_id:service.id}})
                await models.service_form.destroy({where:{id:{[Op.in]:service_form_ids}},transaction})
                let all_service_form_field_ids = []
                if(constructor && constructor.length){
                    for(let form of constructor){
                        if(form.fields && form.fields.length){
                            let all_fields = []
                            for(let field of form.fields){
                                if(field.id){
                                    all_fields.push(field.id)
                                }
                            }
                            all_service_form_field_ids = [...all_service_form_field_ids,...all_fields]
                        }
                    }
                }
                await models.service_form_field.destroy({where:{service_form_id:{[Op.in]:service_form_ids},id:{[Op.notIn]:all_service_form_field_ids}},transaction})
                await models.service_to_category.destroy({where:{service_id:service.id},transaction})
                await models.service_additional.destroy({where:{service_id:service.id},transaction})
                await models.service_country_pricing.destroy({where:{service_id:service.id},transaction})
                await models.service_additional_files.destroy({where:{service_id:service.id,id:{[Op.notIn]:additional_files_ids}},transaction})
                await models.service_additional_country_pricing.destroy({where:{service_id:{[Op.in]:additional_services}},transaction})
                await models.service_random_text.destroy({where:{service_id:service.id},transaction})
                if(service_random_text && service_random_text.length){
                    for(let item of service_random_text){
                        let random_data ={
                            service_id :service.id,
                            text:item.text
                        }
                        await models.service_random_text.create(random_data,{transaction})
                    }
                }
                if(service_category && service_category.id){
                    await models.service_to_category.create({
                        service_id:service.id,
                        service_category_id:service_category.id
                    },{transaction})
                }
                if(service_country_pricing && service_country_pricing.length){
                    for(let item of service_country_pricing){
                        let country_price_data = {
                            service_id:service.id,
                            ip:item.ip,
                            price:item.price
                        }
                        await models.service_country_pricing.create(country_price_data,{transaction})
                    }
                }
                if(service_additional && service_additional.length){
                    for(let item of service_additional){
                        let additional_data ={
                            service_id:service.id,
                            title:item.title,
                            price:item.price,
                            template_doc:item.template_doc
                        }
                       let additional_object = await models.service_additional.create(additional_data,{transaction})
                        if(item.service_country_pricing && item.service_country_pricing.length){
                            for(let price_additional of item.service_country_pricing){
                                let additional_data_pricing={
                                    service_id:additional_object.id,
                                    ip:price_additional.ip,
                                    price:price_additional.price
                                }
                                await models.service_additional_country_pricing.create(additional_data_pricing,{transaction})
                            }
                        }
                    }
                }
                if(additional_files && additional_files.length){
                    for(let item of additional_files){
                        if(!item.id) {
                            let additional_file_data={
                                service_id:service.id,
                                title:item.title,
                                tag:item.tag
                            }
                            await models.service_additional_files.create(additional_file_data,{transaction})
                        } else {
                            let additional_file_data = {
                                title:item.title,
                                tag:item.tag
                            }
                            await models.service_additional_files.update(additional_file_data, {where: {id: item.id}, transaction});
                        }
                    }
                }
                if(constructor && constructor.length){
                    let form
                    let i = 0
                    for(let item of constructor){
                        let form_data={
                            service_id:service.id,
                            title:item.title,
                            lang:service.lang,
                            origin_id : 0,
                            status:item.status ? item.status : config.GLOBAL_STATUSES.ACTIVE,
                            image_id:item.image && item.image.id ? item.image.id : null,
                            type:item.type ? item.type : 1,
                            required:item.required ? item.required :2,
                            step:item.step ? item.step : i,

                        }
                        form = await models.service_form.create(form_data,{transaction})
                        if(item.fields && item.fields.length){
                            let pos = 0
                            for (let field of item.fields){
                                pos++
                                let form_field_data={
                                    title:field.title,
                                    name_field:field.name_field,
                                    type:field.type,
                                    required: field.required ? 2 : 1,
                                    service_form_id:form.id,
                                    position:field.position ? field.position : pos,
                                    placeholder:field.placeholder ? field.placeholder : (field.title ? field.title : field.name_field),
                                    width: field.width ? field.width : 'big',
                                    for_registration: field.for_registration ? 2 : 1,
                                    client_address: field.client_address ? 2 :1,
                                    register_first: field.register_first ? 2 :1,
                                    register_last: field.register_last ? 2 :1,
                                    register_sur: field.register_sur ? 2 :1,
                                    client_inn :field.client_inn ? 2 : 1,
                                    client_passport:field.client_passport ? 2 : 1,
                                    client_date:field.client_date ? 2 : 1,
                                    maxlength: field.maxlength ? field.maxlength :null,
                                    hint: field.hint ? field.hint :null,
                                    child_name_field: field.child_name_field ? field.child_name_field :null,
                                    doc_1 : field.doc_1 ? JSON.stringify(field.doc_1):null,
                                    doc_2 : field.doc_2 ? JSON.stringify(field.doc_2):null,
                                    is_defendant : field.is_defendant ? 2 : 1,
                                    is_court: field.is_court ? 2 : 1,
                                }
                                if(field.id){
                                    let findField = await models.service_form_field.findOne({where:{id:field.id},raw:true,transaction})
                                    if(findField){
                                        await models.service_form_field.update(form_field_data,{where:{id:field.id},transaction})
                                    }else{
                                        await models.service_form_field.create(form_field_data,{transaction})
                                    }
                                }else{
                                    await models.service_form_field.create(form_field_data,{transaction})
                                }
                            }
                        }
                    }
                }
                if(data.service_contents && data.service_contents.length){
                    for(let content of data.service_contents){
                        content.service_id = service.id
                    }
                    await models.service_content.bulkCreate(data.service_contents,{transaction})
                }


                let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service', service.id, 'service', service.lang),lang:service.lang }, transaction);
                const linkslug = link && link.slug ? link.slug : null;

                if (!slug) {
                    // transliterate
                    slug = slugify(data.title);
                    let checkSlag = await linksService.getLinkByFilter({slug: slug,lang:service.lang}, transaction);
                    let localSlug = slug
                    let a = 1
                    while(checkSlag){
                        localSlug = slug
                        localSlug = localSlug + "-" + a
                        checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang:service.lang}, transaction);
                        a++
                    }
                    slug = localSlug
                } else {
                    let checkSlag = await linksService.getAllLinks({ slug, lang:service.lang }, transaction);
                    if (checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                    if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {
                        await transaction.rollback();
                        throw new Error
                    }
                }

                let metaData = {};

                if(meta_data.meta_title){
                    metaData.meta_title = meta_data.meta_title;
                } else  metaData.meta_title = data.title
                if(meta_data.meta_desc) {
                    metaData.meta_desc = meta_data.meta_desc;
                } else metaData.meta_desc = null
                if (meta_data && meta_data.meta_keys){
                    metaData.meta_keys = meta_data.meta_keys
                } else  metaData.meta_keys = null
                if (meta_data && meta_data.meta_canonical){
                    metaData.meta_canonical = meta_data.meta_canonical
                } else metaData.meta_canonical = null


                if (link && link.slug !== slug) {
                    await linksService.updateLinkService({ slug: slug }, link.slug,service.lang,transaction);
                }
                let oldUrl = extraUtil.generateLinkUrlForPage('service', service.id, 'service', service.lang);

                let [findedMetaData, isCreated] = await metaDataService.findOrCreateMetaData({ where: { url: oldUrl }, defaults: (metaData.url ? metaData : {...metaData, url: oldUrl }) }, transaction);
                if (findedMetaData && !isCreated) {
                    await findedMetaData.update(metaData, { transaction });
                }
            }
            result = getService({[Op.or]:[
                    {id:id,lang:lang},
                    {origin_id:id,lang:lang}
                ]},transaction)
            if (!trans) await transaction.commit();

            log.info(
                `End updateService. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updateServiceCategory:async (id,lang,data,update_all,user_id,slug,meta_data,trans)=>{
        let transaction = null;
        let languages = config.LANGUAGES;
        let result
        let services_category = await models.service_category.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true})
        let services_ids = services_category.map(i=>i.id)
        try {
            log.info(
                `Start updateService. Params: ${JSON.stringify({id,lang,data})}`
            );
            transaction = trans ? trans : await sequelize.transaction();
            if(update_all){
                await models.service_category.update(data,{where:{id:{[Op.in]:services_ids}},transaction})
                await models.service_category_content.destroy({where:{service_category_id:{[Op.in]:services_ids}}})
                for(let i of services_category){
                    await adminChangesHistoryService.adminCreateHistory({ item_id: i.id, user_id: user_id, type: 'service_category' }, transaction);
                    if(data.service_contents && data.service_contents.length){
                        for(let content of data.service_contents){
                            content.service_category_id = i.id
                        }
                        await models.service_category_content.bulkCreate(data.service_contents,{transaction})
                    }


                    let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service_category', i.id, 'service_category', i.lang),lang:i.lang }, transaction);
                    const linkslug = link && link.slug ? link.slug : null;

                    if (!slug) {
                        // transliterate
                        slug = slugify(data.title);
                        let checkSlag = await linksService.getLinkByFilter({slug: slug,lang:i.lang}, transaction);
                        let localSlug = slug
                        let a = 1
                        while(checkSlag){
                            localSlug = slug
                            localSlug = localSlug + "-" + a
                            checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang:i.lang}, transaction);
                            a++
                        }
                        slug = localSlug


                    } else {
                        let checkSlag = await linksService.getAllLinks({ slug, lang:i.lang }, transaction);
                        if (checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                        if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {
                            await transaction.rollback();
                            throw new Error
                        }
                    }


                    let metaData = {};

                    if(meta_data.meta_title){
                        metaData.meta_title = meta_data.meta_title;
                    } else  metaData.meta_title = data.title
                    if(meta_data.meta_desc) {
                        metaData.meta_desc = meta_data.meta_desc;
                    } else metaData.meta_desc = null
                    if (meta_data && meta_data.meta_keys){
                        metaData.meta_keys = meta_data.meta_keys
                    } else  metaData.meta_keys = null
                    if (meta_data && meta_data.meta_canonical){
                        metaData.meta_canonical = meta_data.meta_canonical
                    } else metaData.meta_canonical = null


                    if (link && link.slug !== slug) {
                        await linksService.updateLinkService({ slug: slug }, link.slug,i.lang, transaction);
                    }

                    let oldUrl = extraUtil.generateLinkUrlForPage('service_category', i.id, 'service_category',i.lang);

                    let [findedMetaData, isCreated] = await metaDataService.findOrCreateMetaData({ where: { url: oldUrl }, defaults: (metaData.url ? metaData : {...metaData, url: oldUrl }) }, transaction);
                    if (findedMetaData && !isCreated) {
                        await findedMetaData.update(metaData, { transaction });
                    }
                }
            }else{
                await models.service_category.update(data,{where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},transaction})

                let service = await models.service_category.findOne({where:{[Op.or]:[{id:id,lang:lang},{origin_id:id,lang:lang}]},raw:true,transaction})
                await adminChangesHistoryService.adminCreateHistory({ item_id: service.id, user_id: user_id, type: 'service_category' }, transaction);

                await models.service_category_content.destroy({where:{service_category_id:service.id}})

                if(data.service_contents && data.service_contents.length){
                    for(let content of data.service_contents){
                        content.service_category_id = service.id
                    }
                    await models.service_category_content.bulkCreate(data.service_contents,{transaction})
                }


                let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage('service_category', service.id, 'service_category', service.lang),lang:service.lang }, transaction);
                const linkslug = link && link.slug ? link.slug : null;

                if (!slug) {
                    // transliterate
                    slug = slugify(data.title);
                    let checkSlag = await linksService.getLinkByFilter({slug: slug,lang:service.lang}, transaction);
                    let localSlug = slug
                    let a = 1
                    while(checkSlag){
                        localSlug = slug
                        localSlug = localSlug + "-" + a
                        checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang:service.lang}, transaction);
                        a++
                    }
                    slug = localSlug
                } else {
                    let checkSlag = await linksService.getAllLinks({ slug, lang:service.lang }, transaction);
                    if (checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                    if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {
                        if (transaction && !trans) await transaction.rollback();
                        throw new Error("такий лінк вже існує")
                    }
                }


                let metaData = {};

                if(meta_data.meta_title){
                    metaData.meta_title = meta_data.meta_title;
                } else  metaData.meta_title = data.title
                if(meta_data.meta_desc) {
                    metaData.meta_desc = meta_data.meta_desc;
                } else metaData.meta_desc = null
                if (meta_data && meta_data.meta_keys){
                    metaData.meta_keys = meta_data.meta_keys
                } else  metaData.meta_keys = null
                if (meta_data && meta_data.meta_canonical){
                    metaData.meta_canonical = meta_data.meta_canonical
                } else metaData.meta_canonical = null


                if (link && link.slug !== slug) {
                    await linksService.updateLinkService({ slug: slug }, link.slug,service.lang,transaction);
                }
                let oldUrl = extraUtil.generateLinkUrlForPage('service_category', service.id, 'service_category', service.lang);

                let [findedMetaData, isCreated] = await metaDataService.findOrCreateMetaData({ where: { url: oldUrl }, defaults: (metaData.url ? metaData : {...metaData, url: oldUrl }) }, transaction);
                if (findedMetaData && !isCreated) {
                    await findedMetaData.update(metaData, { transaction });
                }
            }
            result = getServiceCategory({[Op.or]:[
                    {id:id,lang:lang},
                    {origin_id:id,lang:lang}
                ]},transaction)
            if (!trans) await transaction.commit();

            log.info(
                `End updateService. Result: ${JSON.stringify(result)}`
            );
            return result
        } catch (err) {
            console.log(err,'34634675686798978097086')
            log.error(`${err}`);
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    makeCourtsFilter: async (body, whereObj) => {
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
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }
        let filter = { sort, where: { [Op.and]: [whereObj, ...arr,{origin_id:0}] }};

        return filter;
    },
    makeCategoryFilter: async (body, whereObj) => {
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
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }
        let filter = { sort, where: { [Op.and]: [whereObj, ...arr,{origin_id:0}] }};

        return filter;
    },
    makeServiceFilter: async (body, whereObj) => {
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
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at],[models.service_form, 'step', 'ASC']];
            }
        } else {
            sort = [['created_at', 'DESC'],[models.service_form,'step','ASC'],[models.service_form,models.service_form_field,'position','ASC']];
        }
        let filter = { sort, where: { [Op.and]: [whereObj, ...arr,{origin_id:0}] }};

        return filter;
    },
    adminGetAllService: async (filter, page, perPage, attributes,calc) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.service.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                distinct:true,
                include:[
                    {
                        model:models.service_form,
                        include:[
                            {
                                model:models.service_form_field,
                                // as:"fields"
                            }
                        ]
                    },
                    {
                        model:models.service_category,
                        as: "service_category",
                        through:{attributes:[]}
                    }
                ],
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                for(let item of result.rows){
                    if(item.service_forms && item.service_forms.length){
                        for(let form of item.service_forms){
                            if(form.service_form_fields){
                                for(let field of form.service_form_fields){
                                    field.required  = field.required == 2 ? true :false
                                    field.for_registration  = field.for_registration == 2 ? true :false
                                    field.client_address  = field.client_address == 2 ? true :false
                                }
                            }
                        }
                    }
                }
                if(calc){
                    for(let item of result.rows){
                        item.service_country_pricing = await models.service_country_pricing.findAll({where:{service_id:item.id},raw:true})
                    }
                }
                result.rows = await extraUtil.checkUpdateLangByObject(result.rows,models.service,'service')
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
    adminGetAllCourts: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.courts.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                result.rows = await extraUtil.checkUpdateLangByObject(result.rows,models.courts,'courts')
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
    adminGetAllServiceCategory: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.service_category.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort
            });
            if(result && result.rows && result.rows.length){
                result.rows = result.rows.map(i=>i.toJSON())
                for(let item of result.rows){
                    item.countServices = await models.service_to_category.count({where:{service_category_id:item.id}})
                }
                result.rows = await extraUtil.checkUpdateLangByObject(result.rows,models.service_category,'service_category')
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
    countServiceByParam: async (model) => {
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
    countServiceCategoryByParam: async (model) => {
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

    deleteService:async (id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let services_ids = await models.service.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true,transaction})
            if(services_ids)services_ids = services_ids.map(i=>i.id)
            let service_forms_ids = await models.service_form.findAll({where:{service_id:{[Op.in]:services_ids}},raw:true,transaction})
            service_forms_ids = service_forms_ids.map(i=>i.id)
            let additional_services = await models.service_additional.findAll({where:{service_id:{[Op.in]:services_ids}},raw:true,transaction})
            additional_services = additional_services.map(i=>i.id)

            await models.service.destroy({where:{id:{[Op.in]:services_ids}},transaction})
            await models.service_content.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
            await models.service_form.destroy({where:{id:{[Op.in]:service_forms_ids}},transaction})
            await models.service_form_field.destroy({where:{service_form_id:{[Op.in]:service_forms_ids}},transaction})
            await models.service_to_category.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
            await models.admin_changes_history.destroy({where:{item_id:{[Op.in]:services_ids},type:'service'},transaction})
            await models.service_additional.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
            await models.service_country_pricing.destroy({where:{service_id:{[Op.in]:services_ids}},transaction})
            await models.service_additional_country_pricing.destroy({where:{service_id:{[Op.in]:additional_services}},transaction})
            if(services_ids && services_ids.length){
                for(let item of services_ids){
                    await models.links.destroy({where:{original_link:`/shop/getService/${item}`},transaction})
                }
            }

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            log.error(JSON.stringify(err));
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteCourt:async (id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let services_ids = await models.courts.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true,transaction})
            if(services_ids)services_ids = services_ids.map(i=>i.id)

            await models.courts.destroy({where:{id:{[Op.in]:services_ids}},transaction})
            await models.admin_changes_history.destroy({where:{item_id:{[Op.in]:services_ids},type:'courts'},transaction})


            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            log.error(JSON.stringify(err));
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteServiceCategory:async (id,trans)=>{
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let services_ids = await models.service_category.findAll({where:{[Op.or]:[{id:id},{origin_id:id}]},raw:true,transaction})
            if(services_ids)services_ids = services_ids.map(i=>i.id)
            await models.service_category.destroy({where:{id:{[Op.in]:services_ids}},transaction})
            await models.service_category_content.destroy({where:{service_category_id:{[Op.in]:services_ids}},transaction})
            await models.service_to_category.destroy({where:{service_category_id:{[Op.in]:services_ids}},transaction})
            await models.admin_changes_history.destroy({where:{item_id:{[Op.in]:services_ids},type:'service_category'},transaction})
            if(services_ids && services_ids.length){
                for(let item of services_ids){
                    await models.links.destroy({where:{original_link:`/shop/getServiceCategory/${item}`},transaction})
                }
            }

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            log.error(JSON.stringify(err));
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    }
}
