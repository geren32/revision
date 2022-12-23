const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const log = require('../utils/logger');
const { models } = require('../sequelize-orm');
const config = require('../configs/config');
const attributesService = require('../services/attributes.service')

module.exports = {

    createAttributeGroup: async(attributeGroup, trans) => {
        log.info(`Start service createAttributeGroup`);
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let res = await models.attribute_groups.findOne({
                where: { lang: attributeGroup.lang },
                attributes: ["id", "position"],
                order: [
                    ["position", "DESC"]
                ]
            })
            attributeGroup.position = res && res.position ? res.position + 1 : 1;

            let result = await models.attribute_groups.create(attributeGroup, {
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End service createCity`);
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countAttributeGroupsByParam: async(whereObj) => {
        log.info(`Start service countAttributeGroupsByParam data:${JSON.stringify(whereObj)}`)
        try {
            let result = await models.attribute_groups.count({
                where: whereObj
            });
            log.info(`End service countAttributeGroupsByParam data:${JSON.stringify(result)}`)
            return result ? result : 0;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getStepByFilter: async(whereObj) => {
        log.info(`Start service getStepByFilter data:${JSON.stringify(whereObj)}`)
        try {
            let result = await models.steps.findOne({
                where: whereObj
            });
            log.info(`End service getStepByFilter`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getAtrGrByFilter: async(whereObj) => {
        log.info(`Start service getAtrGrByFilter data:${JSON.stringify(whereObj)}`)
        try {
            let result = await models.attribute_groups.findOne({
                where: whereObj
            });
            log.info(`End service getAtrGrByFilter`)
            return result ? result.toJSON() : result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getAttributeGroupByFilter: async(filter, trans, isWithNoAtr) => {
        log.info(`Start service getAttributeGroupByFilter data:${JSON.stringify(filter)}`)
        let transaction = trans ? trans : null;
        try {
            let result = await models.steps.findOne({
                where: filter,
                include:[
                    { model: models.attribute_groups },
                ],
                transaction
            });
            if(result){
                result = result.toJSON();
                if(!isWithNoAtr){
                    let lang = result.lang ? result.lang : null;
                    if(result.attribute_groups && result.attribute_groups.length){
                        for (let group of result.attribute_groups) {
                            if(group.video_links) group.video_links = JSON.parse(group.video_links);
                            // let originId = group.origin_id ? group.origin_id : group.id ;
                            group.attributes =  await models.attribute.findAll({
                                where: { group_atr: group.id, lang: lang },
                                attributes:['id','origin_id','lang','title','status','position','image_id','created_at','updated_at','price','price_type','no_option'],
                                raw: true,
                                transaction
                            });
                            if(group.attributes && group.attributes.length){
                                for (let attribute of group.attributes) {
                                    if(attribute && attribute.price == -1){
                                        attribute.price = -1
                                    } else if(attribute && attribute.price && attribute.price != -1){
                                        attribute.price = attribute.price / 100
                                    }

                                    if(attribute){
                                        attribute.attribute_values = await models.attribute_values.findAll({
                                            where: { 
                                                origin_attribute_id:  attribute.origin_id ? attribute.origin_id : attribute.id,
                                                lang: lang
                                            },
                                            attributes:['id', 'origin_id', 'value'],
                                            transaction
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            log.info(`End service getAttributeGroupByFilter data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    
    getAttributeGroupAllByFilter: async(filter, trans) => {
        log.info(`Start service getAttributeGroupAllByFilter data:${JSON.stringify(filter)}`)
        let transaction = trans ? trans : null;
        try {
            let result = await models.attribute_groups.findAll({
                where: filter,
                transaction
            });
            log.info(`End service getAttributeGroupAllByFilter data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },



    adminGetAllAttributeGroups: async(filter, page, perPage, attributes) => {
        log.info(`Start service adminGetAllAttributeGroups data:${JSON.stringify(filter, page, perPage, attributes)}`)
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.steps.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include:[
                    { model: models.attribute_groups },
                ],
            });
            if (result && result.rows && result.rows.length){
                let all = []
                result.rows = result.rows.map((item) =>  item.toJSON());

                for (let i of result.rows) {
                    let lang_change = await models.steps.findAll({
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
                                type: "attribute_group_step"
                            }
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    i.change = change
                    all.push(i)

                    let originId = i.origin_id ? i.origin_id : i.id ;

                    if(i.attribute_groups && i.attribute_groups.length){
                        for (let atrGr of i.attribute_groups) {
                            atrGr.attributes =  await models.attribute.findAll({
                                where: { group_atr: atrGr.id, lang: atrGr.lang },
                                attributes:['id','origin_id','lang','title','status','position','image_id','created_at','updated_at','no_option'],
                                raw: true,
                            });

                            if(atrGr.attributes && atrGr.attributes.length){
                                for(let atr of atrGr.attributes){
                                    let atr_val = await models.attribute_values.findAll({
                                        where: { 
                                            origin_attribute_id:  atr.origin_id ? atr.origin_id : atr.id,
                                            lang: atr.lang
                                        },
                                        attributes:['id', 'origin_id', 'value'],
                                        
                                    });
                                    atr.attribute_values = atr_val && atr_val.length ? atr_val : [];
                                }
                            }
                            
                        }

                    }
                   
                }

                result.rows = all;
            }



            log.info(`End service adminGetAllAttributeGroups data:${JSON.stringify(result)}`)
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


    makeAttributeGroupsFilter: async(body, whereObj,from_product) => {
        log.info(`Start service makeAttributeGroupsFilter data:${JSON.stringify(body)}`)
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
                        [Op.or]: like
                    }
                });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.type) {
            arr.push({ type: body.type });
        }
        if(from_product){
            arr.push({ id: { [Op.notIn]: config.HARDCODE_STEPS } });
        }
        

        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.position) {
                sort = [
                    ['position', body.sort.position]
                ];
            }
        } else {
            sort = [
                ['position', 'ASC']
            ];
        }

        let filter = {
            sort,
            where: {
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End service makeAttributeGroupsFilter data:${JSON.stringify(filter)}`)
        return filter;
    },

    updateAttributeGroupById: async(params, step, attribute_groups, lang, trans) => {
        log.info(`Start service updateAttributeGroupById data:${JSON.stringify(params, attribute_groups, trans)}`)
        let transaction = null;
        const languages = config.LANGUAGES
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.steps.update(step, { where: filter, transaction });

            if(attribute_groups && attribute_groups.length){

                for (let group of attribute_groups) {
                    if(group.id && lang){
                        let groupObj = {};
                        let groupObjOtherLang = {};
                        if(group.title) groupObj.title = group.title;
                        if(group.text){
                            groupObj.text = group.text; 
                        } else  groupObj.text = null; 
                        if(group.hint_text){
                            groupObj.hint_text = group.hint_text; 
                        } else groupObj.hint_text = null
                        if(group.video_links && group.video_links.length){
                            groupObj.video_links = JSON.stringify(group.video_links); 
                            groupObjOtherLang.video_links = JSON.stringify(group.video_links); 
                        }else if(group.video_links === null){
                            groupObj.video_links = group.video_links; 
                            groupObjOtherLang.video_links = group.video_links; 
                        }

                        await models.attribute_groups.update(groupObj, { where: { [Op.or]: [{ id: group.id, lang: lang }, { origin_id: group.id, lang: lang }] }, transaction });
                        await models.attribute_groups.update(groupObjOtherLang, { where: { [Op.or]: [{ id: group.id }, { origin_id: group.id }] }, transaction });

                        if(group.attributes){

                            if(lang == config.LANGUAGES[0]){
                                if(group.attributes.length){
                                    let oldAtr = await models.attribute.findAll({
                                        where: {  group_atr: group.id, lang: lang },
                                        transaction
                                    });
                                    
                                    for (let grAtr of group.attributes) {
                                        let originId = grAtr.origin_id ? grAtr.origin_id : grAtr.id;
                                        let isOldAtr = oldAtr.find(atr => atr.id == grAtr.id);
                                        if(grAtr.price == -1){
                                            grAtr.price = -1
                                        } else if(grAtr.price && grAtr.price != -1){
                                            grAtr.price = grAtr.price * 100
                                        } else grAtr.price = null
                                        
                                        if(grAtr.id && isOldAtr){
                                            await models.attribute.update({ title: grAtr.title,no_option: grAtr.no_option, price:grAtr.price, price_type:grAtr.price_type ? grAtr.price_type : null }, { where: { id: grAtr.id, lang }, transaction });
                                            await attributesService.saveAttributeValues(grAtr.attribute_values, lang, originId, transaction)

                                        }else{
                                            const languages = config.LANGUAGES;

                                            let originAttribute;
                                            for (let [index, lang] of languages.entries()) {
                                                let attribyteData = {
                                                    lang: lang,
                                                    origin_id: originAttribute && originAttribute.id ? originAttribute.id : 0,
                                                    title: grAtr.title,
                                                    no_option: grAtr.no_option,
                                                    group_atr: group.id+index,
                                                    price:grAtr.price,
                                                    price_type: grAtr.price_type ? grAtr.price_type : null
                                                };
                                                let newAtr = await models.attribute.create(attribyteData, { transaction });
                                                if (!originAttribute){
                                                    originAttribute = newAtr;
                                                } 
                                            }
                                            if(grAtr.attribute_values && grAtr.attribute_values.length){
                                                for (let atrvValue of grAtr.attribute_values) {
                                                    let originValue;
                                                    for(let lang of languages) {
                                                        if (atrvValue && atrvValue.value) {
                                                            let artVal = await models.attribute_values.create({
                                                                origin_id: originValue && originValue.id ? originValue.id : 0,
                                                                lang,
                                                                origin_attribute_id: originAttribute.id,
                                                                value: atrvValue.value
                                                            }, { transaction })
                                                        if (!originValue) originValue = artVal;
                                                        }
                                                    }
                                                }
                                            }

                                                
                                        }
                                    }
                                    if(oldAtr && oldAtr.length){
                                        for (let oldValue of oldAtr) {
                                            let isDelOldAtr = group.attributes.find(atr => atr.id == oldValue.id);
                                            if(!isDelOldAtr){

                                                let oldAtr = await models.attribute.findAll({
                                                    where: { [Op.or]: [{ id: oldValue.id }, { origin_id: oldValue.id }] },
                                                    transaction
                                                });
                                                let oldAtrIds = oldAtr.map(atr => atr.id);
                                                await models.attribute.destroy({ where: { id: oldAtrIds }, transaction });
                                                await models.attribute_values.destroy({ where: { origin_attribute_id: oldAtrIds }, transaction });
                                                await models.product_to_attribute.destroy({ where: { attribute_id: oldAtrIds }, transaction });
                                            }
                                        }
                                    }
                                    
                                }else{
                                    let allLangGroupIds =[];
                                    for (let [index, lang] of languages.entries()) {
                                        if(group.id) allLangGroupIds.push(group.id+index)
                                    }
                                    let oldAtr = await models.attribute.findAll({
                                        where: { group_atr: allLangGroupIds },
                                        transaction
                                    });
                                    let oldAtrIds = oldAtr.map(atr => atr.id);
                                    await models.attribute.destroy({ where: { id: oldAtrIds }, transaction });
                                    await models.attribute_values.destroy({ where: { origin_attribute_id: oldAtrIds }, transaction });
                                    await models.product_to_attribute.destroy({ where: { attribute_id: oldAtrIds }, transaction });
                                }
                            }else{
                                if(group.attributes.length){
                                    for (let attributes of group.attributes) {
                                        if(attributes){
                                            let attributesObj = {};
                                            if(attributes.title) attributesObj.title = attributes.title;
                                            await models.attribute.update(attributesObj, { where: { id: attributes.id, lang }, transaction });

                                            if(attributes.attribute_values && attributes.attribute_values.length){
                                                for (let value of attributes.attribute_values) {
                                                    if(value.id && value.value){
                                                        await models.attribute_values.update({ value: value.value }, { where: { id: value.id, lang }, transaction });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
            
                            }
                        }
                    

                    }
                    
                    
                }
            }


            let result = await models.steps.findOne({
                where: filter,
                include:[
                    { model: models.attribute_groups },
                ],
                transaction
            });
            if(result){
                result = result.toJSON();
                let lang = result.lang ? result.lang : null;
                if(result.attribute_groups && result.attribute_groups.length){
                    for (let group of result.attribute_groups) {
                        let originId = group.origin_id ? group.origin_id : group.id ;
                        group.attributes =  await models.attribute.findAll({
                            where: { group_atr: originId, lang: lang },
                            attributes:['id','origin_id','lang','title', 'type','status','unit_of_measurement','position','image_id','created_at','updated_at','price','price_type','no_option'],
                            raw: true,
                            transaction
                        });
                        if(group.attributes && group.attributes.length){
                            for (let attribute of group.attributes) {
                                if(attribute && attribute.price == -1){
                                    attribute.price = -1
                                } else if(attribute && attribute.price && attribute.price != -1){
                                    attribute.price = attribute.price * 100
                                }
                                if(attribute){
                                    attribute.attribute_values = await models.attribute_values.findAll({
                                        where: { 
                                            origin_attribute_id:  attribute.origin_id ? attribute.origin_id : attribute.id,
                                            lang: lang
                                        },
                                        attributes:['id', 'value'],
                                        transaction
                                    });
                                }
                            }
                        }
                    }
                }
            }

            if (!trans) await transaction.commit();
            log.info(`End service updateAttributeGroupById data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    deleteAttributeGroupById: async(id, trans) => {
        log.info(`Start service  deleteAttributeGroupById data:${JSON.stringify(id)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.attribute.update({ group_atr: null }, { where: { group_atr: id }, transaction });
            await models.attribute_groups.destroy({ where: { origin_id: id }, transaction });
            let result = await models.attribute_groups.destroy({ where: { id }, transaction });

            if (!trans) await transaction.commit();
            log.info(`End service  deleteAttributeGroupById data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    changePosition: async( id, position, is_last, trans ) => {
        log.info(`Start attribute group service changePosition`)
        let transaction = null;
         try {
            transaction = trans ? trans : await sequelize.transaction();
            if(is_last) position++;
            await models.attribute_groups.increment({position: 1}, { where: { position: { [Op.gte]:position } }, transaction });
            await models.attribute_groups.update({ position: position }, { where: { [Op.or]: [{ id: id }, { origin_id: id }] }, transaction });
            
            if (!trans) await transaction.commit();
            log.info(`End attribute group service changePosition`)
            return true
         } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
         }
 
    },

}