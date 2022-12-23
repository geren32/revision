const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const log = require('../utils/logger');
const { Op } = require("sequelize");
const config = require('../configs/config');


async function saveAttributeValues(attribute_values, lang, originId, trans) {
    let transaction = trans ? trans : null;
    try {

        if(attribute_values && lang){
                
            if(lang == config.LANGUAGES[0]){
                if(attribute_values.length){
                    let oldAtr = await models.attribute_values.findAll({
                        where: { 
                            origin_attribute_id: originId,
                            lang: lang
                        },
                        attributes:['id', 'value'],
                        transaction
                    });
                    
                    for (let value of attribute_values) {
                        let isOldAtr = oldAtr.find(atr => atr.id == value.id);
                        if(value.id && isOldAtr){
                            await models.attribute_values.update({ value: value.value }, { where: { id: value.id, lang }, transaction });
                        }else{
                            const languages = config.LANGUAGES;
                            let originValue;
                            for(let lang of languages) {
                                if (value && value.value) {
                                    let artVal = await models.attribute_values.create({
                                        origin_id: originValue && originValue.id ? originValue.id : 0,
                                        lang,
                                        origin_attribute_id: originId,
                                        value: value.value
                                    }, { transaction })
                                if (!originValue) originValue = artVal;
                                }
                            }
                                
                        }
                    }
                    if(oldAtr && oldAtr.length){
                        for (let oldValue of oldAtr) {
                            let isDelOldAtr = attribute_values.find(atr => atr.id == oldValue.id);
                            if(!isDelOldAtr){
                                let oldAtrVal = await models.attribute_values.findAll({
                                    where: { [Op.or]: [{ id: oldValue.id }, { origin_id: oldValue.id }] },
                                    attributes:['id', 'value'],
                                    transaction
                                });
                                let oldAtrIds = oldAtrVal.map(atr => atr.id);
                                await models.attribute_values.destroy({ where: { [Op.or]: [{ id: oldValue.id }, { origin_id: oldValue.id }] }, transaction });
                                await models.product_to_attribute.destroy({ where: { value: oldAtrIds }, transaction });
                            }
                        }
                    }
                    
                }else{
                    let oldAtr = await models.attribute_values.findAll({
                        where: { origin_attribute_id: originId },
                        attributes:['id', 'value'],
                        transaction
                    });
                    let oldAtrIds = oldAtr.map(atr => atr.id);
                    await models.attribute_values.destroy({ where: { origin_attribute_id: originId }, transaction });
                    await models.product_to_attribute.destroy({ where: { value: oldAtrIds }, transaction });
                }
            }else{
                if(attribute_values.length){
                    for (let value of attribute_values) {
                        if(value.id && value.value){
                            await models.attribute_values.update({ value: value.value }, { where: { id: value.id, lang }, transaction });
                        }
                    }
                }

            }
        }

        
        return  true;

    } catch (err) {
        if (transaction) await transaction.rollback();
        err.code = 400;
        throw err;
    }

}

module.exports = {
     createAttribute: async (attribute, attribute_values, trans) => {
        let transaction = null;
        log.info(`Start function createAttribute Params: ${JSON.stringify(attribute)}`);
        try {

            let res = await models.attribute.findOne({
                where: { lang: attribute.lang },
                attributes: ["id", "position"],
                order: [
                    ["position", "DESC"]
                ]
            })
            attribute.position = res && res.position ? res.position + 1 : 1;

            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.attribute.create(attribute, { transaction });

            if(result && result.id && !result.origin_id){
                const languages = config.LANGUAGES;
                if (attribute_values && attribute_values.length) {
                    for (let value of attribute_values) {
                        let originValue;
                        for(let lang of languages) {
                            if (value && value.value) {
                                let artVal = await models.attribute_values.create({
                                    origin_id: originValue && originValue.id ? originValue.id : 0,
                                    lang,
                                    origin_attribute_id: result.id,
                                    value: value.value
                                }, { transaction })
                                if (!originValue) originValue = artVal;
                            } else {
                                throw new Error('There is no attribute value');
                            }
                        }
                    }
                }
                let resultAtr = await models.attribute.findOne({
                    where: {id: result.id},
                    attributes:['id','origin_id','lang','title','status','unit_of_measurement','position','image_id','created_at','updated_at'],
                    include:[
                        { model: models.uploaded_files, as: "image" },
                    ],
                    transaction });
                if(resultAtr){
                    resultAtr = resultAtr.toJSON();
                    resultAtr.attribute_values = await models.attribute_values.findAll({
                        where: { 
                            origin_attribute_id: resultAtr.id,
                            lang: resultAtr.lang
                        },
                        attributes:['id', 'value'],
                        transaction
                    });
                }
                result = resultAtr;
            }

            if (!trans) await transaction.commit();
            log.info(`End function createAttribute  Result: ${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(`${err}`)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
     createAttributeRanges: async (attribute, attributeRanges, trans) => {
        let transaction = null;
        log.info(`Start function Params: ${JSON.stringify({attribute: attribute, attributeRanges: attributeRanges})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = [];
            if(attributeRanges && attributeRanges.length){
                for (let range of attributeRanges) {
                    let resultRange = await models.attribute_ranges.create({
                        origin_attribute_id: attribute.id,
                        from: range.from ? Number(range.from) : null,
                        to: range.to ? Number(range.to) : null,
                    }, { transaction });
                    result.push(resultRange);
                }
            }
            if (!trans) await transaction.commit();
            log.info(`End function createAttributeRanges Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
     getAttributes: async (ids) => {
        let where = {}
        if (ids) {
            where.id = ids;
        }
        try {
            //log.info(`Start getAttributes.`)
            let result = await models.attribute.findAll({
                raw: true,
                where: where
            })
            // log.info(`Start getAttributes.`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
     getAttributeById: async (id) =>  {
        try {
            // log.info(`Start getAttributeById. ${JSON.stringify(id)}`)
            let result = await models.attribute.findOne({
                where: {id: id}
            })
            // log.info(`End getAttributeById. ${JSON.stringify(id)}`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getAttributeByFilter: async (filter, trans) =>  {
        let transaction = trans ? trans : null;
        log.info(`Start function getAttributeByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.attribute.findOne({
                where: filter,
                transaction
            })
            log.info(`End function getAttributeByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
     deleteAttribute: async (id) => {
        try {
            log.info(`Start deleteAttribute. ${JSON.stringify(id)}`)
            await models.product_to_attribute.destroy({
                where: {attribute_id: id}
            })
            let result = models.attribute.destroy({
                where: {id: id}
            })
            log.info(`End deleteAttribute. ${JSON.stringify(id)}`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    editAttribute: async(id, attribute) => {
        try {
            log.info(`Start editAttribute. id - ${JSON.stringify(id)}, attribute - ${JSON.stringify(attribute)}`)
            await models.attribute.update(attribute, {where: {id}})
            let result = models.attribute.findOne({
                where: {id: id}
            })   
            log.info(`End editManufacturer. id - ${JSON.stringify(id)}, attribute - ${JSON.stringify(attribute)}`)
            return result;
         
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    updateAttributeById: async (params, attribute, attribute_values, originId, lang, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function updateAttributeById`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.attribute.update(attribute, { where: filter, transaction });

            if(attribute_values && lang){
                
                if(lang == config.LANGUAGES[0]){
                    if(attribute_values.length){
                        let oldAtr = await models.attribute_values.findAll({
                            where: { 
                                origin_attribute_id: originId,
                                lang: lang
                            },
                            attributes:['id', 'value'],
                            transaction
                        });
                        
                        for (let value of attribute_values) {
                            let isOldAtr = oldAtr.find(atr => atr.id == value.id);
                            if(value.id && isOldAtr ){
                                await models.attribute_values.update({ value: value.value }, { where: { id: value.id, lang }, transaction });
                            }else{
                                const languages = config.LANGUAGES;
                                let originValue;
                                for(let lang of languages) {
                                    if (value && value.value) {
                                        let artVal = await models.attribute_values.create({
                                            origin_id: originValue && originValue.id ? originValue.id : 0,
                                            lang,
                                            origin_attribute_id: originId,
                                            value: value.value
                                        }, { transaction })
                                    if (!originValue) originValue = artVal;
                                    }
                                }
                                    
                            }
                        }
                        if(oldAtr && oldAtr.length){
                            for (let oldValue of oldAtr) {
                                let isDelOldAtr = attribute_values.find(atr => atr.id == oldValue.id);
                                if(!isDelOldAtr){
                                    let oldAtrVal = await models.attribute_values.findAll({
                                        where: { [Op.or]: [{ id: oldValue.id }, { origin_id: oldValue.id }] },
                                        attributes:['id', 'value'],
                                        transaction
                                    });
                                    let oldAtrIds = oldAtrVal.map(atr => atr.id);
                                    await models.attribute_values.destroy({ where: { [Op.or]: [{ id: oldValue.id }, { origin_id: oldValue.id }] }, transaction });
                                    await models.product_to_attribute.destroy({ where: { value: oldAtrIds }, transaction });
                                }
                            }
                        }
                        
                    }else{
                        let oldAtr = await models.attribute_values.findAll({
                            where: { origin_attribute_id: originId },
                            attributes:['id', 'value'],
                            transaction
                        });
                        let oldAtrIds = oldAtr.map(atr => atr.id);
                        await models.attribute_values.destroy({ where: { origin_attribute_id: originId }, transaction });
                        await models.product_to_attribute.destroy({ where: { value: oldAtrIds }, transaction });
                    }
                }else{
                    if(attribute_values.length){
                        for (let value of attribute_values) {
                            if(value.id && value.value){
                                await models.attribute_values.update({ value: value.value }, { where: { id: value.id, lang }, transaction });
                            }
                        }
                    }

                }
            }
            
            result = await models.attribute.findOne({
                where: filter,
                include:[
                    { model: models.uploaded_files, as: "image" },
                ],
                transaction 
            });
            if(result && result.id){
                result = result.toJSON();
                result.attribute_values = await models.attribute_values.findAll({
                    where: { 
                        origin_attribute_id: originId,
                        lang: result.lang
                    },
                    attributes:['id', 'value'],
                    transaction
                })
            }
            
            
            // if(attributeRanges && result){
            //     let originAttributeId  = result.origin_id ? result.origin_id : result.id;
            //     await models.attribute_ranges.destroy({ where: { origin_attribute_id: originAttributeId }, transaction });
            //     if(attributeRanges.length){
            //         let resultAttributeRanges = [];
            //         for (let range of attributeRanges) {
            //             let resultRange = await models.attribute_ranges.create({
            //                 origin_attribute_id: originAttributeId,
            //                 from: range.from ? Number(range.from) : null,
            //                 to: range.to ? Number(range.to) : null,
            //             }, { transaction });
            //             resultAttributeRanges.push(resultRange);
            //         }
            //         result.range = resultAttributeRanges
            //     }
            // }

            if (!trans) await transaction.commit();
            log.info(`End function updateAttributeById  Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    changePosition: async( id, position, is_last, trans ) => {
        log.info(`Start product attributes service changePosition`)
        let transaction = null;
         try {
            transaction = trans ? trans : await sequelize.transaction();
            if(is_last) position++;
            await models.attribute.increment({position: 1}, { where: { position: { [Op.gte]:position } }, transaction });
            await models.attribute.update({ position: position }, { where: { [Op.or]: [{ id: id }, { origin_id: id }] }, transaction });
            
            if (!trans) await transaction.commit();
            log.info(`End product attributes service changePosition`)
            return true
         } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
         }
 
    },

    saveAttributeValues: saveAttributeValues,

    getAttributesValues: async (filter) => {
        try {
            log.info(`Start getAttributesValues.`);
            let result = await models.attribute_values.findAll({
                where: filter,
                raw: true,
            })
            log.info(`End getAttributesValues.`);
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    



}
