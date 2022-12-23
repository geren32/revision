const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const promotionService = require('../services/promotions.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { slugify } = require('transliteration');
slugify.config({ lowercase: true, separator: '-' });
const extraUtil = require('../utils/extra-util');
const linksService = require('../services/links.service');
const metaDataService = require('../services/meta-data.service');
const adminHistoryService = require('../services/admin-changes-history.service');
const adminPreviewService = require('../services/admin.preview.service');
const markService = require('../services/mark.service');
const log = require('../utils/logger');

module.exports = {

    saveLadel: async (req, res) => {
        log.info(`Start post /saveLadel Params: ${JSON.stringify(req.body)}`);
        let { id, title, status, color, image } = req.body;
        const languages = config.LANGUAGES;
        let result
        let transaction = await sequelize.transaction();
        try {
            if (!id) {
                status = status ? status : config.GLOBAL_STATUSES.ACTIVE;
                let originLabel;
                let label;
                for (let lang of languages) {
                    let labelData = {
                        lang: lang,
                        origin_id: originLabel && originLabel.id ? originLabel.id : 0,
                        title,
                        color,
                        status,
                        type: config.MARK_TYPE.PROMOTION,
                        image_id: image && image.id ? image.id : null,
                    };
                    
                    label = await markService.createMark(labelData, transaction);

                    await adminHistoryService.adminCreateHistory({ item_id: label.id, user_id: req.userid, type: 'mark' }, transaction);

                    if (!originLabel) originLabel = label;

                    //await transaction.commit();

                }
                originLabel = originLabel.toJSON();
                originLabel.history = await adminHistoryService.adminFindAllHistory({ type: 'mark', item_id: originLabel.id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()} });
                //return res.status(200).json(originLabel);
                result = originLabel
            } else {

                //update label
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };
                let label = await markService.getMarkByFilter(filter);
                if (!label) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }

                let markObj = { 
                    title,
                    color,
                    status
                }

                if(image && image.id) markObj.image_id = (image.origin_id === 0 ? image.id : image.origin_id)

                label = await markService.updateMarkById(filter, markObj, transaction );

                await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'mark' }, transaction);

                const otherLangFilter = { [Op.or]: [{ id: id }, { origin_id: id }] };
                await markService.updateMarkById(otherLangFilter, {
                    status
                }, transaction);

                

                label = label.toJSON();
                label.history = await adminHistoryService.adminFindAllHistory({ type: 'mark', item_id: id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()} });
                result = label
            }
            log.info(`End post /saveLabel  Result: ${JSON.stringify(result)}`);
            await transaction.commit();
            return res.status(200).json(result);
        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    getAllLadels: async (req, res) => {
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        log.info(`Start /getAllLadels Params: ${JSON.stringify(req.body)}`);
        try {
            let numberOfActive = await markService.countMarksByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE, type: config.MARK_TYPE.PROMOTION });
            let numberOfDeleted = await markService.countMarksByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED, type: config.MARK_TYPE.PROMOTION });
            let numberOfAll = await markService.countMarksByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }, type: config.MARK_TYPE.PROMOTION });
            let statusCount = {
                all: numberOfAll,
                0: numberOfDeleted,
                1: numberOfActive,
            };

            let filter;
            let filterwhere = { origin_id: 0, type: config.MARK_TYPE.PROMOTION };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }, type: config.MARK_TYPE.PROMOTION };
            }
            filter = await markService.makeMarksFilter(req.body, filterwhere);
            result = await markService.adminGetAllMark(filter, page, perPage, false);
            result.statusCount = statusCount;
            log.info(`End /getAllLadels Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getLadelById: async (req, res) => {
        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {[Op.and]: [
            { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] },
            { type: config.MARK_TYPE.PROMOTION }
        ]};
        log.info(`Start /getLadelById  Params: ${JSON.stringify(req.params)}`);
        try {
            let label = await markService.getMarkByFilter(filter);
            if (!label) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            label = label.toJSON();
            label.history = await adminHistoryService.adminFindAllHistory({ type: 'mark', item_id: label.id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString()} });
            
            log.info(`End /getLadelById Result: ${JSON.stringify(label)}`);
            return res.status(200).json(label);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    deleteLabelsByIds: async (req, res) => {
        let { ids } = req.body;
        let result = [];
        log.info(`Start /deleteLabels Params: ${JSON.stringify(req.body)}`);
        const transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                
                for (let id of ids) {
                    let label = await markService.getMarkByFilter({ id });
                    if (!label) {
                        result.push({ id: id, deleted: false, error: `No found label with id:${id}` })
                    } else {
                        if (label && label.status == config.GLOBAL_STATUSES.DELETED) {
                            await markService.deleteMarkById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'mark' }, transaction);

                        } else {
                            label = await markService.updateMarkById({ [Op.or]: [{ id: id }, { origin_id: id }] },
                                { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            result.push(label);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'mark' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End /deleteLabels Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    savePromotion: async (req, res) => {
        log.info(`Start savePromotion  Params: ${JSON.stringify(req.body)}`);
        let { id, title, image, body, slug, status, description, date_from, date_to, banner_image,
            banner_image_mobile, meta_data, show_date_label, marks, date_to_timer, show_promotion_from} = req.body;
        const languages = config.LANGUAGES;
        let result;
        let transaction = await sequelize.transaction();
        try {
            if(!id){
                status = status ? status : config.GLOBAL_STATUSES.WAITING;
                let originPromotion;
                for(let lang of languages) {
                    let currentSlug;
                    if (!slug) {
                        // transliterate
                        currentSlug = slugify(title);
                        let checkSlag = await linksService.getLinkByFilter({slug: currentSlug,lang}, transaction);
                        let localSlug = currentSlug
                        let i = 1
                        while(checkSlag){
                            localSlug = currentSlug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang}, transaction);
                            i++
                        }
                        currentSlug = localSlug
                    } else {
                        let checkSlag = await linksService.getLinkByFilter({slug,lang}, transaction);
                        let localSlug = slug
                            let i = 1
                            while(checkSlag){
                                localSlug = slug
                                localSlug = localSlug + "-" + i
                                checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang}, transaction);
                                i++
                            }
                            slug = localSlug
                            currentSlug = slug
                    }

                    let promotionData = {
                        lang: lang,
                        origin_id: originPromotion && originPromotion.id ? originPromotion.id : 0,
                        title,
                        date_from,
                        date_to,
                        date_to_timer,
                        show_date_label,
                        show_promotion_from,
                        description,
                        image_id : image && image.id ? image.id : null,
                        banner_id : banner_image && banner_image.id ? banner_image.id : null,
                        image_mobile_id : banner_image_mobile && banner_image_mobile.id ? banner_image_mobile.id : null,
                        status,
                       
                    };

                    let promotion_body = extraUtil.convertPromotionBodyForDBFormat(body);
                    if(promotion_body && promotion_body.length) promotionData.promotions_contents = promotion_body;

                    
                    let promotion = await promotionService.createPromotion(promotionData, marks, transaction);

                    let link = await linksService.createLink({ slug: currentSlug, original_link: `/getPromotion/${promotion.id}`, type: 'promotion',lang }, transaction);
                    if(link) promotion.slug = link.slug;

                    let metaData;
                    if (meta_data){
                        metaData = {
                            url: `/getPromotion/${promotion.id}`,
                        }
                        if(meta_data.meta_title){
                            metaData.meta_title = meta_data.meta_title;
                        } else  metaData.meta_title = title
                        if(meta_data.meta_desc) {
                            metaData.meta_desc = meta_data.meta_desc;
                        } else metaData.meta_desc = null
                        if(meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                        if(meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;
                    }
                    if(metaData) promotion.meta_data = await metaDataService.createMetaData(metaData, transaction);

                    await adminHistoryService.adminCreateHistory({item_id: promotion.id, user_id: req.userid, type: 'promotion'}, transaction);

                    if(!originPromotion) originPromotion = promotion;

                    
                }
                result = originPromotion;
            }else{
                if (status == config.GLOBAL_STATUSES.DUPLICATE_POST) {
                    let originPromotion;
                    let duplicatePromotion;
                    let link;
                    const lang = req.body.lang ? req.body.lang : languages[0];
                    for(let lang of languages) {
                        const filter = {[Op.or]:[ { id: id, lang: lang }, { origin_id: id, lang: lang } ]};
                        let promotion = await promotionService.getOriginPromotionFormat(filter, transaction);
                        if(promotion && promotion.id) {
                            link = await linksService.getLinkByFilter({original_link: `/getPromotion/${promotion.id}`,lang},transaction);
                            link = link && link.slug ? link : link.slug = 'promotion';

                            let newSlag = link.slug + '-' + Date.now();
                            duplicatePromotion = extraUtil.removeFields(promotion.toJSON(), ['id', 'promotion_id', 'created_at', 'updated_at']);
                            duplicatePromotion.status = config.GLOBAL_STATUSES.WAITING;
                            duplicatePromotion.lang = lang;
                            duplicatePromotion.origin_id = originPromotion && originPromotion.id ? originPromotion.id : 0;
                            promotion = promotion.toJSON();
                            duplicatePromotion = await promotionService.createPromotion(duplicatePromotion, promotion.marks, transaction);
                            await linksService.createLink({slug: newSlag, original_link: `/getPromotion/${duplicatePromotion.id}`, type: 'promotion',lang}, transaction);
                            let metaData = await promotionService.getMetaDataBySlagOrUrl( link.original_link, transaction);
                            if(metaData){
                                metaData = extraUtil.removeFields(metaData.toJSON(), ["id", "url"]);
                                metaData.url = `/getPromotion/${duplicatePromotion.id}`;
                                duplicatePromotion.meta_data = await metaDataService.createMetaData(metaData, transaction);
                            }
                            if(!originPromotion) originPromotion = duplicatePromotion;
                        }
                    }
    
                    link = await linksService.getLinkByFilter({original_link: `/getPromotion/${originPromotion.id}`,lang}, transaction);
                    if(link && link.slug) originPromotion.slug = link.slug;
                    originPromotion.meta_data = await promotionService.getMetaDataBySlagOrUrl(`/getPromotion/${originPromotion.id}`, transaction);
                    await adminHistoryService.adminCreateHistory({item_id: originPromotion.id, user_id: req.userid, type: 'promotion'}, transaction);
                    originPromotion.history = await adminHistoryService.adminFindAllHistory({type:'promotion', item_id: originPromotion.id, created_at: {[Op.gte] : new Date(Date.now()-config.TIME_CONST).toISOString()}}, transaction);

                    result = originPromotion;
                
                }else{
                    const lang = req.body.lang ? req.body.lang : languages[0];
                    const filter = {[Op.or]:[ { id: id, lang: lang }, { origin_id: id, lang: lang } ]};
        
                    let promotion = await promotionService.getPromotion(filter, transaction,null,lang);
                    if (!promotion) {
                       return res.status(400).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                        });
        
                    }
                    let link = await linksService.getLinkByFilter({original_link: `/getPromotion/${promotion.id}`,lang},transaction);
        
                    if (!slug) {
                        // transliterate
                        slug = slugify(title);
                        let checkSlag = await linksService.getLinkByFilter({slug: slug,lang}, transaction);
                        let localSlug = slug
                        let i = 1
                        while(checkSlag){
                            localSlug = slug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang}, transaction);
                            i++
                        }
                        slug = localSlug

                    } else {
                        let checkSlag = await linksService.getAllLinks({slug,lang}, transaction);
                        if(checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                        if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {
                            await transaction.rollback();
                            return res.status(errors.BAD_REQUEST_LINK_ALREADY_EXIST.code).json({
                                message: errors.BAD_REQUEST_LINK_ALREADY_EXIST.message,
                                errCode: errors.BAD_REQUEST_LINK_ALREADY_EXIST.code
                            });
                        }

                    }
                    let metaData = {};
                    if (meta_data) {

                        if(meta_data.meta_title){
                            metaData.meta_title = meta_data.meta_title;
                        } else  metaData.meta_title = title
                        if(meta_data.meta_desc) {
                            metaData.meta_desc = meta_data.meta_desc;
                        } else metaData.meta_desc = null
                        if (meta_data && meta_data.meta_keys){
                            metaData.meta_keys = meta_data.meta_keys
                        } else  metaData.meta_keys = null
                        if (meta_data && meta_data.meta_canonical){
                            metaData.meta_canonical = meta_data.meta_canonical
                        } else metaData.meta_canonical = null
                    }
                    if(slug && (link.slug !== slug)) {
                        await linksService.updateLink({ slug: slug }, link.slug, transaction);
                    }
        
                    let [ findedMetaData, isCreated ] = await metaDataService.findOrCreateMetaData({where: {url: `/getPromotion/${promotion.id}`}, defaults: (metaData.url ? metaData : {...metaData, url: `/getPromotion/${promotion.id}`}) }, transaction);
                    if( findedMetaData && !isCreated ) {
                        await findedMetaData.update(metaData,{transaction});
                    }
        
                    const bodyData = extraUtil.convertPromotionBodyForDBFormat(body, promotion.id);
                    let promotionData = {};
                    let promotionDataOtherLang = {};
                    if(title) promotionData.title = title;
                    promotionData.show_date_label = show_date_label ? show_date_label : 0;
                    promotionData.show_promotion_from = show_promotion_from ? show_promotion_from : 0;
                    if(status) {
                        promotionData.status = status;
                        promotionDataOtherLang.status = status;
                    }
                    if(description) promotionData.description = description;
                    if(date_from) {
                        promotionData.date_from = date_from;
                        promotionDataOtherLang.date_from = date_from;
                    }
                    if(date_to) {
                        promotionData.date_to = date_to;
                        promotionDataOtherLang.date_to = date_to;
                    }
                    if(date_to_timer) {
                        promotionData.date_to_timer = date_to_timer;
                        promotionDataOtherLang.date_to_timer = date_to_timer;
                    }
                    if(image && image.id){
                        promotionData.image_id = image.id;
                        promotionDataOtherLang.image_id = image.id;
                    }else if(image == null){
                        promotionData.image_id = image;
                        promotionDataOtherLang.image_id = image;
                    }
                    if(banner_image && banner_image.id){
                        promotionData.banner_id = banner_image.id;
                        promotionDataOtherLang.banner_id = banner_image.id;
                    }else if(banner_image == null){
                        promotionData.banner_id = banner_image;
                        promotionDataOtherLang.banner_id = banner_image;
                    }
                    if(banner_image_mobile && banner_image_mobile.id){
                        promotionData.image_mobile_id = banner_image_mobile.id;
                        promotionDataOtherLang.image_mobile_id = banner_image_mobile.id;
                    }else if(banner_image_mobile == null){
                        promotionData.image_mobile_id = banner_image_mobile;
                        promotionDataOtherLang.image_mobile_id = banner_image_mobile;
                    }
                    promotionDataOtherLang.show_date_label = show_date_label ? show_date_label : 0;
                    promotionDataOtherLang.show_promotion_from = show_promotion_from ? show_promotion_from : 0;

                    promotion = await promotionService.updatePromotion(promotion.id, promotionData, bodyData, marks, transaction );
                    link = await linksService.getLinkByFilter({original_link: `/getPromotion/${promotion.id}`,lang}, transaction);
                    if(link && link.slug) promotion.slug = link.slug;
                    promotion.meta_data = await promotionService.getMetaDataBySlagOrUrl(`/getPromotion/${promotion.id}`, transaction);
                    await adminHistoryService.adminCreateHistory({item_id: promotion.id, user_id: req.userid, type: 'promotion'}, transaction);
                    promotion.history = await adminHistoryService.adminFindAllHistory({type:'promotion', item_id: promotion.id, created_at: {[Op.gte] : new Date(Date.now()-config.TIME_CONST).toISOString()}}, transaction);
        
                    const otherLangFilter = {[Op.or]:[ { id: id }, { origin_id: id } ]};
                    await promotionService.updatePromotionById( otherLangFilter, promotionDataOtherLang, transaction );

                    result = promotion;
                }

            }

            await transaction.commit();
            log.info(`End /savePromotion Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);


        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return  res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    createPromotionPreview: async (req, res) => {
        let {
            id, title, image, body, slug, status, description, date_from, date_to, banner_image,
            banner_image_mobile, meta_data, show_date_label, marks
        } = req.body;
        const languages = config.LANGUAGES;
        log.info(`Start /createPromotionPreview  Params: ${JSON.stringify(req.body)}`);
        let transaction = await sequelize.transaction();
        try {
            if ( req.body && Object.keys(req.body).length === 1 && id) {
                const getOriginPromotion = await promotionService.getPromotion({id: id});
                title = getOriginPromotion.title;
                image = getOriginPromotion.image;
                body = getOriginPromotion.body;
                description = getOriginPromotion.description;
                date_from = getOriginPromotion.date_from;
                date_to = getOriginPromotion.date_to;
                banner_image = getOriginPromotion.banner_image;
                banner_image_mobile = getOriginPromotion.banner_image_mobile;
                meta_data = getOriginPromotion.meta_data;
                show_date_label = getOriginPromotion.show_date_label;
               
                marks = getOriginPromotion.marks;
            }

           
            status = config.GLOBAL_STATUSES.ACTIVE;
            let originPromotion;
            await adminPreviewService.deletePreviewPromotions();
            for (let lang of languages) {
                let currentSlug;
                if (!slug) {
                    // transliterate
                    currentSlug = slugify('preview-' + title);
                    let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, lang }, transaction);
                    let localSlug = currentSlug
                    let i = 1
                    while (checkSlag) {
                        localSlug = currentSlug
                        localSlug = localSlug + "-" + i
                        checkSlag = await linksService.getLinkByFilter({ slug: localSlug, lang }, transaction);
                        i++
                    }
                    currentSlug = localSlug
                } else {
                    currentSlug = 'preview-' + slug;
                    let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, lang }, transaction);
                    let localSlug = currentSlug
                    let i = 1
                    while (checkSlag) {
                        localSlug = currentSlug
                        localSlug = localSlug + "-" + i
                        checkSlag = await linksService.getLinkByFilter({ slug: localSlug, lang }, transaction);
                        i++
                    }
                    currentSlug = localSlug
                }


                let promotionData = {
                    preview: true,
                    lang: lang,
                    origin_id: originPromotion && originPromotion.id ? originPromotion.id : 0,
                    title,
                    date_from,
                    date_to,
                    show_date_label,
                    description,
                    image_id: image && image.id ? image.id : null,
                    banner_id: banner_image && banner_image.id ? banner_image.id : null,
                    image_mobile_id: banner_image_mobile && banner_image_mobile.id ? banner_image_mobile.id : null,
                    status,
                };

                let promotion_body = extraUtil.convertPostBodyForDBFormat(body);
                if (promotion_body && promotion_body.length) promotionData.promotions_contents = promotion_body;

                
                let promotion = await promotionService.createPromotion(promotionData, marks, transaction);
                let link = await linksService.createLink({
                    slug: currentSlug,
                    original_link: `/getPromotion/${promotion.id}`,
                    type: 'promotion',
                    lang
                }, transaction);
                if (link) promotion.slug = link.slug;

                let metaData;
                if (meta_data && (meta_data.meta_title || meta_data.meta_desc || meta_data.meta_keys || meta_data.meta_canonical)) {
                    metaData = {
                        url: `/getPromotion/${promotion.id}`,
                        meta_title: meta_data.meta_title,
                        meta_desc: meta_data.meta_desc,
                        meta_keys: meta_data.meta_keys,
                        meta_canonical: meta_data.meta_canonical
                    }
                }
                if (metaData) promotion.meta_data = await metaDataService.createMetaData(metaData, transaction);

                await adminHistoryService.adminCreateHistory({
                    item_id: promotion.id,
                    user_id: req.userid,
                    type: 'promotion'
                }, transaction);

                if (!originPromotion) originPromotion = promotion;

               
            }
            await transaction.commit();
            let result = {
                url: '/'+ originPromotion.slug
            }

            log.info(`End /createPromotionPreview Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },

    getAllPromotions: async (req, res) => {
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        log.info(`Start /getAllPromotions Params: ${JSON.stringify(req.body)}`);
        try {
            let numberOfWaiting = await promotionService.countPromotionByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.WAITING, preview: {[Op.eq]: null} });
            let numberOfActive = await promotionService.countPromotionByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE, preview: {[Op.eq]: null} });
            let numberOfDeleted = await promotionService.countPromotionByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED, preview: {[Op.eq]: null} });
            let numberOfAll = await promotionService.countPromotionByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }, preview: {[Op.eq]: null} });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
                4: numberOfWaiting,
            };

            let filter;
            let lang
            if(req.body.lang){
                lang = req.body.lang
            } else lang = 'uk'
            let filterwhere = { lang: lang };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { lang: lang, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await promotionService.makePromotionFilter(req.body, filterwhere);
            result = await promotionService.adminGetAllPromotions(filter, page, perPage, false);
            result.statusCount = statusCount;
            log.info(`End /getAllPromotions Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getPromotionById: async (req, res) => {
        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {[Op.or]:[ { id: id, lang: lang }, { origin_id: id, lang: lang } ]};
        log.info(`Start /getPromotion/:id  Params: ${JSON.stringify(req.params)}`);
        try {
            let promotion = await promotionService.getPromotion(filter,null,null,lang);
            if(!promotion) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            let link = await linksService.getLinkByFilter({original_link: `/getPromotion/${promotion.id}`,lang});
            promotion.slug = link.slug;
            promotion.meta_data = await promotionService.getMetaDataBySlagOrUrl(`/getPromotion/${promotion.id}`);
            promotion.history = await adminHistoryService.adminFindAllHistory({type:'promotion', item_id: promotion.id, created_at: {[Op.gte] : new Date(Date.now()-config.TIME_CONST).toISOString()}});
            log.info(`End /getPromotion/:id  Result: ${JSON.stringify(promotion)}`);
            return res.status(200).json(promotion);
        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode:'400'
            });

        }
    },

    deletePromotionByIds: async (req, res) => {
        let { ids } = req.body;
        const languages = config.LANGUAGES;
        log.info(`Start /deletePromotions Params: ${JSON.stringify(req.body)}`);
        let transaction = await sequelize.transaction();
        try {
            let result = [];
            if (ids && ids.length) {
               
                for (let id of ids) {
                    let promotion = await promotionService.getPromotion({ id }, transaction);
                    if (!promotion) {
                        result.push({ id: id, deleted: false, error: `No found promotion with id:${id}` })
                    } else {
                        if (promotion && promotion.status == config.GLOBAL_STATUSES.DELETED) {
                            const otherLangsForPromotion = await promotionService.getAllPromotions({origin_id: id}, transaction);
                            const otherLangsForPromotionIds = otherLangsForPromotion.map(i => i.id);
                            const otherLangsForPromotionOriginalLinks = otherLangsForPromotion.map((i,index) => `/getPromotion/${i.id}`);
                            const promotionIdsFilter = {[Op.in]: [promotion.id, ...otherLangsForPromotionIds] };
                            const promotionOriginalLinksFilter = {[Op.in]: [`/getPromotion/${promotion.id}`, ...otherLangsForPromotionOriginalLinks] };

                            await promotionService.deletePromotionById( promotionIdsFilter, transaction );
                            await linksService.removeLink( {original_link: promotionOriginalLinksFilter }, transaction );
                            await metaDataService.deleteMetaData( {url:  promotionOriginalLinksFilter  }, transaction );
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({item_id: id, user_id: req.userid, type: 'promotion'}, transaction);

                        } else {
                            promotion = await promotionService.updatePromotionById( id,
                                {
                                    status: config.GLOBAL_STATUSES.DELETED
                                },
                                transaction );
                            await promotionService.updatePromotionById( {origin_id: id},
                                {
                                    status: config.GLOBAL_STATUSES.DELETED,
                                },
                                transaction );
                            result.push(promotion);
                            await adminHistoryService.adminCreateHistory({item_id: id, user_id: req.userid, type: 'promotion'}, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End /deletePromotions Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return  res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },



}
