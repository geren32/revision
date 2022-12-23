const fs = require("fs");
const log = require('../utils/logger');

const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const productService = require('../services/product.service');
const { models } = require('../sequelize-orm');
const categorieService = require('../services/categorie.service');
const attributesService = require('../services/attributes.service');
const attributesGroupsService = require('../services/attribute_groups.service');
const adminProductService = require('../services/admin.product.service');
const metaDataService = require('../services/meta-data.service');
const adminHistoryService = require('../services/admin-changes-history.service');
const postService = require('../services/post.service');
const { slugify } = require('transliteration');
const linksService = require('../services/links.service');
const config = require("../configs/config");
const errors = require("../configs/errors");
const emailUtil = require('../utils/mail-util');
const informProductAvailabilityService = require('../services/inform.product.availability.service');
const productTestimonialsService = require('../services/product_testimonials.service');

const markService = require('../services/mark.service');
const extraUtil = require('../utils/extra-util');
const productPriceUtil = require('../utils/product_price-util');

/**
 * Function to delete category 
 * by origin id
 * @param {number} id origin id of category to delete
 * @param {Object} transaction transaction
 * @return {boolean} 
 */

 function removeTags(str) {
    if ((str===null) || (str===''))
        return false;
    else
        str = str.toString();
    return str.replace( /(<([^>]+)>)/ig, '');
}


async function deleteCategoryByOriginId(id, transaction) {
    try{
        let languages = config.LANGUAGES;
        let otherLangsForCategory = await adminProductService.getCategories({ origin_id: id }, transaction);
        let otherLangsForCategoryIds = otherLangsForCategory.map(i => i.id);
        let otherLangsForCategoryOriginalLinks = otherLangsForCategory.map(i => `/shop/getCategory/${i.id}`);
        let categoryIdsFilter;
        let categoryOriginalLinksFilter;
        if(id && Array.isArray(id) && id.length){
            categoryIdsFilter = { [Op.in]: [...id, ...otherLangsForCategoryIds] }
            let originalLinksIds = [];
            for (let i of id) {
                originalLinksIds.push(`/shop/getCategory/${i}`);
            }
            categoryOriginalLinksFilter = {[Op.in]: [...originalLinksIds, ...otherLangsForCategoryOriginalLinks] };
        }else{
            categoryIdsFilter = { [Op.in]: [id, ...otherLangsForCategoryIds] }
            categoryOriginalLinksFilter = {[Op.in]: [`/shop/getCategory/${id}`, ...otherLangsForCategoryOriginalLinks] };
        }
        
        await adminProductService.deleteCategory(categoryIdsFilter, transaction);
        await metaDataService.deleteMetaData({url:  categoryOriginalLinksFilter  }, transaction);
        await linksService.removeLink({ original_link: categoryOriginalLinksFilter }, transaction);
        return true;

    }catch(error){
        log.error(`${error}`);
        throw error;
    }
}


module.exports = {

    getAllProducts: async (req, res) => {
        
        log.info(`Start /getAllProducts Params: ${JSON.stringify(req.body)}`);
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfWaitionProducts = await adminProductService.countProductsByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.WAITING });
            let numberOfActiveProducts = await adminProductService.countProductsByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeletedProducts = await adminProductService.countProductsByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAllProducts = await adminProductService.countProductsByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } });
            let statusCount = {
                all: numberOfAllProducts,
                1: numberOfDeletedProducts,
                2: numberOfActiveProducts,
                4: numberOfWaitionProducts,
            };

            let filter;
            let lang = req.body.lang ? req.body.lang : config.LANGUAGES[0];
            let filterwhere = { lang: lang };

            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { lang: lang, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await adminProductService.makeProductsFilter(req.body, filterwhere);
            result = await adminProductService.adminGetAllProducts(filter, page, perPage, false,req.body.sort);

            result.statusCount = statusCount;
          
            log.info(`End /getAllProducts Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

   
    getAllCategory: async (req, res) => {
      
        log.info(`Start /getAllCategory Params: ${JSON.stringify(req.body)}`);
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfWaitionCategory = await adminProductService.countCategoryByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.WAITING });
            let numberOfActiveCategory = await adminProductService.countCategoryByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeletedCategory = await adminProductService.countCategoryByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAllCategory = await adminProductService.countCategoryByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } });
            let statusCount = {
                all: numberOfAllCategory,
                1: numberOfDeletedCategory,
                2: numberOfActiveCategory,
                4: numberOfWaitionCategory,
            };

            let filter;
            let lang = req.body.lang ? req.body.lang : config.LANGUAGES[0];
            let filterwhere = { lang: lang };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { lang: lang, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await adminProductService.makeCategoryFilter(req.body, filterwhere);
            result = await adminProductService.adminGetAllCategory(filter, page, perPage, false,req.body.sort);

            result.statusCount = statusCount;
            log.info(`End /getAllCategory  Result: ${JSON.stringify(result)}`);
            
            return res.status(200).json(result);

        } catch (error) {
            log.info(error);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

   

    getAllMarks: async (req, res) => {
        log.info(`Start /getAllMarks  Params: ${JSON.stringify()}`);
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfActiveMarks = await markService.countMarksByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE, type: config.MARK_TYPE.PRODUCT });
            let numberOfDeletedMarks = await markService.countMarksByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED, type: config.MARK_TYPE.PRODUCT });
            let numberOfAllMarks = await markService.countMarksByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }, type: config.MARK_TYPE.PRODUCT });
            let statusCount = {
                all: numberOfAllMarks,
                1: numberOfDeletedMarks,
                2: numberOfActiveMarks,
            };

            let lang = req.body.lang ? req.body.lang : config.LANGUAGES[0];
            let filterwhere = { lang: lang, type: config.MARK_TYPE.PRODUCT };
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { lang: lang, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED }, type: config.MARK_TYPE.PRODUCT };
            }

            let filter = await markService.makeMarksFilter(req.body, filterwhere);
            let result = await markService.adminGetAllMark(filter, page, perPage, false);
            result.statusCount = statusCount;
           
            
            log.info(`End  /getAllMarks Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(error);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

  
    getAllAttributes: async (req, res) => {
    
        log.info(`Start /getAllAttributes Params: ${JSON.stringify(req.body)}`);
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfActiveAttributes = await adminProductService.countAttributesByParam({ group_atr: null, origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeletedAttributes = await adminProductService.countAttributesByParam({ group_atr: null, origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAllAttributes = await adminProductService.countAttributesByParam({ group_atr: null, origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } });
            let statusCount = {
                all: numberOfAllAttributes,
                1: numberOfDeletedAttributes,
                2: numberOfActiveAttributes,
            };

            let filter;
            let lang = req.body.lang ? req.body.lang : config.LANGUAGES[0];
            let filterwhere = { lang: lang };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { lang: lang, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await adminProductService.makeAttributeFilter(req.body, filterwhere);
            result = await adminProductService.adminGetAllAttributes(filter, page, perPage);

            result.statusCount = statusCount;
           
            log.info(`End /getAllAttributes Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

   
    getCategory: async (req, res) => {
       
        log.info(`Start /getCategory/:id Params: ${JSON.stringify(req.params)}`);
        try {
            let id = req.params.id;
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };

            let category = await adminProductService.getCategoryOne(filter, true);

            if (!category) {
                return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
               
            }

          
            category.history = await adminHistoryService.adminFindAllHistory({ type: 'catalog', item_id: category.id  });
           
            log.info(`End /getCategory/:id  Result: ${JSON.stringify(category)}`);
            return res.status(200).json(category);

        } catch (error) {
            log.info(error);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

   

    getMarkById: async (req, res) => {
        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = { [Op.and]: [
            { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] },
            { type: config.MARK_TYPE.PRODUCT }
        ] };
        log.info(`Start /getMarkById/:id  Params: ${JSON.stringify(req.params.id)}`);
        try {
            let mark = await markService.getMarkByFilter(filter);
            if (!mark) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            mark = mark.toJSON();
            mark.history = await adminHistoryService.adminFindAllHistory({ type: 'mark', item_id: mark.id });
            log.info(`End /getMarkById/:id Result: ${JSON.stringify(mark)}`);
            return res.status(200).json(mark);

        } catch (error) {
            log.info(error);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

   

    getAttributeById: async (req, res) => {
       
        log.info(`Start /getAttributeById/:id Params: ${JSON.stringify(req.params.id)}`);
        try {
            let id = req.params.id;
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };

            let attribute = await adminProductService.getAttributeOne(filter, lang);

            if (!attribute) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            
            attribute.history = await adminHistoryService.adminFindAllHistory({ type: 'attribute', item_id: attribute.id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString() } });

            
            log.info(`End /getAttributeById/:id Result: ${JSON.stringify(attribute)}`);
            return res.status(200).json(attribute);

        } catch (error) {
            log.info(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

   

    saveMark: async (req, res) => {
        let { id, image, status, title, color } = req.body;
        let languages = config.LANGUAGES;
        log.info(`Start /saveMark Params: ${JSON.stringify(req.body)}`);
        let transaction = await sequelize.transaction();
        let result
        try {
            if (!id) {
                status = status ? status : config.GLOBAL_STATUSES.ACTIVE;
                let originMark;
                let mark;
                for (let lang of languages) {
                    let markData = {
                        lang: lang,
                        origin_id: originMark && originMark.id ? originMark.id : 0,
                        title,
                        status,
                        type: config.MARK_TYPE.PRODUCT,
                        color,
                        image_id: image && image.id ? image.id : null,
                    };
                   
                    mark = await markService.createMark(markData, transaction);

                    await adminHistoryService.adminCreateHistory({ item_id: mark.id, user_id: req.userid, type: 'mark' }, transaction);

                    if (!originMark) originMark = mark;

                    
                }
                originMark = await markService.getMarkByFilter({ id: originMark.id },transaction);
                originMark = originMark.toJSON();
                originMark.history = await adminHistoryService.adminFindAllHistory({ type: 'mark', item_id: originMark.id, created_at: { [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString() } },transaction);
                //return res.status(200).json(originMark);
                result = originMark
            } else {
                //update mark
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };
                let mark = await markService.getMarkByFilter(filter);
                if (!mark) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }

                let markObj = {
                    title,
                    status,
                    color
                }
                if(image && image.id) markObj.image_id = (image.origin_id === 0 ? image.id : image.origin_id)

                mark = await markService.updateMarkById(filter, markObj, transaction);

                await adminHistoryService.adminCreateHistory({ item_id: mark.id, user_id: req.userid, type: 'mark' }, transaction);
                mark = await markService.getMarkByFilter(filter, transaction);
                mark = mark.toJSON();
                mark.history = await adminHistoryService.adminFindAllHistory({ type: 'mark', item_id: id, created_at: { [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString() } }, transaction);

                const otherLangFilter = { [Op.or]: [{ id: id }, { origin_id: id }] };
                await markService.updateMarkById(otherLangFilter, {
                    status,
                }, transaction);

                
                log.info(`End /saveMark Result: ${JSON.stringify(mark)}`);
                //return res.status(200).json(mark);
                result = mark
            }
            await transaction.commit();
            log.info(`End /saveMark Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);
        } catch (error) {
            log.info(error);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    saveAttribute: async (req, res) => {
        
        log.info(`Start /saveAttribute  Params: ${JSON.stringify(req.body)}`);
        let { id, status, title, value, unit_of_measurement, type, group_atr, image, base, mat, price, mirror_thickness,
            attribute_values } = req.body;
        let languages = config.LANGUAGES;
        let result;
        let attribyte;
        let transaction = await sequelize.transaction();
        if(value){
            value = value.replace(/\s*,\s*/g, ",").replace(/(^,)|(,$)/g, "");
        }
        if(price) price = price*100;

        try {

            //Attribute base, mat, price validation
            // if(group_atr){
            //     let groupAtr = await attributesGroupsService.getAttributeGroupByFilter({id: group_atr})
            //     if(!groupAtr){
            //         return res.status(errors.BAD_REQUEST_INVALID_ATTRIBUTE_GROUP.code).json({
            //             message: errors.BAD_REQUEST_INVALID_ATTRIBUTE_GROUP.message,
            //             errCode: errors.BAD_REQUEST_INVALID_ATTRIBUTE_GROUP.code
            //         });
            //     }
            //     let checkGroup = groupAtr && groupAtr.type ? config.ATR_GROUP_TYPES[groupAtr.type] : null;
            //     if(checkGroup && checkGroup.validation){
            //         for (const key in checkGroup.validation) {
            //             if (Object.hasOwnProperty.call(checkGroup.validation, key)) {
            //                 let checkValue = function(num, key){
            //                     if(!num || num === '0'){
            //                         throw new Error(errors.BAD_REQUEST_INVALID_ATTRIBUTE_BASE_MAT_PRICE.message[key])  
            //                     }
            //                 };
            //                 if(key === 'base'){
            //                     checkValue(base, key);
            //                 }
            //                 if(key === 'mat'){
            //                     checkValue(mat, key);
            //                 }
            //                 if(key === 'price'){
            //                     checkValue(price, key);
            //                 }
            //                 if(key === 'mirror_thickness'){
            //                     checkValue(mirror_thickness, key);
            //                 }
            //             }
            //         }
            //     }else{
            //         return res.status(errors.BAD_REQUEST_INVALID_ATTRIBUTE_GROUP.code).json({
            //             message: errors.BAD_REQUEST_INVALID_ATTRIBUTE_GROUP.message,
            //             errCode: errors.BAD_REQUEST_INVALID_ATTRIBUTE_GROUP.code
            //         });
            //     }
            // }
                
            if (!id) {
                status = status ? status : config.GLOBAL_STATUSES.ACTIVE;
                let originAttribute;
                for (let lang of languages) {
                    let attribyteData = {
                        lang: lang,
                        origin_id: originAttribute && originAttribute.id ? originAttribute.id : 0,
                        title,
                        value,
                        unit_of_measurement,
                        status,
                        group_atr,
                        base,
                        mat,
                        mirror_thickness,
                        price,
                        image_id : image && image.id ? image.id : null,
                        // type: range && range.length ? "from-to" : null,
                    };
                    attribyte = await attributesService.createAttribute(attribyteData, attribute_values, transaction);
                    await adminHistoryService.adminCreateHistory({ item_id: attribyte.id, user_id: req.userid, type: 'attribute' }, transaction);

                    if (!originAttribute){
                        originAttribute = attribyte;
                        if(originAttribute.price) originAttribute.price = originAttribute.price/100;
                        // if(type && type == config.ATTRIBUTES_TYPE.FROM_TO && range && range.length){
                        //     originAttribute.range = await attributesService.createAttributeRanges(originAttribute, range, transaction);
                        // }
                    } 
                }
                originAttribute.history = await adminHistoryService.adminFindAllHistory({ type: 'attribute', item_id: originAttribute.id, created_at: { [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString() } }, transaction);
                result = originAttribute;
            
            } else {

                //update attribyte
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };
                attribyte = await attributesService.getAttributeByFilter(filter);
                if (!attribyte) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }
                let originId = attribyte.origin_id ? attribyte.origin_id : attribyte.id ;
                let attributeObj = {};
                let attributeObjOtherLang = {};

                if(title) attributeObj.title = title;
                if(unit_of_measurement) attributeObj.unit_of_measurement = unit_of_measurement;
                if(status) {
                    attributeObj.status = status;
                    attributeObjOtherLang.status = status;
                }
                if(value) {
                    attributeObj.value = value;
                }
                if(group_atr) {
                    attributeObj.group_atr = group_atr;
                    attributeObjOtherLang.group_atr = group_atr;
                }
                if(base) {
                    attributeObj.base = base;
                    attributeObjOtherLang.base = base;
                }
                if(mat) {
                    attributeObj.mat = mat;
                    attributeObjOtherLang.mat = mat;
                }
                if(price) {
                    attributeObj.price = price;
                    attributeObjOtherLang.price = price;
                }
                if(mirror_thickness) {
                    attributeObj.mirror_thickness = mirror_thickness;
                    attributeObjOtherLang.mirror_thickness = mirror_thickness;
                }
                if(image && image.id){
                    attributeObj.image_id = image.id;
                    attributeObjOtherLang.image_id = image.id;
                }else if(image === null){
                    attributeObj.image_id = image;
                    attributeObjOtherLang.image_id = image;
                }

                attribyte = await attributesService.updateAttributeById(filter, attributeObj, attribute_values, originId, lang, transaction);
    
                await adminHistoryService.adminCreateHistory({ item_id: attribyte.id, user_id: req.userid, type: 'attribute' }, transaction);
                attribyte.history = await adminHistoryService.adminFindAllHistory({ type: 'attribute', item_id: id, created_at: { [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString() } }, transaction);
    
                const otherLangFilter = { [Op.or]: [{ id: id }, { origin_id: id }] };

                await attributesService.updateAttributeById(otherLangFilter, attributeObjOtherLang, null, originId, lang, transaction);
                result = attribyte;
            }
            
            await transaction.commit();
            
            log.info(`End /saveAttribute Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    

    deleteProductAttribute: async (req, res) => {
        log.info(`Start /deleteProductAttribute. ids:${JSON.stringify(req.body)}`);
        let { ids } = req.body;
        let result = [];
        let transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                
                for (let id of ids) {
                    let attribute = await adminProductService.getAttributeOne({ id: id });

                    if (!attribute) {
                        result.push({ id: id, deleted: false, error: `Attribute not found with id:${id}` })
                    } else {

                        let otherLangsAttributeIds = await adminProductService.getAttributeAll({ [Op.or]: [{ id: id }, { origin_id: id }] });
                        otherLangsAttributeIds = otherLangsAttributeIds.map(i => i.id);
                        const attributeIdsFilter = { [Op.in]: otherLangsAttributeIds };

                        if (attribute.status === config.GLOBAL_STATUSES.DELETED) {
                            await adminProductService.deleteProductAttribute(attributeIdsFilter, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'attribute' }, transaction);
                        } else {
                            attribute = await adminProductService.saveAttribute(attributeIdsFilter, { status: config.GLOBAL_STATUSES.DELETED }, transaction);
                            result.push(attribute);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'attribute' }, transaction);
                        }

                    }
                }
                await transaction.commit();
            }
            log.info(`End /deleteProductAttribute ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(error);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },


    deleteCategory: async (req, res) => {
        
        log.info(`Start /deleteCategory  Params: ${JSON.stringify(req.body)}`);
        let { ids } = req.body;
        let result = [];
        let subCategoryOriginIds;
        let transaction = await sequelize.transaction();
        try {

            if (ids && ids.length) {
                
                for (let id of ids) {
                    let category = await adminProductService.getCategoryOne({ id: id });
                    if (!category) {
                        result.push({ id: id, deleted: false, error: `Category not found with id:${id}` });
                    }else{
                        if (category.status === config.GLOBAL_STATUSES.DELETED) {
                            await deleteCategoryByOriginId(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'catalog' }, transaction);

                            let isHaveSubCategory = await adminProductService.getCategories({ parent_id: id }, transaction);
                            if(isHaveSubCategory && isHaveSubCategory.length){
                                subCategoryOriginIds = isHaveSubCategory
                                    .filter(el => el.origin_id === 0)
                                    .map(el => el.id);
                                if(subCategoryOriginIds && subCategoryOriginIds.length){
                                    isHaveSubCategory = true;
                                }else{
                                    subCategoryOriginIds = null;
                                }
                            }
                            while (isHaveSubCategory) {
                                if(subCategoryOriginIds){
                                    await deleteCategoryByOriginId(subCategoryOriginIds, transaction);
                                    isHaveSubCategory = await adminProductService.getCategories({ parent_id: {[Op.in]: subCategoryOriginIds} }, transaction);
                                    if(isHaveSubCategory && isHaveSubCategory.length){
                                        subCategoryOriginIds = isHaveSubCategory
                                            .filter(el => el.origin_id === 0)
                                            .map(el => el.id);
                                        if(subCategoryOriginIds && subCategoryOriginIds.length){
                                        }else{
                                            isHaveSubCategory = false;
                                        }
                                    }else{
                                        isHaveSubCategory = false;
                                    }
                                }else{
                                    isHaveSubCategory = false;
                                }
                            }
    
                        } else {

                            category = await categorieService.updateCategory( { [Op.or]: [{ id: id }, { origin_id: id }] },
                                { status: config.GLOBAL_STATUSES.DELETED },
                                transaction );
                            let isHaveSubCategory = await adminProductService.getCategories({ parent_id: id }, transaction);
                            if(isHaveSubCategory && isHaveSubCategory.length){
                                subCategoryOriginIds = isHaveSubCategory
                                    .filter(el => el.origin_id === 0)
                                    .map(el => el.id);
                                if(subCategoryOriginIds && subCategoryOriginIds.length){
                                    isHaveSubCategory = true;
                                }else{
                                    subCategoryOriginIds = null;
                                }
                            }
                            while (isHaveSubCategory) {
                                if(subCategoryOriginIds){
                                    await categorieService.updateCategory( { [Op.or]: [{ id: {[Op.in]: subCategoryOriginIds} }, { origin_id: {[Op.in]: subCategoryOriginIds} }] },
                                        { status: config.GLOBAL_STATUSES.DELETED },
                                    transaction );
                                    isHaveSubCategory = await adminProductService.getCategories({ parent_id: {[Op.in]: subCategoryOriginIds} }, transaction);
                                    if(isHaveSubCategory && isHaveSubCategory.length){
                                        subCategoryOriginIds = isHaveSubCategory
                                            .filter(el => el.origin_id === 0)
                                            .map(el => el.id);
                                        if(subCategoryOriginIds && subCategoryOriginIds.length){
                                            
                                        }else{
                                            isHaveSubCategory = false;
                                        }
                                    }else{
                                        isHaveSubCategory = false;
                                    }
                                }else{
                                    isHaveSubCategory = false;
                                }
                            }
                            result.push(category);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'catalog' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End /deleteCategory Result: ${JSON.stringify(result)}`);
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

    deleteMark: async (req, res) => {
        let { ids } = req.body;
        let result = [];
        log.info(`Start /deleteMark Params: ${JSON.stringify(req.body)}`);
        const transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                
                for (let id of ids) {
                    let mark = await markService.getMarkByFilter({ id: id });
                    if (!mark) {
                        result.push({ id: id, deleted: false, error: `Mark not found with id:${id}` })
                    } else {
                        if (mark.status === config.GLOBAL_STATUSES.DELETED) {
                            await markService.deleteMarkById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'mark' }, transaction);
                        } else {
                            mark = await markService.updateMarkById({ [Op.or]: [{ id: id }, { origin_id: id }] }, 
                                { status: config.GLOBAL_STATUSES.DELETED }, transaction);
                            result.push(mark);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'mark' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End /deleteMark  Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(error);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
  

    saveCategory: async (req, res) => {

        log.info(`Start /saveCategory Params: ${JSON.stringify(req.body)}`);
        let { image, meta_data, status, title, id, parent_id, comparison, 
            sections, attributes, attribute_groups, configurator_image, slug, characteristics_image, reviews_image} = req.body;
        let languages = config.LANGUAGES;
        let transaction;
        let result;
        let category;
        try {
            transaction = await sequelize.transaction();
            let seoData = sections && sections.length && sections[0].body && sections[0].body.length && sections[0].body[0].content ? sections[0].body[0].content : null;
            if (!id) {
                //create category
                status = status ? status : config.GLOBAL_STATUSES.ACTIVE;
                let originCategory;
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

                    let categoryData = {
                        lang: lang,
                        origin_id: originCategory && originCategory.id ? originCategory.id : 0,
                        title: title ? title : null,
                        parent_id: parent_id ? parent_id : 0,
                        image_id : image && image.id ? image.id : null,
                        characteristics_image_id : characteristics_image && characteristics_image.id ? characteristics_image.id : null,
                        reviews_image_id : reviews_image && reviews_image.id ? reviews_image.id : null,
                        configurator_image_id : configurator_image && configurator_image.id ? configurator_image.id : null,
                        attribute_groups: attribute_groups && attribute_groups.length ? JSON.stringify(attribute_groups) : null,
                        status,
                        seo_title: seoData && seoData.title ? seoData.title : null, 
                        seo_text: seoData && seoData.text ? seoData.text : null,
                        seo_hidden_text: seoData && seoData.text_2 ? seoData.text_2 : null
                    };

                    category = await categorieService.createCategory(categoryData,  transaction);
                    let link = await linksService.createLink({ slug: currentSlug, original_link: `/shop/getCategory/${category.id}`, type: 'catalog',lang }, transaction);
                    if(link) category.slug = link.slug;

                    let metaData;
                    if (meta_data){
                        metaData = { url: `/shop/getCategory/${category.id}` };
                        if(meta_data.meta_title){
                            metaData.meta_title = meta_data.meta_title;
                        } else  metaData.meta_title = title
                        if(meta_data.meta_desc) {
                            metaData.meta_desc = meta_data.meta_desc;
                        } else metaData.meta_desc = null
                        if(meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                        if(meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;
                    }
                    if(metaData) category.meta_data = await metaDataService.createMetaData(metaData, transaction);

                    await adminHistoryService.adminCreateHistory({item_id: category.id, user_id: req.userid, type: 'catalog'}, transaction);

                    if(!originCategory) originCategory = category;
                    if(parent_id) parent_id++;
    
                }
                result = originCategory;
            }else{
                //update category
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = {[Op.or]:[ { id: id, lang: lang }, { origin_id: id, lang: lang } ]};
    
                category = await adminProductService.getCategoryOne(filter);
                if (!category) {
                    await transaction.rollback();
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }
                let origin_id = category.origin_id ? category.origin_id : category.id;
                let link = await linksService.getLinkByFilter({original_link: `/shop/getCategory/${category.id}`,lang});
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
    
                let [ findedMetaData, isCreated ] = await metaDataService.findOrCreateMetaData({where: {url: `/shop/getCategory/${category.id}`}, defaults: (metaData.url ? metaData : {...metaData, url: `/shop/getCategory/${category.id}`}) }, transaction);
                if( findedMetaData && !isCreated ) {
                    await findedMetaData.update(metaData,{transaction});
                }
  
                let categoryData = {};
                let updateCategorieObj = {};
                if(title) categoryData.title = title;
                if(image && image.id){
                    categoryData.image_id = image.id;
                    updateCategorieObj.image_id = image.id;
                }else if(image == null){
                    categoryData.image_id = image;
                    updateCategorieObj.image_id = image;
                }
                if(characteristics_image && characteristics_image.id){
                    categoryData.characteristics_image_id = characteristics_image.id;
                    updateCategorieObj.characteristics_image_id = characteristics_image.id;
                }else if(characteristics_image == null){
                    categoryData.characteristics_image_id = characteristics_image;
                    updateCategorieObj.characteristics_image_id = characteristics_image;
                }
                if(reviews_image && reviews_image.id){
                    categoryData.reviews_image_id = reviews_image.id;
                    updateCategorieObj.reviews_image_id = reviews_image.id;
                }else if(reviews_image == null){
                    categoryData.reviews_image_id = reviews_image;
                    updateCategorieObj.reviews_image_id = reviews_image;
                }
                if(configurator_image && configurator_image.id){
                    categoryData.configurator_image_id = configurator_image.id;
                    updateCategorieObj.configurator_image_id = configurator_image.id;
                }else if(configurator_image == null){
                    categoryData.configurator_image_id = configurator_image;
                    updateCategorieObj.configurator_image_id = configurator_image;
                }
                if(attribute_groups && attribute_groups.length) categoryData.attribute_groups = JSON.stringify(attribute_groups);
                if(status) {
                    categoryData.status = status;
                    updateCategorieObj.status = status;
                }
                if(seoData && seoData.title){
                    categoryData.seo_title = seoData.title;
                } else categoryData.seo_title = null
                if(seoData && seoData.text){
                    categoryData.seo_text = seoData.text;
                } else categoryData.seo_text = null
                if(seoData && seoData.text_2){
                    categoryData.seo_hidden_text = seoData.text_2;
                } else categoryData.seo_hidden_text = null

                category = await categorieService.updateCategory(category.id, categoryData, transaction, parent_id, origin_id );
                link = await linksService.getLinkByFilter({original_link: `/shop/getCategory/${category.id}`,lang}, transaction);
                if(link && link.slug) category.slug = link.slug;
                category.meta_data = await productService.getMetaDataBySlagOrUrl(`/shop/getCategory/${category.id}`, transaction);
                await adminHistoryService.adminCreateHistory({item_id: category.id, user_id: req.userid, type: 'catalog'}, transaction);
                category.history = await adminHistoryService.adminFindAllHistory({type:'catalog', item_id: category.id, created_at: {[Op.gte] : new Date(Date.now()-config.TIME_CONST).toISOString()}}, transaction);
    
                const otherLangFilter = {[Op.or]:[ { id: id }, { origin_id: id } ]};
                await categorieService.updateCategory( otherLangFilter, updateCategorieObj, transaction );

                //update sub categories
                if(status){
                    let subCategoryOriginIds;
                    let isHaveSubCategory = await adminProductService.getCategories({ parent_id: id }, transaction);
                    if(isHaveSubCategory && isHaveSubCategory.length){
                        subCategoryOriginIds = isHaveSubCategory
                            .filter(el => el.origin_id === 0)
                            .map(el => el.id);
                        if(subCategoryOriginIds && subCategoryOriginIds.length){
                            subCategoryOriginIds = {[Op.in]: subCategoryOriginIds};
                            isHaveSubCategory = true;
                        }else{
                            subCategoryOriginIds = null;
                        }
                    }
                    while (isHaveSubCategory) {
                        if(subCategoryOriginIds){
                            await categorieService.updateCategory( { [Op.or]: [{ id: subCategoryOriginIds }, { origin_id: subCategoryOriginIds }] },
                                { status: status },
                            transaction );
                            isHaveSubCategory = await adminProductService.getCategories({ parent_id: subCategoryOriginIds }, transaction);
                            if(isHaveSubCategory && isHaveSubCategory.length){
                                subCategoryOriginIds = isHaveSubCategory
                                    .filter(el => el.origin_id === 0)
                                    .map(el => el.id);
                                if(subCategoryOriginIds && subCategoryOriginIds.length){
                                    subCategoryOriginIds = {[Op.in]: subCategoryOriginIds};
                                }else{
                                    isHaveSubCategory = false;
                                }
                            }else{
                                isHaveSubCategory = false;
                            }
                        }else{
                            isHaveSubCategory = false;
                        }
                    }
                }

                result = category; 
            }
            await transaction.commit();
            log.info(`End /saveCategory  result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
        log.info(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: 400
            });
        }
    },

    saveProduct: async (req, res) => {
        log.info(`Start /saveProduct Params: ${JSON.stringify(req.body)}`);
        
            let { id, title, image, hover_image, gallery, body, slug, status, short_description, description,
                sku, quantity, name, product_marks, category, product_attribute, together_cheaper, recommended_products,
                meta_data, base, mat, dimensions, min_s, max_s, min_h, max_h, characteristics, steps,
                characteristics_image, reviews_image, type, price, discounted_price, shower_type,
                s, h, d, l, l1, l2, m, discount, show_price_from, product_variations } = req.body;

            const isUpdateStatus =  req.body && Object.keys(req.body).length === 2 && req.body.id && req.body.status ? true : false;
            const languages = config.LANGUAGES;
            let result;
            let product;
            let addition;
            let informer = []
            let transaction = await sequelize.transaction();
            try {
                if(!id){
                    if (!type || ![config.PRODUCT_TYPES.GLASS, config.PRODUCT_TYPES.SHOWER, config.PRODUCT_TYPES.SIMPLE, config.PRODUCT_TYPES.SIMPLE_VARIATIONS].includes(type)) {
                        await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_INVALID_PRODUCT_TYPE.code).json({
                            message: errors.BAD_REQUEST_INVALID_PRODUCT_TYPE.message,
                            errCode: errors.BAD_REQUEST_INVALID_PRODUCT_TYPE.code,
                        });
                    }
                    if(type == config.PRODUCT_TYPES.GLASS){
                        if (!base || !mat || !min_s || !max_s || !min_h || !max_h || !dimensions || !dimensions.length) {
                            await transaction.rollback();
                            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                            });
                        }
                        let countPrice = productPriceUtil.countPrice(req.body, true, false);
                        if(countPrice){
                            price = countPrice.price;
                            discounted_price = countPrice.discounted_price;
                        }
                    }else if(type == config.PRODUCT_TYPES.SHOWER){

                        
                        if(req.body.l && req.body.l.informer){
                            req.body.l.informer.value = "l"
                            informer.push(req.body.l.informer)
                        }
                    
                    
                        if(req.body.l1 && req.body.l1.informer){
                            req.body.l1.informer.value = "l1"
                            informer.push(req.body.l1.informer)
                        }
                    
                        if(req.body.l2 && req.body.l2.informer){
                            req.body.l2.informer.value = "l2"
                            informer.push(req.body.l2.informer)
                        }
                    
                        if(req.body.m && req.body.m.informer){
                            req.body.m.informer.value = "m"
                            informer.push(req.body.m.informer)
                        }
                    
                        if(req.body.d && req.body.d.informer){
                            req.body.d.informer.value = "d"
                            informer.push(req.body.d.informer)
                        }
                
                        if(req.body.s && req.body.s.informer){
                            req.body.s.informer.value = "s"
                            informer.push(req.body.s.informer)
                        }
                    
                        if(req.body.h && req.body.h.informer){
                            req.body.h.informer.value = "h"
                            informer.push(req.body.h.informer)
                        }


                        if (!shower_type || ![config.SHOWER_TYPES.BLINDS, config.SHOWER_TYPES.WALK, config.SHOWER_TYPES.DOORS, config.SHOWER_TYPES.BOX].includes(shower_type)) {
                            await transaction.rollback();
                            return res.status(errors.BAD_REQUEST_INVALID_PRODUCT_SHOWER_TYPE.code).json({
                                message: errors.BAD_REQUEST_INVALID_PRODUCT_SHOWER_TYPE.message,
                                errCode: errors.BAD_REQUEST_INVALID_PRODUCT_SHOWER_TYPE.code,
                            });
                        }

                        if(shower_type == config.SHOWER_TYPES.BLINDS){
                            if (!base || !mat || !s || !h || !d || !s.min || !s.value || !s.max || !h.min || !h.value || !h.max ) {
                                await transaction.rollback();
                                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                                });
                            }
                        }else if(shower_type == config.SHOWER_TYPES.DOORS){
                            if (!base || !mat || !s || !h || !l1 || !l2 || !s.min || !s.value || !s.max || !h.min || !h.value || !h.max ) {
                                await transaction.rollback();
                                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                                });
                            }
                        }else if(shower_type == config.SHOWER_TYPES.WALK){
                            if (!base || !mat || !h || !s || !l || !m || !l1 || !l2  || !h.min || !h.value || !h.max ) {
                                await transaction.rollback();
                                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                                });
                            }
                        }else if(shower_type == config.SHOWER_TYPES.BOX){
                            if (!base || !mat || !h || !h.min || !h.value || !h.max ) {
                                await transaction.rollback();
                                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                                });
                            }
                        }
                        let shower_has_required_default_glass = false
                        if(req.body.steps && req.body.steps.length){
                            for(let item of req.body.steps){
                                if(config.SHOWER_GLASS_STEP_IDS.includes(item.id)){
                                    if(item.attribute_groups && item.attribute_groups.length){
                                        for(let attrGr of item.attribute_groups){
                                            if(attrGr.attributes && attrGr.attributes.length){
                                                for(let attr of attrGr.attributes){
                                                    if(attr && attr.is_default){
                                                        if(attr.discount){
                                                            req.body.mat = Math.ceil(attr.price - (attr.price * (attr.discount / 100)));
                                                        } else {
                                                            req.body.mat = attr.price
                                                        }
                                                        req.body.changedMat = true
                                                        req.body.changedMatAtrId = attr.id
                                                        shower_has_required_default_glass= true
                                                    }        
                                                }
                                            }
                                        }
                                    }
                                }   
                            }
                        }
                        if(type == config.PRODUCT_TYPES.SHOWER && !shower_has_required_default_glass){
                            await transaction.rollback();
                            return res.status(errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.code).json({
                                message: errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.message,
                                errCode: errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.code,
                            });
                        }
                        let countPrice = productPriceUtil.countShowerPrice(req.body, true, false,null, null, null, null,null,null,null,null,null,req.body.changedMat,req.body.changedMatAtrId);
                        /////////////////////////////////////////// MAT ALWAYS 1 FOR SHOWERS !!!!
                        if(type == config.PRODUCT_TYPES.SHOWER){
                            countPrice.mat = 1
                            req.body.mat = 1
                        } 
                        if(countPrice){
                            price = countPrice.price;
                            discounted_price = countPrice.discounted_price;
                        }
                        addition = { s, h, d, l, l1, l2, m, discount };
                    }else if(type == config.PRODUCT_TYPES.SIMPLE){
                        price = price ? price*100 : null;
                        discounted_price = discounted_price ? discounted_price*100 : null;
                    }else if(type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                        if (!product_variations || !product_variations.name || !product_variations.variations || !product_variations.variations.length ) {
                            await transaction.rollback();
                            return res.status(errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.code).json({
                                message: errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.message,
                                errCode: errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.code,
                            });
                        }

                    }

                    if (!price && type != config.PRODUCT_TYPES.SIMPLE_VARIATIONS) {
                        await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                            message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                            errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                        });
                    }

                    status = status ? status : config.GLOBAL_STATUSES.WAITING;
                    let originProduct;
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
    
                        let productData = {
                            lang: lang,
                            origin_id: originProduct && originProduct.id ? originProduct.id : 0,
                            title,
                            image_id : image && image.id ? image.id : null,
                            hover_image_id : hover_image && hover_image.id ? hover_image.id : null,
                            status,
                            short_description, 
                            description,
                            price: price ? price : null,
                            type: type ? type : config.PRODUCT_TYPES.GLASS,
                            show_price_from: show_price_from ? show_price_from : null,
                            shower_type: shower_type ? shower_type : null,
                            discounted_price: discounted_price ? discounted_price : null, 
                            name,
                            base, 
                            mat,
                            sku,
                            quantity,
                            availability: quantity && quantity == 0 ? 0 : 1,
                            min_s, 
                            max_s, 
                            min_h, 
                            max_h, 
                            characteristics: characteristics && characteristics.length ? JSON.stringify(characteristics) : null,
                            characteristics_image_id : characteristics_image && characteristics_image.id ? characteristics_image.id : null,
                            reviews_image_id : reviews_image && reviews_image.id ? reviews_image.id : null,
                            informer: informer && informer.length ? JSON.stringify(informer) : null 
                        };

                        let product_body = extraUtil.convertProductBodyForDBFormat(body);
                        if(product_body && product_body.length) productData.product_contents = product_body;
    
                        product = await productService.createProduct(productData, dimensions, gallery, product_marks, category, product_attribute, together_cheaper, recommended_products, steps, lang, false, addition, product_variations, transaction);
                        let link = await linksService.createLink({ slug: currentSlug, original_link: `/shop/getProduct/${product.id}`, type: 'product',lang }, transaction);
                        if(link) product.slug = link.slug;
    
                        let metaData;
                        if (meta_data){
                            metaData = { url: `/shop/getProduct/${product.id}` };
                            if(meta_data.meta_title){
                                metaData.meta_title = meta_data.meta_title;
                            } else  metaData.meta_title = name
                            if(meta_data.meta_desc) {
                                metaData.meta_desc = meta_data.meta_desc;
                            } else metaData.meta_desc = removeTags(short_description)
                            if(meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                            if(meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;
                        }
                        if(metaData) product.meta_data = await metaDataService.createMetaData(metaData, transaction);
    
                        await adminHistoryService.adminCreateHistory({item_id: product.id, user_id: req.userid, type: 'product'}, transaction);
    
                        if(!originProduct) originProduct = product;
    
                    }
                    result = originProduct;
                
                } else if(status == config.GLOBAL_STATUSES.DUPLICATE_POST){
                    
                    let link;
                    let originProduct;
                    for(let lang of languages) {
                        let filter = {[Op.or]:[ { id: id, lang: lang }, { origin_id: id, lang: lang } ]};
                        product = await productService.getProduct(filter, transaction, true);
                        if (!product) {
                            return res.status(400).json({
                                message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                                errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                            });
                        }

                        link = await linksService.getLinkByFilter({ original_link: `/shop/getProduct/${product.id}`, lang })
                        if(link && link.slug){
                            link = link.slug;
                        }else{
                             link = slugify(product.name);
                        }

                        let { dimensions, gallery, product_marks, category, product_attribute, together_cheaper, recommended_products, steps, product_variations} = product;
                        delete product.id;
                        product = extraUtil.removeFields(product, ['product_id', 'created_at', 'updated_at']);

                        product.status = config.GLOBAL_STATUSES.WAITING;
                        product.origin_id = originProduct && originProduct.id ? originProduct.id : 0;
                        if(product.characteristics) product.characteristics = JSON.stringify(product.characteristics);

                        product = await productService.createProduct(product, dimensions, gallery, product_marks, category, product_attribute, together_cheaper, recommended_products, steps, lang, true, addition, product_variations, transaction);
    
                        link = await linksService.createLink({ slug: `${link}-${product.id}`, original_link: `/shop/getProduct/${product.id}`, type: 'product',lang }, transaction);
                        if(link) product.slug = link.slug;
    
                        let metaData = await metaDataService.getMetaDataBySlugOrUrl(`/shop/getProduct/${product.id}`, transaction);
                        if (metaData) {
                            metaData = extraUtil.removeFields(metaData.toJSON(), ["id", "url"]);
                            metaData.url = `/shop/getProduct/${product.id}`;
                            product.meta_data = await metaDataService.createMetaData(metaData, transaction);
                        }
    
                        await adminHistoryService.adminCreateHistory({item_id: product.id, user_id: req.userid, type: 'product'}, transaction);
    
                        if(!originProduct) originProduct = product;
    
                    }
                    result = originProduct;

                } else {

                    if(!isUpdateStatus){
                        if (!type || ![config.PRODUCT_TYPES.GLASS, config.PRODUCT_TYPES.SHOWER, config.PRODUCT_TYPES.SIMPLE, config.PRODUCT_TYPES.SIMPLE_VARIATIONS].includes(type)) {
                            await transaction.rollback();
                            return res.status(errors.BAD_REQUEST_INVALID_PRODUCT_TYPE.code).json({
                                message: errors.BAD_REQUEST_INVALID_PRODUCT_TYPE.message,
                                errCode: errors.BAD_REQUEST_INVALID_PRODUCT_TYPE.code,
                            });
                        }
                        let countPrice;
                        if(type == config.PRODUCT_TYPES.GLASS){
                            countPrice = productPriceUtil.countPrice(req.body, true, false);
                        }else if(type == config.PRODUCT_TYPES.SHOWER){
                            if(req.body.l && req.body.l.informer){
                                req.body.l.informer.value = "l"
                                informer.push(req.body.l.informer)
                            }
                            if(req.body.l1 && req.body.l1.informer){
                                req.body.l1.informer.value = "l1"
                                informer.push(req.body.l1.informer)
                            }
                            if(req.body.l2 && req.body.l2.informer){
                                req.body.l2.informer.value = "l2"
                                informer.push(req.body.l2.informer)
                            }
                            if(req.body.m && req.body.m.informer){
                                req.body.m.informer.value = "m"
                                informer.push(req.body.m.informer)
                            }
                            if(req.body.d && req.body.d.informer){
                                req.body.d.informer.value = "d"
                                informer.push(req.body.d.informer)
                            }
                            if(req.body.s && req.body.s.informer){
                                req.body.s.informer.value = "s"
                                informer.push(req.body.s.informer)
                            }
                            if(req.body.h && req.body.h.informer){
                                req.body.h.informer.value = "h"
                                informer.push(req.body.h.informer)
                            } 
                        


                            let shower_has_required_default_glass = false
                            if(req.body.steps && req.body.steps.length){
                                for(let item of req.body.steps){
                                    if(config.SHOWER_GLASS_STEP_IDS.includes(item.id)){
                                        if(item.attribute_groups && item.attribute_groups.length){
                                            for(let attrGr of item.attribute_groups){
                                                if(attrGr.attributes && attrGr.attributes.length){
                                                    for(let attr of attrGr.attributes){
                                                        if(attr && attr.is_default){
                                                            if(attr.discount){
                                                                req.body.mat = Math.ceil(attr.price - (attr.price * (attr.discount / 100)));
                                                            } else {
                                                                req.body.mat = attr.price
                                                            }
                                                            req.body.changedMat = true
                                                            req.body.changedMatAtrId = attr.id
                                                            shower_has_required_default_glass = true
                                                        }         
                                                    }
                                                }
                                            }
                                        } 
                                    } 
                                }
                            }

                            if(type == config.PRODUCT_TYPES.SHOWER && !shower_has_required_default_glass){
                                    await transaction.rollback();
                                    return res.status(errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.code).json({
                                        message: errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.message,
                                        errCode: errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.code,
                                    });
                            }
                            countPrice = productPriceUtil.countShowerPrice(req.body, true, false, null, null, null, null,null,null,null,null,null,req.body.changedMat,req.body.changedMatAtrId);
                            /////////////////////////////////////////// MAT ALWAYS 1 FOR SHOWERS !!!!
                            if(type == config.PRODUCT_TYPES.SHOWER){
                                countPrice.mat = 1
                                req.body.mat = 1
                            } 
                        }else if(type == config.PRODUCT_TYPES.SIMPLE){
                            price = price ? price*100 : null;
                            discounted_price = discounted_price ? discounted_price*100 : null;
                        }
                        if(countPrice){
                            price = countPrice.price;
                            discounted_price = countPrice.discounted_price;
                        }  
                        if(type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                            if (!product_variations || !product_variations.name || !product_variations.variations || !product_variations.variations.length ) {
                                await transaction.rollback();
                                return res.status(errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.code).json({
                                    message: errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.message,
                                    errCode: errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.code,
                                });
                            }
                        }
                    }

                    const lang = req.body.lang ? req.body.lang : languages[0];
                    const filter = {[Op.or]:[ { id: id, lang: lang }, { origin_id: id, lang: lang } ]};
        
                    product = await productService.getProduct(filter, transaction);
                    if (!product) {
                       return res.status(400).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                        });
        
                    }
                    if(type == config.PRODUCT_TYPES.SHOWER){
                        product.mat = 1
                    } 
                    let originProdId = product.origin_id ? product.origin_id : product.id;
                    let oldProduct = product;
                    let link = await linksService.getLinkByFilter({original_link: `/shop/getProduct/${product.id}`,lang});
        
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
                        } else  metaData.meta_title = name
                        if(meta_data.meta_desc) {
                            metaData.meta_desc = meta_data.meta_desc;
                        } else metaData.meta_desc = removeTags(short_description)
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
        
                    let [ findedMetaData, isCreated ] = await metaDataService.findOrCreateMetaData({where: {url: `/shop/getProduct/${product.id}`}, defaults: (metaData.url ? metaData : {...metaData, url: `/shop/getProduct/${product.id}`}) }, transaction);
                    if( findedMetaData && !isCreated ) {
                        await findedMetaData.update(metaData,{transaction});
                    }
        
                    const bodyData = extraUtil.convertProductBodyForDBFormat(body, product.id);
      
                    let productData = {};
                    let updateProductObj = {};
                        
                    if(title) productData.title = title;
                    if(informer && informer.length) {
                        productData.informer = JSON.stringify(informer)
                    } else productData.informer = null
                    if(short_description) productData.short_description = short_description;
                    if(description) productData.description = description;
                    if(name) productData.name = name;
                    if(status) {
                        productData.status = status;
                        updateProductObj.status = status;
                    };
                    if(base) {
                        productData.base = base;
                        updateProductObj.base = base;
                    };
                    if(mat) {
                        productData.mat = mat
                        updateProductObj.mat = mat;
                    };
                    if(min_s) {
                        productData.min_s = min_s;
                        updateProductObj.min_s = min_s;
                    };
                    if(max_s) {
                        productData.max_s = max_s;
                        updateProductObj.max_s = max_s;
                    };
                    if(min_h) {
                        productData.min_h = min_h;
                        updateProductObj.min_h = min_h;
                    };
                    if(max_h) {
                        productData.max_h = max_h;
                        updateProductObj.max_h = max_h;
                    };
                    if(characteristics && characteristics.length) {
                        productData.characteristics = JSON.stringify(characteristics);
                    };
                    if(price) {
                        productData.price = price;
                        updateProductObj.price = price;
                    };
                    if(discounted_price || discounted_price == 0 || discounted_price == null) {
                        productData.discounted_price = discounted_price ? discounted_price : null;
                        updateProductObj.discounted_price = discounted_price ? discounted_price : null;
                    };
                    if(sku) {
                        productData.sku = sku;
                        updateProductObj.sku = sku;
                    };
                    if(!isUpdateStatus) {
                        productData.quantity =  quantity ? quantity : null;
                        updateProductObj.quantity =  quantity ? quantity : null;
                        if(quantity === 0 || quantity === '0'){
                            productData.quantity = 0;
                            updateProductObj.quantity = 0;
                            productData.availability =  0;
                            updateProductObj.availability =  0;
                        }else{
                            productData.availability =  1;
                            updateProductObj.availability =  1;
                        }
                    }

                    if(image && image.id){
                        productData.image_id = image.id;
                        updateProductObj.image_id = image.id;
                    }else if(image === null){
                        productData.image_id = image;
                        updateProductObj.image_id = image;
                    }
                    if(hover_image && hover_image.id){
                        productData.hover_image_id = hover_image.id;
                        updateProductObj.hover_image_id = hover_image.id;
                    }else if(hover_image === null){
                        productData.hover_image_id = hover_image;
                        updateProductObj.hover_image_id = hover_image;
                    }
                    if(characteristics_image && characteristics_image.id){
                        productData.characteristics_image_id = characteristics_image.id;
                        updateProductObj.characteristics_image_id = characteristics_image.id;
                    }else if(characteristics_image === null){
                        productData.characteristics_image_id = characteristics_image;
                        updateProductObj.characteristics_image_id = characteristics_image;
                    }
                    if(reviews_image && reviews_image.id){
                        productData.reviews_image_id = reviews_image.id;
                        updateProductObj.reviews_image_id = reviews_image.id;
                    }else if(reviews_image === null){
                        productData.reviews_image_id = reviews_image;
                        updateProductObj.reviews_image_id = reviews_image;
                    }
                    if(type) {
                        productData.type = type;
                        updateProductObj.type = type;
                    };
                    if(shower_type) {
                        productData.shower_type = shower_type;
                        updateProductObj.shower_type = shower_type;
                    };
                    if(show_price_from || typeof show_price_from !== 'undefined') {
                        productData.show_price_from = show_price_from;
                        updateProductObj.show_price_from = show_price_from;
                    };

                    addition = { s, h, d, l, l1, l2, m, discount };

                    product = await productService.updateProduct(product.id, originProdId, product.lang, productData, bodyData, dimensions, gallery, product_marks, category, product_attribute, together_cheaper, recommended_products, steps, addition, product_variations, transaction );
                    link = await linksService.getLinkByFilter({original_link: `/shop/getProduct/${product.id}`,lang}, transaction);
                    if(link && link.slug) product.slug = link.slug;
                    product.meta_data = await productService.getMetaDataBySlagOrUrl(`/shop/getProduct/${product.id}`, transaction);
                    await adminHistoryService.adminCreateHistory({item_id: product.id, user_id: req.userid, type: 'product'}, transaction);
                    product.history = await adminHistoryService.adminFindAllHistory({type:'product', item_id: product.id, created_at: {[Op.gte] : new Date(Date.now()-config.TIME_CONST).toISOString()}}, transaction);
        
                    const otherLangFilter = {[Op.or]:[ { id: id }, { origin_id: id } ]};
                    await productService.updateProductById( otherLangFilter, updateProductObj, transaction );
                    if(type == config.PRODUCT_TYPES.SHOWER){
                        product.mat = 1
                    } 
                    //Inform user when product availabile
                    if(oldProduct && oldProduct.quantity == 0 && req.body.quantity > 0) {
                      
                        let userToInform = await informProductAvailabilityService.getInformProductAvailabilitysByFilter({
                            product_id: id , status: config.GLOBAL_STATUSES.ACTIVE
                        });
                      
                        if(userToInform && userToInform.length){
                            for (let user of userToInform) {
                                let mailObj = {
                                    to: user.email,
                                    subject: `${productData.name} ${config.TEXTS[lang].now_available}`,
                                    data: {
                                        userName: user.name,
                                        userEmail: user.email,
                                        productName: productData.name, 
                                        productId: id,
                                        frontUrl: config.FRONT_URL,
                                        productLink:product.slug,
                                        product: product,
                                        lang: lang
                                    }
                                };
                                await emailUtil.sendMail(mailObj, 'inform-user-about-product');
                            }
                        }
                    } 
        
                    
                    result = product; 
                }
                
            await transaction.commit();
            log.info(`End /saveProduct  Result: ${JSON.stringify(result)}`);
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

    getProduct: async (req, res) => {
        log.info(`Start /getProduct. id: ${req.params.id}`);
        try {
            let id = req.params.id;
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };
            let result = await productService.getProduct(filter);
            if (!result) {
                return res.status(400).json({
                     message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                     errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                 });
            }
            if(result.type == config.PRODUCT_TYPES.SHOWER){
                result.mat = 1
            } 
            link = await linksService.getLinkByFilter({original_link: `/shop/getProduct/${result.id}`,lang});
            result.slug = link && link.slug ? link.slug : null;
            result.meta_data = await productService.getMetaDataBySlagOrUrl(`/shop/getProduct/${result.id}`);
            result.history = await adminHistoryService.adminFindAllHistory({ type: 'product', item_id: result.id, created_at: {[Op.gte] : new Date(Date.now()-config.TIME_CONST).toISOString()} });
            result.together_cheaper = result.together_cheaper_products;
            delete result.together_cheaper_products;


            if(result && result.product_attribute){
                let arr = []
                for(let attr of result.product_attribute){
                    if(attr.id) arr.push(attr)
                }
                result.product_attribute = arr
            }
            log.info(`End /getProduct. Result: ${result}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    

    deleteProducts: async (req, res) => {
        log.info(`Start /deleteProducts. ids:${JSON.stringify(req.body)}`);
        let { ids } = req.body;
        const languages = config.LANGUAGES;
        let result = [];
        let transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                
                for (let id of ids) {
                    let product = await productService.getProduct({ id });
                    if (!product) {
                        result.push({ id: id, deleted: false, error: `Product not found with id:${id}` });
                    }else{
                        if (product.status === config.GLOBAL_STATUSES.DELETED) {
                            let otherLangsForProduct = await adminProductService.getProducts({ origin_id: id });
                            let otherLangsForProductIds = otherLangsForProduct.map(i => i.id);
                            let productIdsFilter = { [Op.in]: [product.id, ...otherLangsForProductIds] };
                            
                            let otherLangsForProductOriginalLinks = otherLangsForProduct.map((i, index) => `/shop/getProduct/${i.id}`);
                            let productOriginalLinksFilter = {[Op.in]: [`/shop/getProduct/${product.id}`, ...otherLangsForProductOriginalLinks] };
                            
                            await adminProductService.deleteProduct(productIdsFilter, transaction);
                            await metaDataService.deleteMetaData({url:  productOriginalLinksFilter  }, transaction);
                            await linksService.removeLink({ original_link: productOriginalLinksFilter }, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'product' }, transaction);
    
                        } else {

                            product = await productService.updateProductById( id,
                                {
                                    status: config.GLOBAL_STATUSES.DELETED
                                },
                                transaction );
                            await productService.updateProductById( {origin_id: id},
                                {
                                    status: config.GLOBAL_STATUSES.DELETED,
                                },
                                transaction );
                            result.push(product);
                            await adminHistoryService.adminCreateHistory({item_id: id, user_id: req.userid, type: 'product'}, transaction);
                        }
                    }
                }
                await transaction.commit();
            }

            log.info(`End /deleteProducts. Result:${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

   

  


 

 

  

 

    

  

   
   

   
 

    createCategory: async (req, res) => {
        //TODO:Add image middleware
        let { title } = req.body;
        let file = req.file;
        let image = file && file.path ? file.path : null;
        try {
            //TODO: "created_at": null, "updated_at": null
            let newCategory = await categorieService.createCategory({ title, image });
            return res.status(200).json(newCategory);

        } catch (e) {
            // log.error(`Error post /createCategory ${JSON.stringify(req.body)}`);
            
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
                message: e.message,
                errCode: '400'
            });
          
        }
    },

 
    setUpPosition: async (req, res) => {
        let result = await adminProductService.setPosition();

        return res.status(200).json(result);
    },
  
 
    changePosition: async (req, res) => {
        let { category_id, category_id_2 } = req.body;

        let result = await adminProductService.changeCategoryPosition(category_id, category_id_2);

        return res.status(200).json(result)
    },
    changePositionCategory: async (req, res) => {
        let { category } = req.body;
        let result = await adminProductService.changePositionCategory(category);

        return res.status(200).json(result)
    },
    updateCategoryPositions: async (req, res) => {
       

        let result = await adminProductService.updateCategoryPositions(req.body);

        return res.status(200).json(result)
    },

    changePositionProduct: async (req, res) => {
        let { product } = req.body;
        
        try {

            let result = await adminProductService.changePositionProduct(product);

            return res.status(200).json(result)
        }
        catch (err) {
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },


    saveProductTestimonial: async (req, res) => {
        log.info(`Start /saveTestimonial  Params: ${JSON.stringify(req.body)}`);
        let { id, parent_id, origin_product_id, name, email, text, published_at, status, rating } = req.body;
        try {
            let testimonial;
            if (!id) {
                testimonial = await productTestimonialsService.createProductTestimonial({
                    origin_product_id,
                    parent_id: parent_id ? parent_id : 0,
                    name,
                    email,
                    published_at: published_at ? published_at : new Date().toISOString(),
                    text,
                    rating: parent_id ? parent_id : 0,
                    status: status ? status : config.GLOBAL_STATUSES.ACTIVE
                });
            } else {
                testimonial = await productTestimonialsService.getProductTestimonialByFilter({ id });
                if (!testimonial) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }
                await testimonial.update({
                    origin_product_id,
                    parent_id,
                    name,
                    email,
                    published_at: published_at ? published_at : new Date().toISOString(),
                    text,
                    rating,
                    status: status ? status : config.GLOBAL_STATUSES.ACTIVE
                })

            }
            
            log.info(`End /saveTestimonial  Result: ${JSON.stringify(testimonial)}`);
            return res.status(200).json(testimonial);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getProductAllCategory: async (req, res) => {
        log.info(`Start POST api/admin/product/getAllTestimonial  Params: ${JSON.stringify(req.body)}`);
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfWaition = await productTestimonialsService.countProductTestimonialByParam({ status: config.GLOBAL_STATUSES.WAITING });
            let numberOfActive = await productTestimonialsService.countProductTestimonialByParam({ status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeleted = await productTestimonialsService.countProductTestimonialByParam({ status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAll = await productTestimonialsService.countProductTestimonialByParam({ status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
                4: numberOfWaition,
            };

            let filter;
            let filterwhere = {};
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await productTestimonialsService.makeProductTestimonialFilter(req.body, filterwhere);
            result = await productTestimonialsService.adminGetAllProductTestimonials(filter, page, perPage, false,req.body.sort);

            result.statusCount = statusCount;
            log.info(`End POST api/admin/product/getAllTestimonial  Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(error);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    deleteTestimonial: async (req, res) => {
        log.info(`Start POST api/admin/product/deleteTestimonial/ ids: ${JSON.stringify(req.body)}`);
        let { ids } = req.body;
        let result = [];
        let transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                
                for (let id of ids) {
                    let testimonial = await productTestimonialsService.getProductTestimonialByFilter({ id });
                    if (!testimonial) {
                        result.push({ id: id, deleted: false, error: `Product testimonial with id:${id} not found` });
                    }else{
                        if (testimonial && testimonial.status === config.GLOBAL_STATUSES.DELETED) {
                            await productTestimonialsService.deleteProductTestimonialById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                        } else {
                            testimonial = await productTestimonialsService.updateProductTestimonialById(
                                { [Op.or]: [{ id: id }, { parent_id: id }] }, 
                                { status: config.GLOBAL_STATUSES.DELETED },
                                transaction);
                            result.push(testimonial);
                        }
                    }
                }
                await transaction.commit();
            }

            log.info(`End POST api/admin/product/deleteTestimonial/ ids: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`Error POST product/deleteTestimonial. ${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    saveAttributeGroup: async (req, res) => {
        
        log.info(`Start /saveAttributeGroup  Params: ${JSON.stringify(req.body)}`);
        let { id, title, position, attribute_groups } = req.body;
        let languages = config.LANGUAGES;
        let result;
        let attributeGroup;
        let transaction = await sequelize.transaction();
        
        try {        
                if (!id) {
                    // status = status ? status : config.GLOBAL_STATUSES.ACTIVE;
                    // let originAttributeGroup;
                    // for (let lang of languages) {
                    //     let attribyteGroupData = {
                    //         lang: lang,
                    //         origin_id: originAttributeGroup && originAttributeGroup.id ? originAttributeGroup.id : 0,
                    //         title,
                    //         text,
                    //         step,
                    //         type,
                    //         hint_text,
                    //         status,
                    //         video_links: video_links && video_links.length ? JSON.stringify(video_links) : null,
                    //     };
                    //     attributeGroup = await attributesGroupsService.createAttributeGroup(attribyteGroupData, transaction);
                    //     await adminHistoryService.adminCreateHistory({ item_id: attributeGroup.id, user_id: req.userid, type: 'attribute_group' }, transaction);
                    //     attributeGroup = attributeGroup ? attributeGroup.toJSON() : attributeGroup;
                    //     if(attributeGroup && attributeGroup.video_links) attributeGroup.video_links = JSON.parse(attributeGroup.video_links);
                    //     if (!originAttributeGroup){
                    //         originAttributeGroup = attributeGroup;
                    //     } 
                    // }
                    // originAttributeGroup.history = await adminHistoryService.adminFindAllHistory({ type: 'attribute_group', item_id: originAttributeGroup.id, created_at: { [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString() } }, transaction);
                    // result = originAttributeGroup;
                
                } else {

                    //update attribyte group
                    const lang = req.body.lang ? req.body.lang : languages[0];
                    const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };
                    attributeGroup = await attributesGroupsService.getStepByFilter(filter);
                    if (!attributeGroup) {
                        return res.status(400).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                        });
                    }
                    let stepObj = {};
                    if(title) stepObj.title = title;
                
                    attributeGroup = await attributesGroupsService.updateAttributeGroupById(filter, stepObj, attribute_groups, lang, transaction);
                    
                    await adminHistoryService.adminCreateHistory({ item_id: attributeGroup.id, user_id: req.userid, type: 'attribute_group_step' }, transaction);
                    attributeGroup.history = await adminHistoryService.adminFindAllHistory({ type: 'attribute_group_step', item_id: id, created_at: { [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString() } }, transaction);
        
                    // const otherLangFilter = { [Op.or]: [{ id: id }, { origin_id: id }] };
                    // await attributesGroupsService.updateAttributeGroupById(otherLangFilter, attributeObjOtherLang, transaction);
                    result = attributeGroup;
                }
                
                await transaction.commit();
               
                log.info(`End /saveAttributeGroup Result: ${JSON.stringify(result)}`);
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

    getAllAttributeGroups: async (req, res) => {
    
        log.info(`Start /getAllAttributeGroups`);
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            let numberOfActive = await attributesGroupsService.countAttributeGroupsByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE });
            let numberOfDeleted = await attributesGroupsService.countAttributeGroupsByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED });
            let numberOfAll = await attributesGroupsService.countAttributeGroupsByParam({ origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } });
            let statusCount = {
                all: numberOfAll,
                1: numberOfDeleted,
                2: numberOfActive,
            };

            let lang = req.body.lang ? req.body.lang : config.LANGUAGES[0];

            let filter;
            let filterwhere = { lang, origin_id: 0 };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = { lang, origin_id: 0, status: { [Op.ne]: config.GLOBAL_STATUSES.DELETED } };
            }
            filter = await attributesGroupsService.makeAttributeGroupsFilter(req.body, filterwhere,req.body.from_product);
            result = await attributesGroupsService.adminGetAllAttributeGroups(filter, page, perPage, false);

            result.statusCount = statusCount;
           
            log.info(`End /getAllAttributeGroups`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    getAttributeGroupById: async (req, res) => {
       
        log.info(`Start /getAttributeGroupById/:id  id: ${JSON.stringify(req.params.id)}`);
        try {
            let id = req.params.id;
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            const filter = { [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] };

            let attributeGroup = await attributesGroupsService.getAttributeGroupByFilter(filter);
            if (!attributeGroup) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            
            
            // attributeGroup.history = await adminHistoryService.adminFindAllHistory({ type: 'attribute_group', item_id: attributeGroup.id, created_at: { [Op.gte]: new Date(Date.now()-config.TIME_CONST).toISOString() } });

            
            log.info(`End /getAttributeGroupById/:id`);
            return res.status(200).json(attributeGroup);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    deleteProductAttributeGroups: async (req, res) => {
        log.info(`Start /deleteProductAttributeGroups. ids:${JSON.stringify(req.body)}`);
        let { ids } = req.body;
        let result = [];
        let transaction = await sequelize.transaction();
        try {
            if (ids && ids.length) {
                
                for (let id of ids) {
                    let attributeGroup = await attributesGroupsService.getAttributeGroupByFilter({ id: id });

                    if (!attributeGroup) {
                        result.push({ id: id, deleted: false, error: `Attribute group not found with id:${id}` })
                    } else {

                        if (attributeGroup.status === config.GLOBAL_STATUSES.DELETED) {
                            await attributesGroupsService.deleteAttributeGroupById(id, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'attribute_group' }, transaction);
                        } else {
                            attributeGroup = await attributesGroupsService.updateAttributeGroupById({ [Op.or]: [{ id: id }, { origin_id: id }] }, { status: config.GLOBAL_STATUSES.DELETED }, transaction);
                            result.push(attributeGroup);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'attribute_group' }, transaction);
                        }

                    }
                }
                await transaction.commit();
            }
            log.info(`End /deleteProductAttributeGroups ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.info(error);
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    calculateProduct: async (req, res) => {
        
        log.info(`Start /calculateProduct Params: ${JSON.stringify(req.body)}`);
        try {
            let result;
            if(req.body.type && req.body.type == config.PRODUCT_TYPES.GLASS){
                result = productPriceUtil.countPrice(req.body, true, true);
            }else if(req.body.type && req.body.type == config.PRODUCT_TYPES.SHOWER){
                let shower_has_required_default_glass = false
                if(req.body.steps && req.body.steps.length){
                    for(let item of req.body.steps){
                        if(config.SHOWER_GLASS_STEP_IDS.includes(item.id)){
                            if(item.attribute_groups && item.attribute_groups.length){
                                for(let attrGr of item.attribute_groups){
                                    if(attrGr.attributes && attrGr.attributes.length){
                                        for(let attr of attrGr.attributes){
                                            if(attr && attr.is_default){
                                                if(attr.discount){
                                                    req.body.mat = Math.ceil(attr.price - (attr.price * (attr.discount / 100)));
                                                } else {
                                                    req.body.mat = attr.price
                                                }
                                                req.body.changedMat = true
                                                req.body.changedMatAtrId = attr.id
                                                shower_has_required_default_glass = true
                                            }       
                                        }
                                    }
                                }
                            }
                        }   
                    }
                }
                if(req.body.type == config.PRODUCT_TYPES.SHOWER && !shower_has_required_default_glass){
                    await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.code).json({
                        message: errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.message,
                        errCode: errors.BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE.code,
                    });
            }
                result = productPriceUtil.countShowerPrice(req.body, true, true, null, null, null, null, null,null,null,null,null,req.body.changedMat,req.body.changedMatAtrId);
                if(req.body.type == config.PRODUCT_TYPES.SHOWER){
                    result.mat = 1
                } 
            }else if(req.body.type && req.body.type == config.PRODUCT_TYPES.SIMPLE){
                result = req.body;
            }
            log.info(`End /calculateProduct Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    changeProductPosition: async (req, res) => {
        log.info(`Start /changeProductPosition Params: ${JSON.stringify(req.body)}`);
        let { id, position, is_last } = req.body;
        try {
            if(!id || !position){
                return res.status(errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code).json({
                    message: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.message,
                    errCode: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code
                });
            }
            let result = await productService.changePosition(id, position, is_last);
            log.info(`End /changeProductPosition Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    changeCategoryPosition: async (req, res) => {
        log.info(`Start /changeCategoryPosition Params: ${JSON.stringify(req.body)}`);
        let { id, position, is_last } = req.body;
        try {
            if(!id || !position){
                return res.status(errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code).json({
                    message: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.message,
                    errCode: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code
                });
            }

            let result = await categorieService.changePosition(id, position, is_last);
            log.info(`End /changeCategoryPosition Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    changeAttributePosition: async (req, res) => {
        log.info(`Start /changeAttributePosition Params: ${JSON.stringify(req.body)}`);
        let { id, position, is_last } = req.body;
        try {
            if(!id || !position){
                return res.status(errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code).json({
                    message: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.message,
                    errCode: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code
                });
            }
            let result = await attributesService.changePosition(id, position, is_last);
            log.info(`End /changeAttributePosition Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },
    
    changeMarkPosition: async (req, res) => {
        log.info(`Start /changeMarkPosition Params: ${JSON.stringify(req.body)}`);
        let { id, position, is_last } = req.body;
        try {
            if(!id || !position){
                return res.status(errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code).json({
                    message: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.message,
                    errCode: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code
                });
            }
            let result = await markService.changePosition(id, position, is_last);
            log.info(`End /changeMarkPosition Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    changeAttributeGroupPosition: async (req, res) => {
        log.info(`Start /changeAttributeGroupPosition Params: ${JSON.stringify(req.body)}`);
        let { id, position, is_last } = req.body;
        try {
            if(!id || !position){
                return res.status(errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code).json({
                    message: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.message,
                    errCode: errors.BAD_REQUEST_INVALID_ID_OR_POSITION.code
                });
            }
            let result = await attributesGroupsService.changePosition(id, position, is_last);
            log.info(`End /changeAttributeGroupPosition Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

}
