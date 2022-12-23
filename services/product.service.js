const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const config = require('../configs/config');
const errors = require('../configs/errors');
const extraUtil = require('../utils/extra-util');
const log = require('../utils/logger');
const _ = require('lodash');
const productPriceUtil = require('../utils/product_price-util');
const addressAttributes = [
    'street',
    'apartment',
    'entrance',
    'floor',
    'intercom',
    'district',
    'city',
    'country',
    'first_name',
    'last_name',
    'email',
    'phone'
];
const productAttributes = [
    'variation',
    'type',
    'status',
    'short_description',
    'description',
    'name',
    'price',
    'old_price',
    'availability',
    'brand_id',
    'model_id',
    'sku',
    'promotional',
    'novelty',
    'popular',
    'image_id'
];
const userAttributes = [


    'email',
    'phone',
];
const bookingAttributes = [
    'id',
    'date',
    'total_price',
    'user_id',
    'address_id',
    'status',
    'price_UAH'
];
const variationAttributes = [
    'id',
    'product_id',
    'price',
    'old_price',
    'status',
    'sku',
    'gallery'
];
const toPlain = response => {
    const flattenDataValues = ({ dataValues }) =>
        _.mapValues(dataValues, value => (
            _.isArray(value) && _.isObject(value[0]) && _.isObject(value[0].dataValues) ?
            _.map(value, flattenDataValues) :
            _.isObject(value) && _.isObject(value.dataValues) ?
            flattenDataValues(value) :
            value
        ));

    return _.isArray(response) ? _.map(response, flattenDataValues) : flattenDataValues(response);
};

const getRatingArr = (testimonials) => {
    let sumRating = 0;
    let countRating = 0;
    for (const testimonial of testimonials) {
        if (testimonial.parent_id === 0 && testimonial.rating) {
            sumRating += testimonial.rating
                ++countRating;
        }
    }
    let rating = [];
    if (sumRating && countRating) {
        let avarageRating = Math.round(sumRating / countRating)
        for (let i = 1; i < 6; i++) {
            if (i <= avarageRating) {
                rating.push(true)
            } else {
                rating.push(false)
            }
        }
    } else {
        rating = [false, false, false, false, false]
    }
    return rating
};

async function getProduct(filter, trans, flag, configurator) {
    let transaction = trans ? trans : null;
    try {

        let product = await models.product.findOne({
            where: filter,
            include: [{
                    model: models.product_category,
                    as: 'category',
                    attributes: ['id', 'title', 'parent_id', 'attribute_groups'],
                    through: { attributes: [] },
                    include: [
                        {
                            model: models.attribute,
                            as: 'attributes',
                            attributes: ['id', 'title'],
                            through: { attributes: [] }
                        },
                        {
                            model: models.uploaded_files,
                            as: "characteristics_image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "reviews_image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "configurator_image"
                        },
                    ]
                },
                {
                    model: models.mark,
                    as: 'product_marks',
                    through: { attributes: [] },
                    include: [{
                        model: models.uploaded_files,
                        as: 'mark_image'
                    }]
                },
                // {
                //     model: models.attribute,
                //     as: 'product_attribute',
                //     attributes: ['id','origin_id', 'title', 'group_atr'],
                //     distinct:true,
                //     through: {
                //         attributes: ['value', 'discount', 'is_default', 'image_id', 'preview_image_id', 'base', 'mat', 'price', 'dependent_atr_id'],
                //         as: 'activeValue',
                //     },
                //     include: [
                //         { 
                //             model: models.attribute_groups, 
                //             attributes: ['id', 'title', 'type'],
                //             include:[
                //                 {
                //                     model: models.steps, 
                //                     attributes: ['id','origin_id', 'title'],
                //                 }
                //             ]
                //         }
                //     ]
                // },
                {
                    model: models.uploaded_files,
                    as: 'gallery',
                    through: { attributes: [], as: 'block_image' }
                },
                {
                    model: models.uploaded_files,
                    as: "image"
                },
                {
                    model: models.uploaded_files,
                    as: "hover_image"
                },
                {
                    model: models.uploaded_files,
                    as: "characteristics_image"
                },
                {
                    model: models.uploaded_files,
                    as: "reviews_image"
                },
                {
                    model: models.product_variations
                },
            ],
            transaction
        })
        product = product ? product.toJSON() : product;


        if (product && product.id) {

            if (product.characteristics) product.characteristics = JSON.parse(product.characteristics);

            if (product.gallery && product.gallery.length) {
                let gallery = product.gallery.map(el => { return { block_image: el } });
                product.gallery = gallery;
            }

            product.product_attribute = await models.product_to_attribute.findAll({
                where: { 
                    product_id: product.id, 
                    attribute_id: { [Op.ne]: null },
                },
                attributes: ['value', 'discount', 'is_default', 'image_id', 'preview_image_id', 'base', 'mat', 'price', 'dependent_atr_id','product_id', 'attribute_id','addition','no_option'],
                include: [{
                    model: models.attribute,
                    where: { lang: product.lang },
                    attributes: ['id', 'origin_id', 'title', 'group_atr', 'lang','price','price_type','no_option'],
                    required: false,
                    include: [{
                        model: models.attribute_groups,
                        attributes: ['id', 'origin_id', 'title', 'type'],
                        include: [{
                            model: models.steps,
                            attributes: ['id', 'origin_id', 'title'],
                        }]
                    }],
                }, ],
                transaction
            });

           
            if (product.product_attribute && product.product_attribute.length) {
                product.product_attribute = product.product_attribute.map(item => {
                    item = item.toJSON();

                    let {attribute} = item;
                    let activeValue = {
                        image_id: item.image_id,
                        discount: item.discount,
                        dependent_atr_id: item.dependent_atr_id,
                        base: item.base,
                        mat: item.mat,
                        preview_image_id: item.preview_image_id,
                        price: item.price,
                        no_option:item.no_option,
                        value: item.value,
                        addition: item.addition ? JSON.parse(item.addition) : null
                    }
                    if(configurator && item.attribute && (item.attribute.id || item.attribute.origin_id)){
                        let isDefault = null;
                        if(item.dependent_atr_id){
                            isDefault = configurator.find(el => {
                                if((el.originAtrId == item.attribute.id || el.originAtrId == item.attribute.origin_id) && el.dependAtrId == item.dependent_atr_id && !item.value){
                                    return el;
                                }else if((el.originAtrId == item.attribute.id || el.originAtrId == item.attribute.origin_id) && el.originAtrValueId == item.value){
                                    return el;
                                }
                            });
                        }else{
                            isDefault = configurator.find(el => {
                                if((el.originAtrId == item.attribute.id || el.originAtrId == item.attribute.origin_id) && !item.dependent_atr_id){
                                    if(item.value){
                                        if(item.value == el.originAtrValueId) return el;
                                    }else {
                                        return el;
                                    }
                                }
                            });
                        }
                        activeValue.is_default = isDefault ? 1 : null;
                    }else{
                        activeValue.is_default = item.is_default;
                    }

                    return {activeValue: activeValue, ...attribute};
                });


                let imageIds = [];
                let atrValIds = [];
                product.product_attribute.forEach((el) => {
                    if (el.activeValue && el.activeValue.image_id) imageIds.push(el.activeValue.image_id);
                    if (el.activeValue && el.activeValue.preview_image_id) imageIds.push(el.activeValue.preview_image_id);
                    if (el.activeValue && el.activeValue.value) atrValIds.push(el.activeValue.value);
                });
                let images = [];
                let atrVal = [];

                if (imageIds && imageIds.length) {
                    images = await models.uploaded_files.findAll({
                        where: {
                            id: {
                                [Op.in]: imageIds
                            }
                        },
                        raw: true
                    })
                }
                if (atrValIds && atrValIds.length) {
                    atrVal = await models.attribute_values.findAll({
                        where: { id: {
                                [Op.in]: atrValIds }, lang: product.lang },
                        attributes: ['id', 'origin_id', 'value'],
                        raw: true
                    })
                }
               
                if(configurator){
                    for(let item of configurator){
                        if(item && item.originAtrGrId){
                            let findStep = await models.attribute_groups.findOne({
                                where: {id:item.originAtrGrId},
                                transaction
                            })
                            if(findStep) findStep = findStep.toJSON()
                            if(findStep && findStep.step_id && config.SHOWER_GLASS_STEP_IDS.includes(findStep.step_id)){
                                if(item.originAtrId){
                                    let whereFilter = { 
                                        product_id: product.id, 
                                        attribute_id: item.originAtrId
                                    }
                                    if(item.originAtrValueId){
                                        whereFilter.value = item.originAtrValueId
                                    }
                                    let getAttrPrice =  await models.product_to_attribute.findOne({
                                        where: whereFilter,
                                        raw: true,
                                        transaction
                                    });
                                    if(getAttrPrice){
                                        if(getAttrPrice.discount){
                                            product.mat = Math.ceil(getAttrPrice.price - (getAttrPrice.price * (getAttrPrice.discount / 100)));
                                            product.mat =  product.mat / 100
                                        } else {
                                            product.mat = getAttrPrice.price / 100
                                        }
                                        product.changedMat = true
                                        product.changedMatAtrId = item.originAtrId
                                    } 
                                    
                                }
                                
                            } 
                        }
                    }
                }
                
                

                for (let attribute of product.product_attribute) {
                    if(attribute.group_atr == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                        if(attribute.activeValue && attribute.activeValue){
                            attribute.activeValue.price = attribute.price 
                            attribute.activeValue.price_type = attribute.price_type
                        } 
                        
                    }
                    if(!configurator && attribute && attribute.activeValue.is_default && attribute.attribute_group && attribute.attribute_group.step && attribute.attribute_group.step.id && config.SHOWER_GLASS_STEP_IDS.includes(attribute.attribute_group.step.id)){
                        if(attribute.activeValue.price){
                            if(attribute.activeValue.discount){
                                product.mat = Math.ceil(attribute.activeValue.price - (attribute.activeValue.price * (attribute.activeValue.discount / 100)));
                                product.mat =  product.mat / 100
                            } else {
                                product.mat = attribute.activeValue.price / 100
                            }
                            product.changedMat = true
                            product.changedMatAtrId = attribute.id
                        } 
                    }
                    if (attribute && attribute.activeValue && attribute.activeValue.image_id) {
                        attribute.activeValue.image = images.find(el => el.id == attribute.activeValue.image_id)
                    } else {
                        attribute.activeValue.image = null;
                    };
                    if (attribute && attribute.activeValue && attribute.activeValue.preview_image_id) {
                        attribute.activeValue.preview_image = images.find(el => el.id == attribute.activeValue.preview_image_id)
                    } else {
                        attribute.activeValue.preview_image = null;
                    }
                    if (attribute && attribute.activeValue && attribute.activeValue.value) {
                        let val = atrVal.find(el => el.id == attribute.activeValue.value);
                        if(val){
                            val.is_default = attribute.activeValue.is_default && attribute.activeValue.value == val.id ? true : null;
                            attribute.activeValue.value = val;
                        }
                    }
                    if (attribute && attribute.activeValue && attribute.activeValue.price) {
                        if(attribute.activeValue.price != -1) attribute.activeValue.price = attribute.activeValue.price / 100
                    }
                }

                product.steps = product.product_attribute.filter(el => el.group_atr);
                if (product.steps && product.steps.length) {


                    let uniqueStep = product.steps
                        .map(item => item.attribute_group.step.id)
                        .filter((value, index, self) => self.indexOf(value) === index);

                    let allUniqueGroup = product.steps
                        .map(item => item.group_atr)
                        .filter((value, index, self) => self.indexOf(value) === index);


                    let steps = [];
                    if (uniqueStep && uniqueStep.length) {

                        let stepsArr = await models.steps.findAll({
                            where: {
                                id: {
                                    [Op.in]: uniqueStep
                                },
                                lang: product.lang
                            },
                            attributes: ['id', 'origin_id', 'title'],
                            raw: true
                        })
                        let groupsArr = await models.attribute_groups.findAll({
                            where: { id: {
                                    [Op.in]: allUniqueGroup }, lang: product.lang },
                            attributes: ['id', 'origin_id', 'type', 'title', 'text', 'hint_text', 'video_links'],
                            raw: true
                        })
                        if (groupsArr && groupsArr.length) groupsArr = groupsArr.map(el => {
                            if (el.video_links) el.video_links = JSON.parse(el.video_links)
                            return el;
                        })


                        for (let step of uniqueStep) {
                            let pushObj;
                            if (stepsArr && stepsArr.length) {
                                pushObj = stepsArr.find(el => el.id == step);
                            }

                            let uniqueGroup = product.steps
                                .filter(item => item.attribute_group.step.id == step)
                                .map(item => item.group_atr)
                                .filter((value, index, self) => self.indexOf(value) === index);


                            let attribute_groups = [];
                            for (let group_atr of uniqueGroup) {
                                let atrGroupsObj = groupsArr.find(el => el.id == group_atr);

                                if (atrGroupsObj) {

                                    let stepAttributes = product.steps.filter(el => el.group_atr == group_atr && el.attribute_group.step.id == step);
                                    if (stepAttributes && stepAttributes.length) {

                                        if (config.ATR_GROUPS_IDS_WITH_VALUES.includes(group_atr)) {

                                            let uniqueGroupAttributes = stepAttributes
                                                .map(item => item.id)
                                                .filter((value, index, self) => self.indexOf(value) === index);

                                            if (uniqueGroupAttributes && uniqueGroupAttributes.length) {
                                                let pushAtr = [];
                                                for (let uniqueGrAtrId of uniqueGroupAttributes) {
                                                    let uniqueGrAtr = product.steps.find(el => el.id == uniqueGrAtrId);
                                                    let uniqueGrAtrVal = product.steps
                                                        .filter(el => el.id == uniqueGrAtrId && el.activeValue.value)
                                                        .map(el => {
                                                            let val = el.activeValue.value;
                                                            let prevImag = el.activeValue.preview_image;
                                                            let image = el.activeValue.image;
                                                            let price = el.activeValue.price;
                                                            return {
                                                                image,
                                                                price,
                                                                preview_image: prevImag,
                                                                ...val
                                                            }
                                                        });

                                                    let activeValue = uniqueGrAtr.activeValue;
                                                    delete activeValue.value;

                                                    pushAtr.push({
                                                        id: uniqueGrAtr.id,
                                                        origin_id: uniqueGrAtr.origin_id,
                                                        title: uniqueGrAtr.title,
                                                        image_id: uniqueGrAtr.image_id ? uniqueGrAtr.image_id : null,
                                                        preview_image_id: uniqueGrAtr.preview_image_id ? uniqueGrAtr.preview_image_id : null,
                                                        image: uniqueGrAtr.image ? uniqueGrAtr.image : null,
                                                        preview_image: uniqueGrAtr.preview_image ? uniqueGrAtr.preview_image : null,
                                                        values: uniqueGrAtrVal,
                                                        ...activeValue
                                                    });
                                                }
                                                stepAttributes = pushAtr;
                                            }

                                        } else {
                                            stepAttributes = stepAttributes.map(el => {
                                                let activeValue = el.activeValue;
                                                delete activeValue.value;
                                                return {
                                                    id: el.id,
                                                    origin_id: el.origin_id,
                                                    title: el.title,
                                                    ...activeValue,
                                                }
                                            });
                                        }
                                    }
                                    atrGroupsObj.attributes = stepAttributes;

                                    attribute_groups.push(atrGroupsObj);
                                    pushObj.attribute_groups = attribute_groups;
                                }

                            }
                            steps.push(pushObj);

                        }


                    }
                    product.steps = steps;

                }

                product.product_attribute = product.product_attribute
                    .filter(el => !el.group_atr && el.activeValue.value)
                    .map(el => {
                        return {
                            id: el.id,
                            title: el.title,
                            value: el.activeValue && el.activeValue.value ? el.activeValue.value : null
                        }
                    });
            }

            

            product.dimensions = await models.product_to_attribute.findAll({
                where: { product_id: product.id, attribute_id: null },
                attributes: ["id", "value", "is_default", "h", "s", "discount", "discount_type", "addition"],
                raw: true,
                transaction
            });

            if(product.type == config.PRODUCT_TYPES.SHOWER){
                let addition = product.dimensions.filter(item => item.addition)
                if(addition && addition.length){
                    for (const elem of addition) {
                        if(elem && elem.addition){
                            if(elem.addition == 'discount'){
                                product[elem.addition] = {
                                    type: elem.discount_type,
                                    value: elem.discount,
                                };
                            }else{
                                product[elem.addition] = {
                                    value: elem.value ? Number(elem.value) : 0,
                                    min: elem.s,
                                    max: elem.h,
                                };
                            }
    
                        }
                    }
                }
                delete product.dimensions;
                delete product.min_s;
                delete product.max_s;
                delete product.min_h;
                delete product.max_h;

            }else if(product.type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                product.price = null;
                product.discounted_price = null;
                let productVariations;
                if(product.product_variations && product.product_variations.length){
                    let variationsName = product.product_variations.find(item => !item.value);
                    if(variationsName && variationsName.name){
                        let variations = product.product_variations
                            .filter(item => item.value)
                            .map((item, index) => {
                                let i = item;
                                if(i.price) i.price = Math.round(i.price/100);
                                if(i.discounted_price) i.discounted_price = Math.round(i.discounted_price/100);
                                if(i.name) delete i.name;
                                if(index === 0){
                                    product.price = i.price;
                                    if(i.discounted_price )product.discounted_price = i.discounted_price;
                                }
                                return i
                            });
                        productVariations = {
                            name: variationsName.name,
                            variations: variations 
                        }
                        product.product_variations = productVariations;
                    }
                }
                delete product.dimensions;
                delete product.min_s;
                delete product.max_s;
                delete product.min_h;
                delete product.max_h;
                
            }

            if(!configurator){
                product.together_cheaper_products = await models.together_cheaper_products.findAll({
                    where: { product_id: product.id },
                    include: [{
                        model: models.product,
                        include: [{
                                model: models.uploaded_files,
                                as: 'image'
                            },
                            {
                                model: models.uploaded_files,
                                as: "hover_image"
                            },
                            {
                                model: models.mark,
                                as: 'product_marks',
                                through: { attributes: [] }
                            },
                        ]
                    }],
                    transaction
                });
                if (product.together_cheaper_products && product.together_cheaper_products.length) {
                    product.together_cheaper_products = await Promise.all(product.together_cheaper_products.map(async (el) => {
                        el = el.toJSON();
                        if(el){
                            if(el.product.price) el.product.price = el.product.price/100;
                            if(el.product.discounted_price) el.product.discounted_price = el.product.discounted_price/100;
                            if(el.product_promotional_price) el.product.promotional_price = el.product_promotional_price/100;
        
                            el.product.dimensions = await models.product_to_attribute.findAll({
                                where: { product_id:  el.product.id, attribute_id: null },
                                attributes: ["id", "value", "is_default", "h", "s", "discount", "discount_type"],
                                raw: true,
                                transaction
                            });
                        }
    
                        return el.product;
                    }))
                }

            }

            let product_contents = await models.product_content.findAll({
                where: { product_id: product.id },
                include: [
                    { model: models.uploaded_files, as: 'block_image' },
                ],
                transaction
            });

            if (product_contents && product_contents.length) product_contents = product_contents.map(i => i.toJSON());
            product.body = await extraUtil.convertProductBodyForFrontendFormat(product_contents);

            if(product.informer){
                product.informer = JSON.parse(product.informer)
                if(product.informer && product.informer.length){
                    for(let item of product.informer){
                        if(item.value == 'l') product.l.informer = item
                        if(item.value == 'l1') product.l1.informer = item
                        if(item.value == 'l1') product.l2.informer = item
                        if(item.value == 's') product.s.informer = item
                        if(item.value == 'h') product.h.informer = item
                        if(item.value == 'd') product.d.informer = item
                        if(item.value == 'm') product.m.informer = item
                    }
                }
            }

        }

        if (flag){
            return product;
        }else if(product && product.type == config.PRODUCT_TYPES.GLASS){
            return productPriceUtil.countPrice(product, false, false);
        }else if(product && product.type == config.PRODUCT_TYPES.SHOWER){
            return productPriceUtil.countShowerPrice(product, false, false,null,null,null,null,null,null,null,null,null,product.changedMat,product.changedMatAtrId);
        }else if(product && product.type == config.PRODUCT_TYPES.SIMPLE){
            product.price = product.price ? product.price/100 : null;
            product.discounted_price = product.discounted_price ? product.discounted_price/100 : null;
            return product;
        }else{
            return product;
        }

    } catch (err) {
        err.code = 400;
        throw err;
    }

}


module.exports = {

        getOnlyProductById: async(filter) => {
            try {

                let result = await models.product.findOne({
                    where: filter
                })

                if (result) result = result.toJSON();
                return result;
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },

        createProduct: async(product, dimensions, gallery, product_marks, categories, product_attribute,
             together_cheaper, recommended_products, steps, lang, isDublicate, addition, product_variations, trans) => {
            let transaction = null;
            try {
                transaction = trans ? trans : await sequelize.transaction();

                // let res = await models.product.findOne({
                //     where: { lang: product.lang },
                //     attributes: ["id", "position"],
                //     order: [
                //         ["position", "DESC"]
                //     ]
                // })
                // product.position = res && res.position ? res.position + 1 : 1;
                product.position = 1;
                await models.product.increment({ position: 1 }, {
                    where: {
                        position: {
                            [Op.ne]: null
                        }
                    },
                    transaction
                });

                let createdProduct = await models.product.create(product, {
                    include: [
                        { model: models.product_content }
                    ],
                    transaction
                });

                let indexLang = config.LANGUAGES.findIndex(el => el == createdProduct.lang);
                indexLang = indexLang >= 0 ? indexLang : 0;

                if (createdProduct && createdProduct.id) {

                    if(addition  && product.type && product.type == config.PRODUCT_TYPES.SHOWER){
                        for (const key in addition) {
                            if (Object.hasOwnProperty.call(addition, key)) {
                                const element = addition[key];
                                if(element){
                                    await models.product_to_attribute.create({
                                        product_id: createdProduct.id,
                                        value: element.value && !element.type ? element.value : null,
                                        h: element.max ? element.max : null,
                                        s: element.min ? element.min : null,
                                        addition: key ? key : null,
                                        discount_type: element.type ? element.type : null,
                                        discount: element.value ? element.value : null,
                                    }, { transaction });
                                }
                            }
                        }
                    }

                    if (categories && categories.length) {
                        for (let id of categories) {
                            if (id && id.id) {
                                let arr = [];
                                let category = await models.product_category.findOne({
                                    where: {
                                        [Op.or]: [{ id: id.id, lang }, { origin_id: id.id, lang }] },
                                    raw: true
                                })
                                if (category && category.id) arr.push(category.id);
                                if (category && category.parent_id !== 0) {
                                    arr.push(category.parent_id)
                                    let subCategory = await models.product_category.findOne({
                                        where: { id: category.parent_id },
                                        raw: true
                                    })
                                    if (subCategory) {
                                        arr.push(subCategory.parent_id)
                                    }
                                }
                                for (let i = arr.length - 1; i >= 0; i--) {
                                    await models.product_to_category.create({
                                        product_id: createdProduct.id,
                                        product_category_id: arr[i]
                                    }, { transaction })
                                }
                            } else {
                                throw new Error('There is no product category id');
                            }
                        }
                    } else {
                        throw new Error('There is no product category');
                    }

                    if (product_marks && product_marks.length) {
                        for (let id of product_marks) {
                            if (id && id.id) {
                                await models.product_to_mark.create({
                                    product_id: createdProduct.id,
                                    mark_id: isDublicate ? id.id : id.id+indexLang
                                }, { transaction })
                            } else {
                                throw new Error('There is no product marks id');
                            }
                        }
                    }

                    if (product_variations && product_variations.name && product_variations.variations) {
                        if(product_variations.variations.length){
                            if(!product.origin_id){
                                await models.product_variations.create({
                                    origin_id: 0,
                                    lang: product.lang,
                                    product_id: createdProduct.id,
                                    name: product_variations.name,
                                }, { transaction });
                                for (let variation of product_variations.variations) {
                                    if (variation && variation.value && variation.price) {
                                        await models.product_variations.create({
                                            origin_id: 0,
                                            lang: product.lang,
                                            product_id: createdProduct.id,
                                            name: product_variations.name,
                                            value: variation.value,
                                            price: variation.price ? variation.price*100 : null,
                                            discounted_price: variation.discounted_price ? variation.discounted_price*100 : null,
                                            sku: variation.sku ? variation.sku : null
        
                                        }, { transaction });
                                    }
                                }
                            }else{
                                let originProdVariation = await models.product_variations.findAll({
                                    where:{ product_id: product.origin_id },
                                    transaction
                                });
                                if(originProdVariation && originProdVariation.length){
                                    let originProdVariationName = originProdVariation.find(item => !item.value);
                                    let originProdVariationsArr = originProdVariation.filter(item => item.value);
                                    if(originProdVariationName && originProdVariationName.id){
                                        await models.product_variations.create({
                                            origin_id: originProdVariationName.id,
                                            lang: product.lang,
                                            product_id: createdProduct.id,
                                            name: product_variations.name,
                                        }, { transaction });
                                    }
                                    if(originProdVariationsArr && originProdVariationsArr.length){
                                        for (let i = 0; i < product_variations.variations.length; i++) {
                                            if (product_variations.variations[i] 
                                                && product_variations.variations[i].value 
                                                && product_variations.variations[i].price
                                                && originProdVariationsArr[i] && originProdVariationsArr[i].id ) {
                                                await models.product_variations.create({
                                                    origin_id: originProdVariationsArr[i].id,
                                                    lang: product.lang,
                                                    product_id: createdProduct.id,
                                                    name: product_variations.name,
                                                    value: product_variations.variations[i].value,
                                                    price: product_variations.variations[i].price ? product_variations.variations[i].price*100 : null,
                                                    discounted_price: product_variations.variations[i].discounted_price ? product_variations.variations[i].discounted_price*100 : null,
                                                    sku: product_variations.variations[i].sku ? product_variations.variations[i].sku : null
                                                }, { transaction });
                                            }
                                        }
                                    }
                                }
                            }
                        }else {
                            throw new Error('There is no product_variations');
                        }
                    }

                    if (recommended_products && recommended_products.length) {
                        for (let id of recommended_products) {
                            if (id && id.id) {
                                await models.recommended_products.create({
                                    product_id: createdProduct.id,
                                    product_recommended: isDublicate ? id.id : id.id+indexLang
                                }, { transaction })
                            } else {
                                throw new Error('There is no recommended products id');
                            }
                        }
                    }

                    if (product_attribute && product_attribute.length) {
                        for (let id of product_attribute) {
                            if (id && id.id && id.value && id.value.id) {
                                await models.product_to_attribute.create({
                                    product_id: createdProduct.id,
                                    value: isDublicate ? id.value.id : id.value.id+indexLang,
                                    attribute_id: isDublicate ? id.id : id.id+indexLang,
                                }, { transaction })
                            } else {
                                throw new Error('There is no product attribute->value->id');
                            }
                        }
                    }
                    if (steps && steps.length) {
                        for (let step of steps) {

                            if (step && step.attribute_groups && step.attribute_groups.length) {

                                for (let atrGr of step.attribute_groups) {

                                    if (atrGr && atrGr.attributes && atrGr.attributes.length) {

                                        for (let atr of atrGr.attributes) {

                                            if (config.ATR_GROUPS_IDS_WITH_VALUES.includes(atrGr.id)) {
                                                if (atr.values && atr.values.length) {
                                                    if (atr && atr.id) {
                                                        await models.product_to_attribute.create({
                                                            product_id: createdProduct.id,
                                                            value: null,
                                                            attribute_id: isDublicate ? atr.id : atr.id+indexLang,
                                                            discount: atr.discount ? atr.discount : null,
                                                            base: atr.base ? atr.base : null,
                                                            mat: atr.mat ? atr.mat : null,
                                                            no_option: atr.no_option ? atr.no_option : null,
                                                            price: atr.price ? atr.price * 100 : null,
                                                            is_default: atr.is_default ? 1 : null,
                                                            image_id: atr.image && atr.image.id ? atr.image.id : null,
                                                            preview_image_id: atr.preview_image && atr.preview_image.id ? atr.preview_image.id : null,
                                                            discount_type: config.DISCOUNT_TYPES.PERCENT,
                                                            dependent_atr_id: atr.dependent_atr_id ? isDublicate ? atr.dependent_atr_id : atr.dependent_atr_id+indexLang : null,
                                                        }, { transaction })

                                                    } else {
                                                        throw new Error('There is no product "options_attributes" "attribute" id or "value"');
                                                    }

                                                    for (let value of atr.values) {
                                                        if (atr && atr.id) {
                                                            await models.product_to_attribute.create({
                                                                product_id: createdProduct.id,
                                                                value: isDublicate ? value.id : value.id+indexLang,
                                                                attribute_id: isDublicate ? atr.id : atr.id+indexLang,
                                                                discount: atr.discount ? value.discount : null,
                                                                base: atr.base ? atr.base : null,
                                                                mat: atr.mat ? atr.mat : null,
                                                                price: value.price ? value.price * 100 : null,
                                                                no_option: atr.no_option ? atr.no_option : null,
                                                                is_default: value.is_default ? 1 : null,
                                                                image_id: value.image && value.image.id ? value.image.id : null,
                                                                preview_image_id: value.preview_image && value.preview_image.id ? value.preview_image.id : null,
                                                                discount_type: config.DISCOUNT_TYPES.PERCENT,
                                                                dependent_atr_id: atr.dependent_atr_id ? isDublicate ? atr.dependent_atr_id : atr.dependent_atr_id+indexLang : null,
                                                            }, { transaction })

                                                        } else {
                                                            throw new Error('There is no product "options_attributes" "attribute" id or "value"');
                                                        }
                                                    }
                                                }

                                            } else {
                                                if (atr && atr.id) {
                                                    await models.product_to_attribute.create({
                                                        product_id: createdProduct.id,
                                                        value: null,
                                                        attribute_id: isDublicate ? atr.id : atr.id+indexLang,
                                                        discount: atr.discount ? atr.discount : null,
                                                        base: atr.base ? atr.base : null,
                                                        mat: atr.mat ? atr.mat : null,
                                                        price: atr.price ? atr.price * 100 : null,
                                                        is_default: atr.is_default ? 1 : null,
                                                        no_option: atr.no_option ? atr.no_option : null,
                                                        image_id: atr.image && atr.image.id ? atr.image.id : null,
                                                        preview_image_id: atr.preview_image && atr.preview_image.id ? atr.preview_image.id : null,
                                                        discount_type: config.DISCOUNT_TYPES.PERCENT,
                                                        dependent_atr_id: atr.dependent_atr_id ? isDublicate ? atr.dependent_atr_id : atr.dependent_atr_id+indexLang : null,
                                                        addition: atr.addition ? JSON.stringify(atr.addition) : null,
                                                    }, { transaction })

                                                } else {
                                                    throw new Error('There is no product "options_attributes" "attribute" id or "value"');
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                throw new Error('There is no product  options "group_atr"  or "options_attributes"');
                            }
                        }
                    }

                    if (together_cheaper && together_cheaper.length) {
                        for (let el of together_cheaper) {
                            if (el && el.id && el.promotional_price) {
                                await models.together_cheaper_products.create({
                                    product_id: createdProduct.id,
                                    product_promotional_id: isDublicate ? el.id : el.id+indexLang,
                                    product_promotional_price: el.promotional_price * 100
                                }, { transaction })
                            } else {
                                throw new Error('There is no together cheaper product id or promotional_price');
                            }
                        }
                    }

                    if (gallery && gallery.length) {
                        for (let id of gallery) {
                            if (id && id.block_image && id.block_image.id) {
                                await models.product_to_uploaded_files.create({
                                    product_id: createdProduct.id,
                                    uploaded_files_id: id.block_image.id
                                }, { transaction })
                            } else {
                                throw new Error('There is no product gallery block image id');
                            }
                        }
                    }

                    if (dimensions && dimensions.length) {
                        for (let dimension of dimensions) {
                            if (dimension && dimension.s && dimension.h) {
                                await models.product_to_attribute.create({
                                    product_id: createdProduct.id,
                                    value: `${dimension.s}X${dimension.h}`,
                                    discount: dimension.discount ? dimension.discount : null,
                                    is_default: null,
                                    discount_type: dimension.discount_type ? dimension.discount_type : null,
                                    s: dimension.s,
                                    h: dimension.h

                                }, { transaction })
                            } else {
                                throw new Error('There is no s or h in dimensions');
                            }
                        }
                    }

                    createdProduct = await getProduct({ id: createdProduct.id }, transaction);

                }

                if (!trans) await transaction.commit();
                return createdProduct;

            } catch (err) {
                if (!trans) await transaction.rollback();
                err.code = 400;
                throw err;
            }
        },

        updateProduct: async(productId, originProdId, lang, productData, bodyData, dimensions, gallery, product_marks, categories, product_attribute, together_cheaper, recommended_products, steps, addition, product_variations, trans) => {
            productData.updated_at = new Date().toISOString();

            let transaction = null;
            let result = null;
            try {
                transaction = trans ? trans : await sequelize.transaction();

                let allProductIds = await models.product.findAll({ where: {
                        [Op.or]: [{ id: originProdId }, { origin_id: originProdId }] }, raw: true })
                let prodIdsToDelete = [];
                if (allProductIds && allProductIds.length) {
                    allProductIds.forEach(el => {
                        if (el.id) prodIdsToDelete.push(el.id);
                    })
                }

                if (addition  && productData.type && productData.type == config.PRODUCT_TYPES.SHOWER) {
                    await models.product_to_attribute.destroy({ where: { product_id: prodIdsToDelete, attribute_id: null, addition: { [Op.ne]: null } }, transaction });
                    for (let product of allProductIds) {
                        for (const key in addition) {
                            if (Object.hasOwnProperty.call(addition, key)) {
                                const element = addition[key];
                                if(element){
                                    await models.product_to_attribute.create({
                                        product_id: product.id,
                                        value: element.value && !element.type ? element.value : null,
                                        h: element.max ? element.max : null,
                                        s: element.min ? element.min : null,
                                        addition: key ? key : null,
                                        discount_type: element.type ? element.type : null,
                                        discount: element.value ? element.value : null,
                                    }, { transaction });
                                }
                            }
                        }
                    }
                }

                if (categories && categories.length) {
                    await models.product_to_category.destroy({ where: { product_id: prodIdsToDelete }, transaction });
                    for (let product of allProductIds) {
                        let lang = product && product.lang ? product.lang : null;
                        for (let id of categories) {
                            if (id && id.id) {
                                let arr = [];
                                let originCategoryId = await models.product_category.findOne({
                                    where: {
                                        [Op.or]: [{ id: id.id }, { origin_id: id.id }] },
                                    raw: true
                                })
                                let checkId = originCategoryId && originCategoryId.origin_id ?
                                    originCategoryId.origin_id :
                                    (originCategoryId && originCategoryId.id ? originCategoryId.id : null);
                                let isHaveParent = true;
                                while (isHaveParent) {
                                    let category = await models.product_category.findOne({
                                        where: {
                                            [Op.or]: [{ id: checkId, lang: lang }, { origin_id: checkId, lang: lang }] },
                                        raw: true
                                    })
                                    if (category && category.parent_id !== 0) {
                                        arr.push(category.id);
                                        checkId = category.parent_id;
                                    } else {
                                        if (category && category.id) arr.push(category.id);
                                        isHaveParent = false;
                                    }
                                }
                                if (arr && arr.length) {
                                    for (let i = arr.length - 1; i >= 0; i--) {
                                        await models.product_to_category.create({
                                            product_id: product.id,
                                            product_category_id: arr[i]
                                        }, { transaction })
                                    }
                                }
                            } else {
                                throw new Error('There is no product category id');
                            }
                        }

                    }

                }

                if (product_marks) {
                    if (!product_marks.length) {
                        await models.product_to_mark.destroy({ where: { product_id: prodIdsToDelete }, transaction });
                    } else {
                        for (let product of allProductIds) {
                            let lang = product && product.lang ? product.lang : null;

                            for (let id of product_marks) {
                                if (id && id.id) {
                                    let mark = await models.mark.findOne({
                                        where: {
                                            [Op.or]: [{ id: id.id, lang: lang }, { origin_id: id.id, lang: lang }] },
                                        raw: true
                                    })
                                    if (mark && mark.id) {
                                        await models.product_to_mark.create({
                                            product_id: product.id,
                                            mark_id: mark.id
                                        }, { transaction })
                                    }
                                } else {
                                    throw new Error('There is no product marks id');
                                }
                            }

                        }
                    }
                }

                if (product_variations && product_variations.name && product_variations.variations) {
                    await models.product_variations.update({ name: product_variations.name }, { where: { product_id: productId, value: null }, transaction });
                    if(lang == config.LANGUAGES[0]){
                        if(product_variations.variations.length){
                            let oldVariations = await models.product_variations.findAll({
                                where: { 
                                    product_id: productId,
                                    lang: lang,
                                    value: { [Op.ne]: null }
                                },
                                transaction
                            });
                            
                            for (let value of product_variations.variations) {
                                let isOldVariations = oldVariations.find(item => item.id == value.id);
                                if(value.id && isOldVariations ){
                                    await models.product_variations.update({ 
                                        name: product_variations.name,
                                        value: value.value,
                                        price: value.price ? value.price*100 : null,
                                        discounted_price: value.discounted_price ? value.discounted_price*100 : null,
                                        sku: value.sku
                                    }, { where: { id: value.id, lang }, transaction });
                                    await models.product_variations.update({ 
                                        price: value.price ? value.price*100 : null,
                                        discounted_price: value.discounted_price ? value.discounted_price*100 : null,
                                        sku: value.sku
                                    }, { where: { origin_id: value.id }, transaction });
                                }else{
                                    const languages = config.LANGUAGES;
                                    let originValue;
                                    for(let [index, lang] of languages.entries()) {
                                        if (value && value.value) {
                                            let artVal = await models.product_variations.create({
                                                origin_id: originValue && originValue.id ? originValue.id : 0,
                                                lang: lang,
                                                product_id: productId+index,
                                                name: product_variations.name,
                                                value: value.value,
                                                price: value.price ? value.price*100 : null,
                                                discounted_price: value.discounted_price ? value.discounted_price*100 : null,
                                                sku: value.sku ? value.sku : null
                                            }, { transaction })
                                        if (!originValue) originValue = artVal;
                                        }
                                    }
                                        
                                }
                            }
                            if(oldVariations && oldVariations.length){
                                for (let oldValue of oldVariations) {
                                    let isDelOldVariations = product_variations.variations.find(item => item.id == oldValue.id);
                                    if(!isDelOldVariations){
                                        await models.product_variations.destroy({ where: { [Op.or]: [{ id: oldValue.id }, { origin_id: oldValue.id }] }, transaction });
                                    }
                                }
                            }
                            
                        }else{
                            throw new Error(errors.BAD_PRODUCT_INVALID_VARIATION_LENGTH.message);
                        }

                    }else{
                        if(product_variations.variations.length){
                            for (let value of product_variations.variations) {
                                if(value.id && value.value){
                                    await models.product_variations.update({ 
                                        value: value.value,
                                        name: product_variations.name
                                    }, { where: { id: value.id, lang }, transaction });
                                }
                            }
                        }
                    }
                }

                if (recommended_products) {
                    await models.recommended_products.destroy({ where: { product_id: productId }, transaction });
                    if (recommended_products.length) {
                        for (let id of recommended_products) {
                            if (id && id.id) {
                                await models.recommended_products.create({
                                    product_id: productId,
                                    product_recommended: id.id
                                }, { transaction })
                            } else {
                                throw new Error('There is no recommended products id');
                            }
                        }
                    }
                }

                if (product_attribute) {
                    if(lang == config.LANGUAGES[0]){
                        let attributeIds = await models.product_to_attribute.findAll({
                            where: {
                                product_id: prodIdsToDelete,
                                attribute_id: {
                                    [Op.ne]: null
                                },
                            },
                            include: [{
                                model: models.attribute,
                                where: { group_atr: {
                                        [Op.eq]: null } },
                            }],
                        });
                        attributeIds = attributeIds.map(el => el.id);
                        if (attributeIds && attributeIds.length) {
                            await models.product_to_attribute.destroy({
                                where: {
                                    id: {
                                        [Op.in]: attributeIds },
                                },
                                transaction
                            });
                        }

                        if (product_attribute.length) {
                            for (let product of allProductIds) {
                                let indexLang = config.LANGUAGES.findIndex(el => el == product.lang);
                                indexLang = indexLang >= 0 ? indexLang : 0;
                                for (let id of product_attribute) {
                                    if (id && id.id) {
                                        await models.product_to_attribute.create({
                                            product_id: product.id,
                                            value: id.value && id.value.id ? id.value.id+indexLang : null,
                                            attribute_id: id.id+indexLang,
                                        }, { transaction })
                                    } else {
                                        throw new Error('There is no product attribute id');
                                    }
                                }
                            }
                        }
                    }
                }


                if (steps) {
                    if(lang == config.LANGUAGES[0]){
                        let optionAttributeIds = await models.product_to_attribute.findAll({
                            where: {
                                product_id: prodIdsToDelete,
                                attribute_id: {
                                    [Op.ne]: null
                                },
                            },
                            include: [{
                                model: models.attribute,
                                where: { group_atr: {
                                        [Op.ne]: null } },
                            }],
                            transaction
                        });

                        optionAttributeIds = optionAttributeIds.map(el => el.id);
                        if (optionAttributeIds && optionAttributeIds.length) {
                            await models.product_to_attribute.destroy({
                                where: {
                                    id: {
                                        [Op.in]: optionAttributeIds },
                                },
                                transaction
                            });
                        }
                        if (steps.length) {
                            for (let product of allProductIds) {
                                let indexLang = config.LANGUAGES.findIndex(el => el == product.lang);
                                indexLang = indexLang >= 0 ? indexLang : 0;
                                for (let step of steps) {
        
                                    if (step && step.attribute_groups && step.attribute_groups.length) {
        
                                        for (let atrGr of step.attribute_groups) {
        
                                            if (atrGr && atrGr.attributes && atrGr.attributes.length) {
        
                                                for (let atr of atrGr.attributes) {
        
                                                    if (config.ATR_GROUPS_IDS_WITH_VALUES.includes(atrGr.id)) {
        
                                                        if (atr && atr.id) {
                                                            await models.product_to_attribute.create({
                                                                product_id: product.id,
                                                                value: null,
                                                                attribute_id: atr.id+indexLang,
                                                                discount: atr.discount ? atr.discount : null,
                                                                base: atr.base ? atr.base : null,
                                                                mat: atr.mat ? atr.mat : null,
                                                                price: atr.price ? atr.price * 100 : null,
                                                                no_option: atr.no_option ? atr.no_option : null,
                                                                is_default: atr.is_default ? 1 : null,
                                                                image_id: atr.image && atr.image.id ? atr.image.id : null,
                                                                preview_image_id: atr.preview_image && atr.preview_image.id ? atr.preview_image.id : null,
                                                                discount_type: config.DISCOUNT_TYPES.PERCENT,
                                                                dependent_atr_id: atr.dependent_atr_id ? atr.dependent_atr_id+indexLang : null,
                                                            }, { transaction })
        
                                                        } else {
                                                            throw new Error('There is no product "options_attributes" "attribute" id or "value"');
                                                        }
        
                                                        if (atr.values && atr.values.length) {
                                                            for (let value of atr.values) {
                                                                if (atr && atr.id) {
                                                                    await models.product_to_attribute.create({
                                                                        product_id: product.id,
                                                                        value: value.id+indexLang,
                                                                        attribute_id: atr.id+indexLang,
                                                                        discount: atr.discount ? atr.discount : null,
                                                                        base: atr.base ? atr.base : null,
                                                                        mat: atr.mat ? atr.mat : null,
                                                                        price: value.price ? value.price * 100 : null,
                                                                        no_option: atr.no_option ? atr.no_option : null,
                                                                        is_default: value.is_default ? 1 : null,
                                                                        image_id: value.image && value.image.id ? value.image.id : null,
                                                                        preview_image_id: value.preview_image && value.preview_image.id ? value.preview_image.id : null,
                                                                        discount_type: config.DISCOUNT_TYPES.PERCENT,
                                                                        dependent_atr_id: atr.dependent_atr_id ? atr.dependent_atr_id+indexLang : null,
                                                                    }, { transaction })
        
                                                                } else {
                                                                    throw new Error('There is no product "options_attributes" "attribute" id or "value"');
                                                                }
                                                            }
                                                        }
        
                                                    } else {
                                                        if (atr && atr.id) {
                                                            await models.product_to_attribute.create({
                                                                product_id: product.id,
                                                                value: null,
                                                                attribute_id: atr.id+indexLang,
                                                                discount: atr.discount ? atr.discount : null,
                                                                base: atr.base ? atr.base : null,
                                                                mat: atr.mat ? atr.mat : null,
                                                                price: atr.price ? atr.price * 100 : null,
                                                                is_default: atr.is_default ? 1 : null,
                                                                image_id: atr.image && atr.image.id ? atr.image.id : null,
                                                                no_option: atr.no_option ? atr.no_option : null,
                                                                preview_image_id: atr.preview_image && atr.preview_image.id ? atr.preview_image.id : null,
                                                                discount_type: config.DISCOUNT_TYPES.PERCENT,
                                                                dependent_atr_id: atr.dependent_atr_id ? atr.dependent_atr_id+indexLang : null,
                                                                addition : atr.addition ? JSON.stringify(atr.addition) : null
                                                            }, { transaction })
        
                                                        } else {
                                                            throw new Error('There is no product "options_attributes" "attribute" id or "value"');
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        throw new Error('There is no product  options "group_atr"  or "options_attributes"');
                                    }
                                }
                            }
                        }
                    }
                }

                if (dimensions && dimensions.length) {
                    await models.product_to_attribute.destroy({ where: { product_id: prodIdsToDelete, attribute_id: null, addition: null }, transaction });
                    for (let product of allProductIds) {
                        for (let dimension of dimensions) {
                            if (dimension && dimension.s && dimension.h) {
                                await models.product_to_attribute.create({
                                    product_id: product.id,
                                    value: `${dimension.s}X${dimension.h}`,
                                    discount: dimension.discount ? dimension.discount : null,
                                    is_default: null,
                                    discount_type: dimension.discount_type ? dimension.discount_type : null,
                                    s: dimension.s,
                                    h: dimension.h

                                }, { transaction })
                            } else {
                                throw new Error('There is no s or h in dimensions');
                            }
                        }
                    }
                }

                if (together_cheaper) {
                    await models.together_cheaper_products.destroy({ where: { product_id: prodIdsToDelete }, transaction });
                    if (together_cheaper.length) {
                        for (let product of allProductIds) {
                            let lang = product && product.lang ? product.lang : null;
                            for (let el of together_cheaper) {
                                if (el && el.id && el.id.id && el.promotional_price) {
                                    let checkProd = await models.product.findOne({
                                        where: {
                                            [Op.or]: [{ id: el.id.id, lang: lang }, { origin_id: el.id.id, lang: lang }] },
                                        raw: true
                                    })
                                    if (checkProd && checkProd.id) {
                                        await models.together_cheaper_products.create({
                                            product_id: product.id,
                                            product_promotional_id: checkProd.id,
                                            product_promotional_price: el.promotional_price * 100
                                        }, { transaction })
                                    }
                                } else {
                                    throw new Error('There is no together cheaper product id or promotional_price');
                                }
                            }
                        }
                    }
                }

                if (gallery) {
                    await models.product_to_uploaded_files.destroy({ where: { product_id: prodIdsToDelete }, transaction });
                    if (gallery.length) {
                        for (let product of allProductIds) {
                            for (let id of gallery) {
                                if (id && id.block_image && id.block_image.id) {
                                    await models.product_to_uploaded_files.create({
                                        product_id: product.id,
                                        uploaded_files_id: id.block_image.id
                                    }, { transaction })
                                } else {
                                    throw new Error('There is no product gallery block image id');
                                }
                            }
                        }
                    }
                }


                if (bodyData) {
                    //delete old product_content
                    await models.product_content.destroy({ where: { product_id: productId }, transaction });
                    if (bodyData.length) {
                        //create new product_content
                        await models.product_content.bulkCreate(bodyData, { transaction });
                    }
                }
                //update product
                await models.product.update(productData, { where: { id: productId }, transaction });

                result = await getProduct(productId, transaction);

                if (!trans) await transaction.commit();
                return result;

            } catch (err) {
                if (!trans) await transaction.rollback();
                err.code = 400;
                throw err;
            }
        },

        updateProductById: async(params, product, trans) => {
            let transaction = null;
            let filter = params;
            if (typeof filter !== 'object') {
                filter = { id: params }
            }
            try {
                transaction = trans ? trans : await sequelize.transaction();
                await models.product.update(product, { where: filter, transaction });
                let result = await models.product.findOne({
                    where: filter,
                    transaction
                });

                if (!trans) await transaction.commit();

                return result;

            } catch (err) {
                if (!trans) await transaction.rollback();
                err.code = 400;
                throw err;
            }

        },

        updateProductQuantityByFilter: async(filter, count, trans) => {
            let transaction = null;

            try {
                transaction = trans ? trans : await sequelize.transaction();

                let product = await models.product.findOne({
                    where: filter,
                    transaction
                });

                let quantity;
                let availability;
                if (product && product.quantity) {
                    quantity = product.quantity - count;
                    if (quantity < 0) {
                        quantity = 0;
                        availability = 0
                    }
                    product = await models.product.update({
                        quantity,
                        availability
                    }, { where: filter, transaction });
                }


                if (!trans) await transaction.commit();

                return product;

            } catch (err) {
                if (transaction) await transaction.rollback();
                err.code = 400;
                throw err;
            }

        },

        getMetaDataBySlagOrUrl: async(url, trans) => {
            let transaction = trans ? trans : null;
            try {
                let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
                if (!metaData) {
                    let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                    let isItSlag = await models.links.findOne({ where: { slug: slug }, transaction });

                    if (isItSlag && isItSlag.original_link) {
                        metaData = await models.meta_data.findOne({ where: { url: isItSlag.original_link }, transaction });
                    }
                }
                return metaData;
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },


        getProduct: getProduct,

        getCategoryChildren: async(isRequiredProduct, category_id, lang) => {
            log.info(`Start getCategoryChildren data:${JSON.stringify(isRequiredProduct, category_id, lang)}`)
            if (isRequiredProduct) {
                let result = await models.product_category.findAll({
                    where: { parent_id: category_id, lang: lang },
                    include: [{
                            model: models.uploaded_files,
                            as: "image"
                        },
                        {
                            model: models.product,
                            as: 'product',
                            required: true,
                            through: { attributes: [], where: { product_category_id: category_id } }
                        }
                    ]
                })
                if (result) {
                    log.info(`End getCategoryChildren data:${JSON.stringify(result)}`)
                    return result.map(i => i.toJSON());
                } else return false

            } else {
                let result = await models.product_category.findAll({
                    where: { parent_id: category_id, lang: lang },
                    include: [{
                        model: models.uploaded_files,
                        as: "image"
                    }]
                })
                log.info(`End getCategoryChildren data:${JSON.stringify(result)}`)
                return result.map(i => i.toJSON());
            }


        },
        topParentCategory: async(id) => {
            log.info(`Start topParentCategory data:${JSON.stringify(id)}`)

            let result = await models.product_category.findOne({
                where: { id: id },
                raw: true
            })

            if (result.parent_id != 0) {
                let result2 = await models.product_category.findOne({
                    where: { id: result.parent_id },
                    raw: true
                })
                if (result2.parent_id != 0) {
                    let result3 = await models.product_category.findOne({
                        where: { id: result2.parent_id },
                        raw: true
                    })
                    return result3
                } else return result2
            } else return result;

        },


        getCagegoryById: async(id) => {

            log.info(`Start getCagegoryById service data:${JSON.stringify(id)}`)
            let result = await models.product_category.findOne({
                where: { id: id }
            })
            if (result) {
                result = result.toJSON();
                result.sections = [{
                    body: [{
                        type: "2",
                        content: {
                            hidden_text: result.seo_hidden_text ? result.seo_hidden_text : null,
                            text: result.seo_text ? result.seo_text : null,
                            title: result.seo_title ? result.seo_title : null,
                        }

                    }]
                }]
                delete result.seo_hidden_text;
                delete result.seo_text;
                delete result.seo_title;
            }

            log.info(`End getCagegoryById service data:${JSON.stringify(result)}`)
            return result
        },

        getCategoryByslug: async(slug, lang) => {
            let result = await models.product_category.findOne({
                where: { id: slug },
                include: [
                    /*{
                        model: models.uploaded_files,
                        as: "image"
                    },*/
                    // {
                    //     model: models.uploaded_files,
                    //     as: "seo_image"
                    // }
                ]
            });
            if (result && lang && result.lang !== lang) {
                let filter = result.origin_id === 0 ? {
                    [Op.or]: [{ id: result.id, lang: lang }, { origin_id: result.id, lang: lang }]
                } : {
                    [Op.or]: [{ id: result.origin_id, lang: lang }, { origin_id: result.origin_id, lang: lang }]
                };
                result = await models.product_category.findOne({
                    where: filter,
                    include: [
                        /*{
                            model: models.uploaded_files,
                            as: "image"
                        },*/
                        // {
                        //     model: models.uploaded_files,
                        //     as: "seo_image"
                        // }
                    ]
                });
            }
            return result.toJSON();
        },

        async getCategories(admin, filter) {
            log.info(`Start getCategories data:${JSON.stringify(admin, filter)}`)
            try {

                let include = {}
                if (!admin) {
                    include = [
                        /*{
                            model: models.product, as: 'product',
                            where: {status: config.GLOBAL_STATUSES.ACTIVE},
                            through: {attributes: []},
                            required: true
                        },*/
                        // {
                        //     model: models.uploaded_files,
                        //     as: "image"
                        // }

                    ]
                } else {
                    include = [{
                            model: models.product,
                            as: 'product',
                            attributes: [],
                            through: { attributes: [] }
                        },
                        {
                            model: models.uploaded_files,
                            as: "image"
                        }
                    ]
                }
                let result = await models.product_category.findAll({
                    include: include,
                    where: filter
                });

                log.info(`End getCategories data:${JSON.stringify(result)}`)
                return result.map(kit => kit.toJSON());
            } catch (err) {
                log.error(err)
                err.code = 400;
                throw err;
            }
        },
        getAllCategory: async(where) => {
            let result = await models.product_category.findAll({
                where: where,
                order: [
                    ['position', 'ASC']
                ],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM product_to_category
                    WHERE
                        product_to_category.product_category_id = product_category.id
                )`),
                            'includeProductsCount'
                        ],
                    ],

                }

            })

            let mass = []
            for (let e of result) {
                e = e.toJSON()
                if (!e.includeProductsCount) {} else {
                    e.under_category = await models.product_category.findAll({
                        where: {
                            parent_id: e.id,
                            lang: where.lang
                        },
                        order: [
                            ['position', 'ASC']
                        ],
                        attributes: {
                            include: [
                                [
                                    sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM product_to_category
                    WHERE
                        product_to_category.product_category_id = product_category.id
                )`),
                                    'includeProductsCount'
                                ],
                            ],

                        }
                    })
                    let under_category = []
                    for (let a of e.under_category) {
                        a = a.toJSON()
                        if (!a.includeProductsCount) {

                        } else {
                            a.slug = await models.links.findOne({
                                where: {
                                    original_link: `/shop/getCategory/${a.id}`
                                },
                                attributes: ['slug']
                            })
                            a.slug = a.slug.toJSON()

                            under_category.push(a)
                        }

                    }
                    e.under_category = under_category
                    under_category = []
                    mass.push(e)
                }

            }
            result = mass
            return result

        },

        getAllAttributes: async(filter) => {


            let result = await models.attribute.findAll({
                where: filter,
                attributes: ['id', 'title']
            })

            return result.map(i => i.toJSON())
        },

        getAllProducts: async(category, sort, filter, brand, attributes, productIds, perPage, page, offset, limit) => {
            try {
                let order = []
                let variationOrder = []
                let where = {}
                let whereVariation = {
                    //status: 1
                }
                let whereCategory = {}
                let whereBrand = {}
                let whereAttributes = {}
                let attrIds = []
                let attrValue = []
                if (attributes) {
                    attributes.forEach(a => {
                        attrIds.push(a.attribute_id)
                        attrValue.push(a.value)
                    })
                    whereAttributes.attribute_id = attrIds
                    whereAttributes.value = attrValue
                }
                if (sort && sort.price) {
                    order.push(['price', sort.price])
                }
                if (sort && sort.popular) {
                    order.push(['popular', sort.popular])
                }
                //TODO:Check this sorting (add new fields)

                if (sort && sort.novelty) {
                    order.push(['novelty', sort.novelty])
                }
                if (sort && sort.promotional) {
                    order.push(['promotional', sort.promotional])
                }
                if (sort && sort.name) {
                    order.push(['name', sort.name])
                }
                if (!sort) {
                    order.push(['created_at', 'DESC'])
                }
                if (filter && filter.price) {
                    whereVariation.price = {
                        [Op.between]: [filter.price.from, filter.price.to]
                    }
                }
                if (filter && filter.status) {
                    where.status = filter.status
                } else {
                    where.status = config.GLOBAL_STATUSES.ACTIVE
                }
                if (productIds) {
                    where.id = productIds
                }
                if (category) {
                    whereCategory = { id: category }
                }
                if (brand) {
                    whereBrand = { id: brand }
                }

                let result = await models.product.findAndCountAll({
                    include: [{
                            model: models.product_variations,
                            as: "product_variations",
                            required: true,
                            //order: variationOrder,
                            attributes: variationAttributes,
                            where: whereVariation,


                            include: [
                                { model: models.uploaded_files, as: "image" },
                                {
                                    model: models.attribute,
                                    as: 'attribute',
                                    required: true,
                                    attributes: ['id', 'title', 'value', 'status', 'type'],
                                    through: { attributes: ['value'], as: 'activeValue', where: whereAttributes }
                                    //through: {attributes: ['value'], as: 'activeValue', where: {attribute_id: [7], value: ["4"]}}
                                    //through: {attributes: ['value'], as: 'activeValue', where: attributes}

                                }
                            ]
                        },
                        { model: models.brand, as: 'brand', attributes: ['title'], where: whereBrand },
                        {
                            model: models.product_category,
                            as: 'category',
                            attributes: ['id', 'title', 'slug'],
                            required: true,
                            through: { attributes: [] },
                            where: whereCategory
                        },
                        { model: models.model, as: "model", attributes: ['title'] }, {
                            model: models.product_mark,
                            through: { attributes: [] }
                        },


                    ]
                })

                let prices = await models.product.findAll({
                    // attributes: [[sequelize.fn('max', sequelize.col('price')), 'maxPrice']],
                    // where: {status: config.GLOBAL_STATUSES.ACTIVE},
                    attributes: [],
                    include: [{
                            model: models.product_variations,
                            //where: {status: 1},
                            attributes: [
                                [sequelize.fn('max', sequelize.col('product_variations.price')), 'maxPrice'],
                                [sequelize.fn('min', sequelize.col('product_variations.price')), 'minPrice']
                            ]
                        },
                        {
                            model: models.product_category,
                            as: 'category',
                            attributes: [],
                            where: whereCategory
                        },
                    ]
                })

                if (prices[0].product_variations[0]) {
                    prices = {...prices[0].product_variations[0].dataValues }
                }

                // result =    JSON.parse(JSON.stringify(result));
                result = result.map(function(item) {
                    return item.toJSON();
                })
                return {
                    products: result,
                    minPrice: prices.minPrice,
                    maxPrice: prices.maxPrice,
                };
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },


        getProductById: async(id, getByUser) => {
            try {
                if (getByUser) {
                    await models.product.increment('popular', { by: 1, where: { id: id } });
                }
                let result = await models.product.findOne({
                        where: { id: id },
                        include: [{
                                model: models.brand,
                                attributes: ['id']
                            },
                            {
                                model: models.product_category,
                                as: 'category',
                                // attributes: ['id', 'title', 'parent_id', 'origin_id'],
                                through: { attributes: [] },
                                include: [{
                                    model: models.attribute,
                                    as: 'attributes',
                                    attributes: ['id', 'title'],
                                    through: { attributes: [] }
                                }]
                            },
                            {
                                model: models.mark,
                                as: 'product_marks',
                                through: { attributes: [] },
                                include: [{
                                    model: models.uploaded_files,
                                    as: 'image'
                                }]
                            },
                            {
                                model: models.attribute,
                                as: 'product_attribute',
                                attributes: ['id', 'title', "unit_of_measurement"],
                                through: { attributes: ['value'], as: 'activeValue' }
                            },
                            {
                                model: models.uploaded_files,
                                as: 'gallery',
                                through: { attributes: [] }
                            },
                            {
                                model: models.uploaded_files,
                                as: "image"
                            },
                            {
                                model: models.recommended_products,
                                include: [{
                                    model: models.product,
                                    include: [{
                                            model: models.uploaded_files,
                                            as: 'image'
                                        },
                                        {
                                            model: models.mark,
                                            as: 'product_marks',
                                            through: { attributes: [] }
                                        },
                                        {
                                            model: models.attribute,
                                            as: 'product_attribute',
                                            attributes: ['id', 'title'],
                                            through: { attributes: ['value'], as: 'activeValue' }
                                        },
                                    ]
                                }]
                            },
                            {
                                model: models.together_cheaper_products,
                                include: [{
                                    model: models.product,
                                    include: [{
                                        model: models.uploaded_files,
                                        as: 'image'
                                    }]
                                }]
                            },
                            // {
                            //     model: models.product_testimonials,
                            //     where: { status: config.GLOBAL_STATUSES.ACTIVE },
                            //     required: false
                            // },

                        ]
                    })
                    // result =    JSON.parse(JSON.stringify(result));
                    // if(result && result.characteristic && result.characteristic.length > 0) result.characteristic = JSON.parse(result.characteristic)

                //  if( result && result.gallery) result.gallery = result.gallery.split(",");

                // if (result && result.gallery) {
                //     result.dataValues.gallery = await models.uploaded_files.findAll(({
                //         where: {
                //             file_type: 'image',
                //             id: {
                //                 [Op.in]: result.gallery
                //             }
                //         }
                //     }))
                //     if (result.gallery && result.gallery.length) {
                //         result.dataValues.gallery = result.gallery.map((image) => {
                //             return image.toJSON()
                //         })
                //     }
                // }
                // if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                //     result.dataValues.similar_products = await models.product.findAll({
                //         where: {
                //             id: {
                //                 [Op.in]: result.similar_products
                //             }
                //         },
                //         include: [{
                //             model: models.uploaded_files,
                //             as: "image"
                //         }, {
                //             model: models.product_variations,
                //             as: "product_variations",
                //             attributes: variationAttributes,
                //             include: [{
                //                 model: models.attribute,
                //                 as: 'attribute',
                //                 attributes: ['id', 'title', 'value', 'status', 'type'],
                //                 through: { attributes: ['value'], as: 'activeValue' }
                //             }]
                //         }]
                //     });
                //     if (result.similar_products && result.similar_products.length) {
                //         result.dataValues.similar_products = result.similar_products.map((product) => {
                //             product.dataValues.product_variations = product.product_variations[0]
                //             return product.toJSON()
                //         })
                //     }
                // }
                result = result.toJSON();
                return result;
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },

        getProductByslug: async(id, getByUser, flag, default_atr_ids) => {
            try {
                let filter = id;
                if (typeof filter !== 'object') {
                    filter = { id: id };
                }
                let result = await getProduct(filter, null, flag, default_atr_ids);

                if (getByUser && result) {
                    let originId = result && result.origin_id ? result.origin_id : result.id;
                    await models.product.increment('popular', {
                        by: 1,
                        where: {
                            [Op.or]: [{ id: originId }, { origin_id: originId }]
                        }
                    });
                }

                return result;

            } catch (err) {
                err.code = 400;
                throw err;
            }
        },


        deleteProduct: async(product_ids, trans) => {
            let transaction = null;
            try {

                transaction = trans ? trans : await sequelize.transaction();
                for (let id of product_ids) {
                    let product = await models.product.findOne({
                        where: { id: id }
                    })
                    if (product && product.status == config.GLOBAL_STATUSES.DELETED) {
                        let deletedProduct = await models.product.findOne({
                            where: { id: id },
                            include: [{
                                model: models.product_variations,
                                as: "product_variations",
                                attributes: variationAttributes
                            }]
                        })

                        await models.product_to_category.destroy({
                            where: { product_id: id },
                            transaction
                        })

                        for (let variatation of deletedProduct.product_variations) {
                            await models.product_to_attribute.destroy({ where: { product_variation_id: variatation.id }, transaction });
                            await models.product_variations.destroy({ where: { id: variatation.id }, transaction })
                        }
                        await models.product.destroy({
                            where: { id: id },
                            transaction
                        })
                    } else {
                        await models.product.update({ status: 0 }, { where: { id: id }, transaction });
                    }
                }
                //Change in db but not return on front

                if (!trans) await transaction.commit();
                let result = await models.product.findAll({
                    where: { id: product_ids },
                    through: { attributes: [] }
                })
                return result;
            } catch (err) {
                err.code = 400;
                if (transaction) await transaction.rollback();
                throw err;
            }
        },

        editProduct: async(data, categories, product_variations, id, trans) => {
            let transaction = null;
            try {

                transaction = trans ? trans : await sequelize.transaction();
                let editedProduct = await models.product.findOne({
                    where: { id: id },
                    include: [{
                        model: models.product_variations,
                        as: "product_variations",
                        attributes: variationAttributes
                    }]
                })
                await models.product.update(data, { where: { id: id }, transaction });
                if (product_variations) {
                    //DESTROY
                    for (let variatation of editedProduct.product_variations) {
                        await models.product_to_attribute.destroy({ where: { product_variation_id: variatation.id }, transaction });
                    }
                    await models.product_variations.destroy({ where: { product_id: id }, transaction });
                    //CREATE
                    for (let variation of product_variations) {
                        let prodVar = await models.product_variations.create({
                            product_id: id,
                            sku: variation.sku,
                            price: variation.price,
                            old_price: variation.old_price,
                        }, { transaction });
                        for (let atr of variation.attrubutes) {
                            await models.product_to_attribute.create({
                                attribute_id: atr.id,
                                value: atr.value,
                                product_variation_id: prodVar.id
                            }, { transaction })
                        }
                    }
                }
                if (categories) {

                    await models.product_to_category.destroy({ where: { product_id: id }, transaction });

                    for (let catId of categories) {
                        await models.product_to_category.create({ product_id: id, product_category_id: catId }, { transaction })
                    }
                }

                if (!trans) await transaction.commit();
                let result = await models.product.findOne({
                    where: { id: id },
                    include: [
                        { model: models.brand, as: 'brand', attributes: ['title'] },
                        {
                            model: models.product_category,
                            as: 'category',
                            attributes: ['id', 'title', 'slug'],
                            through: { attributes: [] }
                        },
                        {
                            model: models.product_variations,
                            as: "product_variations",
                            attributes: variationAttributes,
                            include: [{
                                model: models.attribute,
                                as: 'attribute',
                                attributes: ['id', 'title', 'value', 'status', 'type'],
                                through: { attributes: ['value'], as: 'activeValue' }
                            }]
                        },
                        { model: models.model, as: "model", attributes: ['title'] }
                    ],
                    through: { attributes: [] }
                })
                return result;
            } catch (err) {
                err.code = 400;
                if (transaction) await transaction.rollback();
                throw err;
            }
        },

        changeProductStatus: async(status, product_ids) => {

            await models.product.update(status, { where: { id: product_ids } });
            let result = await models.product.findAll({
                where: { id: product_ids }
            })
            return result;
        },

        // get favorites  for  GET request by user_id
        getFavorites: async(data) => {
            log.info(`Start  getFavorites Params: ${JSON.stringify(data)}`)
            let favorite = await models.product_favorites.findAndCountAll({
                limit: 12,
                where: { user_id: data.user_id },
                distinct: true,
                raw: true,
            });


            for (let i of favorite.rows) {

                const filter = {
                    [Op.or]: [
                        { id: i.product_id, lang: data.lang,status:config.GLOBAL_STATUSES.ACTIVE },
                        { origin_id: i.product_id, lang: data.lang,status:config.GLOBAL_STATUSES.ACTIVE },
                    ],
                };
                let product = await models.product.findOne({
                    where: filter,
                    include: [
                        { model: models.uploaded_files, as: "image" },
                        {
                            model: models.product_variations
                        },
                        {
                            model: models.mark,
                            as: "product_marks",
                            through: { attributes: [] },
                            include: [{
                                model: models.uploaded_files,
                                as: "mark_image",
                            }, ],
                        },
                    ],
                });
                product = product.toJSON();
                if (product) {
                    i.product = {...product };
                }
            }
            log.info(`End  getFavorites Result: ${JSON.stringify(favorite)}`)
            return favorite;
        },
        // add favorites for POST request by  user_id,  product_id , type { kit or product}
        addfavorites: async(data) => {
            log.info(`Start  addfavorites Params: ${JSON.stringify(data)}`)
            await models.product_favorites.destroy({ where: data });
            let result = await models.product_favorites.create(data);
            log.info(`End  addfavorites Result: ${JSON.stringify(result)}`)
            return result;
        },
        // delete favorites for POST request by  user_id,  product_id , type { kit or product}
        deletefavorites: async(data) => {
            log.info(`Start  deletefavorites Params: ${JSON.stringify(data)}`)
            let result = await models.product_favorites.destroy({ where: data });
            log.info(`End  deletefavorites Result: ${JSON.stringify(result)}`)
            return result;
        },

        checkFavorites: async(data) => {
            log.info(`Start  checkFavorites Params: ${JSON.stringify(data)}`)
            let result = await models.product_favorites.findOne({ where: data });
            log.info(`End  checkFavorites Result: ${JSON.stringify(result)}`)
            return result

        },
        getCountFavorites: async(user_id) => {
            log.info(`Start  getCountFavorites Params: ${JSON.stringify(user_id)}`)
            let result = await models.product_favorites.findAndCountAll({
                where: { user_id: user_id },
                distinct:true,
                include:[{
                   model: models.product,
                   required:true,
                   where: {status: config.GLOBAL_STATUSES.ACTIVE}
               }] 
           });
            log.info(`End  getCountFavorites Result: ${JSON.stringify(result)}`)
            return result.count ? result.count : 0

        },
        getAllFavoritesProductIds: async(user_id) => {
            log.info(`Start  getAllFavoritesProductIds Params: ${JSON.stringify(user_id)}`)
            let result = await models.product_favorites.findAll({ where: { user_id: user_id } });
            if (result && result.length) result = result.map(el => el.product_id)
            log.info(`End  getAllFavoritesProductIds Result: ${JSON.stringify(result)}`)
            return result
        },

        getProductsByIdsForMainPage: async(ids, currencyType, currencyValue, user) => {
            let result = await models.product.findAll({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                },
                include: [{ model: models.product_variations }, { model: models.uploaded_files, as: "image" }, { model: models.product_mark, through: { attributes: [] } }]
            });
            if (result && result.length) {
                result = result.map(function(item) {
                    return item.toJSON();
                });
                result = ids.map(x => { return result.find(y => { return y.id === x }) });

                for (let prod of result) {
                    if (user && user.id) {
                        prod.product_variations = prod.product_variations[0];
                        if (await models.product_favorites.findOne({ where: { user_id: user.id, product_id: prod.id, type: 'product' } })) {
                            prod.is_favorite = true;
                        }
                    }
                    if (!prod.slug) prod.slug = prod.id;
                    if (currencyType == 0) {
                        prod.price = (prod.price * currencyValue).toFixed(2);
                        if (prod.old_price) prod.old_price = (prod.old_price * currencyValue).toFixed(2);
                    }
                }
            }
            return result;
        },
        getAllProductsByFav: async(filter,lang) => {
            try {
                let order = [
                    ["position", "DESC"]
                ];
                let result = await models.product.findAndCountAll({
                    order: order,
                    where: {
                        [Op.or]: [{ id: filter, lang: lang, status: config.GLOBAL_STATUSES.ACTIVE },
                         { origin_id: filter, lang: lang, status: config.GLOBAL_STATUSES.ACTIVE }]
                    },
                    distinct: true,
                    include: [
                        { model: models.uploaded_files, as: "image" },
                        {
                            model: models.mark,
                            as: "product_marks",
                            through: { attributes: [] },
                            include: [{
                                model: models.uploaded_files,
                                as: "mark_image",
                            }, ],
                        }
                    ],
                });
                if (result && result.rows && result.rows.length) {

                    let productsSlug = [];
                    result.rows = result.rows.map(el => {
                        el = el.toJSON();
                        productsSlug.push(`/shop/getProduct/${el.id}`);
                        return el;
                    });
                    productsSlug = await models.links.findAll({
                        where: { original_link: productsSlug },
                        raw: true
                    })

                    for (let item of result.rows) {
                        let prodSlug = productsSlug.find(el => el.original_link == `/shop/getProduct/${item.id}`);
                        if(prodSlug && prodSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${prodSlug.slug}` : `${lang}/${prodSlug.slug}`;
                    }
                }
                return result;
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },
        getProductByFav: async(id) => {
            try {
                let result = await models.product.findOne({
                    where: { id: id },

                })
                result = result.toJSON()
                if (result.origin_id === 0) {
                    return result.id
                } else {
                    return result.origin_id
                }
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },

        getProductsMinMaxByPromotions: async(filter) => {
            log.info(`Start getProductsMinMaxByPromotions data:${JSON.stringify(filter)}`)
            try {
                let result = await models.product.findAll({
                    order: [
                        ['price', 'ASC']
                    ],
                    where: filter,
                    distinct: true,
                    // include: [{
                    //     model: models.product_category,
                    //     as: 'category',
                    //     required: true,
                    //     through: { attributes: [], where: filterByCategory }

                    // }, ]
                });


                if (result && result.length) {
                    result = result.map(i => i.toJSON());
                    let min_s = result.sort((a,b) => a.min_s - b.min_s)[0].min_s
                    let max_s = result.sort((a,b) => b.max_s - a.max_s)[0].max_s
                    let min_h = result.sort((a,b) => a.min_h - b.min_h)[0].min_h
                    let max_h = result.sort((a,b) => b.max_h - a.max_h)[0].max_h

                    log.info(`End getProductsMinMaxByPromotions data:${JSON.stringify(min_s,max_s,min_h,max_h)}`)
                    return [min_s,max_s,min_h,max_h]
                } else return null



               

            } catch (err) {
                log.error(err)
                err.code = 400;
                throw err;
            }
        },
        getProductsMinMaxByCategory: async(filter, filterByCategory, filterByAttrGroup) => {
            log.info(`Start getProductsMinMaxByCategory data:${JSON.stringify(filter, filterByCategory,filterByAttrGroup)}`)
            try {
                let result = await models.product.findAll({
                    order: [
                        ['price', 'ASC']
                    ],
                    where: filter,
                    distinct: true,
                    include: [
                        {
                            model: models.attribute,
                            as: 'product_attribute',
                            required: true,
                            where: filterByAttrGroup,
                            order: [
                                ['position', 'ASC']
                            ],
                            attributes: ['id', 'title', 'value', 'status', 'type', 'group_atr', 'unit_of_measurement', 'position'],
                            through: { attributes: ['value'], as: 'activeValue', required: true },
                            include: [{
                                model: models.attribute_groups,
                                //as: "attribute_range"
                            }]

                        },
                        {
                            model: models.product_category,
                            as: 'category',
                            required: true,
                            through: { attributes: ['product_category_id'], where: filterByCategory }
                        },
                    ]
                });


                if (result && result.length) {
                    result = result.map(i => i.toJSON());
                    let min_s = result.sort((a,b) => a.min_s - b.min_s)[0].min_s
                    let max_s = result.sort((a,b) => b.max_s - a.max_s)[0].max_s
                    let min_h = result.sort((a,b) => a.min_h - b.min_h)[0].min_h
                    let max_h = result.sort((a,b) => b.max_h - a.max_h)[0].max_h
                    log.info(`End getProductsMinMaxByCategory data:${JSON.stringify(min_s,max_s,min_h,max_h)}`)
                    return [min_s,max_s,min_h,max_h]
                } else return null
            } catch (err) {
                log.error(err)
                err.code = 400;
                throw err;
            }
        },
        getProductDetailById: async(product_id, lang) => {
            log.info(`Start getProductDetailById data:${JSON.stringify(product_id, lang)}`)
            try {
                let result = await models.product.findOne({
                    where: {
                        id: product_id,
                        lang: lang
                    },
                    distinct: true,
                    include: [{
                            model: models.product_category,
                            as: 'category',
                            attributes: ['id', 'title', 'parent_id', 'attribute_groups'],
                            through: { attributes: [] },
                            include: [{
                                model: models.attribute,
                                as: 'attributes',
                                attributes: ['id', 'title'],
                                through: { attributes: [] }
                            }]
                        },
                        { model: models.uploaded_files, as: "image" },
                        {
                            model: models.attribute,
                            as: 'product_attribute',
                            attributes: ['id', 'title', 'value', 'status', 'type'],
                            through: { attributes: ['value'], as: 'activeValue' }

                        },
                        {
                            model: models.mark,
                            as: 'product_marks',
                            attributes: ['id', 'title', 'color'],
                            include: [{ model: models.uploaded_files, as: "mark_image" }]
                        },
                        {
                            model: models.uploaded_files,
                            as: 'gallery',
                        },
                    ]
                });

                result = result.toJSON()



                if (result.origin_id == 0) {
                    result.product_testimonials = []
                    let testimonials = await models.product_testimonials.findAll({
                        where: {
                            origin_product_id: result.id
                        }
                    })
                    testimonials = testimonials.map(i => i.toJSON())
                    result.product_testimonials.push(testimonials)
                    result.product_testimonials = result.product_testimonials.flat()
                } else {
                    result.product_testimonials = []
                    let testimonials = await models.product_testimonials.findAll({
                        where: {
                            origin_product_id: result.origin_id
                        }
                    })
                    testimonials = testimonials.map(i => i.toJSON())
                    result.product_testimonials.push(testimonials)
                    result.product_testimonials = result.product_testimonials.flat()
                }


                log.info(`End getProductDetailById data:${JSON.stringify(result)}`)
                return result

            } catch (err) {
                log.error(err)
                err.code = 400;
                throw err;
            }
        },
        filterProducts: async(filterByAttribute, body, options, filterByCategory) => {
            log.info(`Start filterProducts data:${JSON.stringify(filterByAttribute, body)}`)
            let filterArr = [];
            if (body.lang) filterArr.push({ lang: body.lang });
            if (body.min_s || body.max_s) {
                filterArr.push({

                    [Op.and] : [
                        {
                            min_s : {
                                [Op.lte]: +body.min_s
                            }
                        },
                        {
                            max_s : {
                                [Op.gte]: +body.max_s
                            }
                        },
                    ]


                    // [Op.and] : [
                    //     {
                    //         min_s : {
                    //             [Op.between]: [sequelize.col('product.min_s'),+body.min_s] 
                    //         }
                    //     },
                    //     {
                    //         max_s : {
                    //             [Op.between]: [+body.max_s,sequelize.col('product.max_s')] 
                    //         }
                    //     },
                    // ]



                    // [Op.and] : [
                    //     {
                    //         min_s : {
                    //             [Op.lte]: +body.min_s
                    //         }
                    //     },
                    //     {
                    //         max_s : {
                    //             [Op.gte]: +body.max_s
                    //         }
                    //     },
                    // ]

                })
            }

            if (body.min_h || body.max_h) {
                filterArr.push({
                    // [Op.and] : [
                    //     {
                    //         min_h : {
                    //             [Op.between]: [+body.min_h,+body.max_h] 
                    //         }
                    //     },
                    //     {
                    //         max_h : {
                    //             [Op.between]: [+body.min_h,+body.max_h] 
                    //         }
                    //     },
                    // ]

                    [Op.and] : [
                        {
                            min_h : {
                                [Op.lte]: +body.min_h
                            }
                        },
                        {
                            max_h : {
                                [Op.gte]: +body.max_h
                            }
                        },
                    ]

                    // [Op.and] : [
                    //     {
                    //         min_h : {
                    //             [Op.lte]: +body.min_h
                    //         }
                    //     },
                    //     {
                    //         max_h : {
                    //             [Op.gte]: +body.max_h
                    //         }
                    //     },
                    // ]
                })
            }


            if (body.checkedBrands) filterArr.push({
                brand_id: {
                    [Op.in]: body.checkedBrands
                }
            });
            if (body.search) filterArr.push({
                [Op.or]: [{
                    name: {
                        [Op.like]: `%${body.search}%`
                    }
                },{
                    sku: {
                        [Op.like]: `%${body.search}%`
                    }
                }]
            });

            filterArr.push({
                status: config.GLOBAL_STATUSES.ACTIVE
            })


            // if (filterByAttribute) {
            let arr = []
            let notUniqIds
            if(filterByAttribute){
                if (filterByAttribute.filterKeys.length > 0) {
                    for (let i = 0; i < filterByAttribute.filterKeys.length; i++) {
                        let innerArr = []
    
    
                        let productsByAttribute = await models.product_to_attribute.findAll({
                            where: filterByAttribute.filterKeys[i]
                        })
    
                        productsByAttribute = productsByAttribute.map((item) => item.toJSON())
                        productsByAttribute.forEach((item) => innerArr.push(item.product_id))
                        arr.push(innerArr)
                    }
                }
            }
            
            if (options) {
                let filter
                if (arr && arr.length) {
                    let arr2 = arr.flat()
                    filter = {
                        id: {
                            [Op.in]: arr2
                        }
                    }
                } else filter = null
                    //for (let i = 0; i < options.length; i++) {
                let innerArr = []
                let result = await models.product.findAll({
                    distinct: true,
                    where: filter,
                    include: [
                        // { model: models.uploaded_files, as: "image" },
                        {
                            model: models.attribute,
                            as: 'product_attribute',
                            required: true,
                            where: {
                                group_atr: {
                                    [Op.in]: options
                                }
                            },
                            attributes: ['id', 'title', 'value', 'status', 'type', 'group_atr', 'unit_of_measurement', 'position'],
                            //through: { attributes: ['value'], as: 'activeValue'},
                            // include: [{
                            //     model: models.attribute_groups,
                            //     //as: "attribute_range"
                            // }]

                        },
                        {
                            model: models.product_category,
                            as: 'category',
                            required: true,
                            through: { attributes: ['product_category_id'], where: filterByCategory }
                        },
                    ]
                });
                result = result.map(item => item.toJSON())
                result.forEach((item) => innerArr.push(item.id))
                arr.push(innerArr)
                    //}
            }

            if (arr && arr.length) {
                notUniqIds = arr.reduce((p, c) => p.filter(e => c.includes(e)));

                notUniqIds = notUniqIds.flat()
                filterArr.push({
                    id: {
                        [Op.in]: notUniqIds
                    }

                })
            }


            // }

            // if(options && !(filterByAttribute && filterByAttribute.filterKeys && filterByAttribute.filterKeys.length)){
            // let arr = []
            // let notUniqIds
            // for(let i = 0; i<options.length;i++){
            //     let innerArr = []
            //     let result = await models.product.findAll({
            //         distinct: true,
            //     filter id
            //         include: [
            //             { model: models.uploaded_files, as: "image" },
            //             {
            //                 model: models.attribute,
            //                 as: 'product_attribute',
            //                 required: true,
            //                 where: {
            //                     group_atr: options[i]
            //                 },
            //                 attributes: ['id', 'title', 'value', 'status', 'type', 'group_atr', 'unit_of_measurement', 'position'],
            //                 through: { attributes: ['value'], as: 'activeValue', required: true },
            //                 include: [{
            //                     model: models.attribute_groups,
            //                     //as: "attribute_range"
            //                 }]

            //             },
            //             {
            //                 model: models.product_category,
            //                 as: 'category',
            //                 required: true,
            //                 through: { attributes: ['product_category_id'], where: filterByCategory }
            //             },
            //         ]
            //     });
            //     result = result.map(item => item.toJSON())
            //     result.forEach((item) => innerArr.push(item.id))
            //     arr.push(innerArr)
            // }


            // notUniqIds = arr.reduce((p, c) => p.filter(e => c.includes(e)));

            //     notUniqIds = notUniqIds.flat()
            //     filterArr.push({
            //         id: {
            //             [Op.in]: notUniqIds
            //         }

            //     })
            // }
            // if(options && filterByAttribute){
            //     let arr = []
            //     let notUniqIds
            //     for(let i = 0; i<options.length;i++){
            //         let innerArr = []
            //         let result = await models.product.findAll({
            //             distinct: true,
            //             include: [
            //                 { model: models.uploaded_files, as: "image" },
            //                 {
            //                     model: models.attribute,
            //                     as: 'product_attribute',
            //                     required: true,
            //                     where: {
            //                         group_atr: options[i]
            //                     },
            //                     attributes: ['id', 'title', 'value', 'status', 'type', 'group_atr', 'unit_of_measurement', 'position'],
            //                     through: { attributes: ['value'], as: 'activeValue', required: true },
            //                     include: [{
            //                         model: models.attribute_groups,
            //                         as: "attribute_range"
            //                     }]

            //                 },
            //                 {
            //                     model: models.mark,
            //                     as: 'product_marks',
            //                     attributes: ['id', 'title', 'color'],
            //                     include: [{ model: models.uploaded_files, as: "mark_image" }]
            //                 },
            //                 {
            //                     model: models.product_category,
            //                     as: 'category',
            //                     required: true,
            //                     through: { attributes: ['product_category_id'], where: filterByCategory }
            //                 },
            //             ]
            //         });
            //         result = result.map(item => item.toJSON())
            //         result.forEach((item) => innerArr.push(item.id))
            //         arr.push(innerArr)
            //     }


            //     notUniqIds = arr.reduce((p, c) => p.filter(e => c.includes(e)));

            //         notUniqIds = notUniqIds.flat()
            //         filterArr.push({
            //             id: {
            //                 [Op.in]: notUniqIds
            //             }

            //         })
            // }

            let filter = {
                where: {
                    [Op.and]: [...filterArr]
                }
            };
            log.info(`End filterProducts data:${JSON.stringify(filter)}`)
            return filter
        },
        filterByAttrGroup: async(body, whereObj) => {
            log.info(`Start filterByAttrGroup data:${JSON.stringify(body)}`)
            let filterArr = [];
            if (body.options) filterArr.push({
                group_atr: {
                    [Op.in]: body.options
                }
            });

            let filter = {
                where: {
                    [Op.and]: [...filterArr]
                }
            };
            log.info(`End filterByAttrGroup data:${JSON.stringify(filter)}`)
            return filter
        },
        getProductsByPromotions: async(filter, perPage, page, order,lang) => {
            log.info(`Start getProductsByPromotions data:${JSON.stringify(filter, perPage, page, order)}`)

            switch (order) {
                case '1':
                    order = [
                        ["popular", "DESC"]
                    ]
                    break;
                case '4':
                    order = [
                        ["updated_at", "DESC"]
                    ]
                    break;
                case '5':
                    order = [
                        ["name", "ASC"]
                    ]
                    break;
                case '6':
                    order = [
                        ["name", "DESC"]
                    ]
                    break;
                default:
                    order = [
                        ["position", "ASC"],
                        ["availability", 'DESC']
                    ]
                    break
            }

            try {
                const offset = perPage * (page - 1);
                const limit = perPage;
                let result = await models.product.findAndCountAll({
                    where: filter,
                    offset: offset,
                    limit: limit,
                    order: order,
                    distinct: true,
                    include: [
                        { model: models.uploaded_files, as: "image" },
                        {
                            model: models.product_variations
                        },
                        {
                            model: models.mark,
                            as: 'product_marks',
                            attributes: ['id', 'title', 'color'],
                            include: [{ model: models.uploaded_files, as: "mark_image" }]
                        },
                       
                    ]
                });


                if (result && result.rows && result.rows.length) {

                    let productsSlug = [];
                    result.rows = result.rows.map(el => {
                        el = el.toJSON();
                        productsSlug.push(`/shop/getProduct/${el.id}`);
                        return el;
                    });
                    productsSlug = await models.links.findAll({
                        where: { original_link: productsSlug },
                        raw: true
                    })

                    for (let item of result.rows) {
                        let prodSlug = productsSlug.find(el => el.original_link == `/shop/getProduct/${item.id}`);
                        if(prodSlug && prodSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${prodSlug.slug}` : `${lang}/${prodSlug.slug}`;
                    }
                }

                log.info(`End getProductsByPromotions data:${JSON.stringify(result)}`)
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
        filterPromotionsProducts: async(body) => {
            log.info(`Start filterPromotionsProducts data:${JSON.stringify(body)}`)
            let ids = []
            if (body.checkedCategories) {
                if (body.checkedCategories != "all") {
                    for(let category of body.checkedCategories){
                        let findProductsByCategory = await models.product.findAll({
                            where: { discounted_price: {[Op.ne]: null},lang:body.lang,status:config.GLOBAL_STATUSES.ACTIVE},
                            include:[
                                {
                                    model: models.product_category,
                                    where: {status:config.GLOBAL_STATUSES.ACTIVE},
                                    as: 'category',
                                    required: true,
                                    through: { attributes: [], where: {product_category_id:category }}
                                }
                            ]
                            
                        })
                        if(findProductsByCategory && findProductsByCategory.length){
                            findProductsByCategory = findProductsByCategory.map(item => item.toJSON())
        
                            findProductsByCategory.forEach(item => ids.push(item.id))
                        } 
                    }
                }
            }

            
            





            let filterArr = [];
            if (body.lang) filterArr.push({ lang: body.lang });
            if (body.min_s || body.max_s) {
                filterArr.push({
                    [Op.or] : [
                        {
                            min_s : {
                                [Op.between]: [+body.min_s,+body.max_s] 
                            }
                        },
                        {
                            max_s : {
                                [Op.between]: [+body.min_s,+body.max_s] 
                            }
                        },
                    ]
                })
            }

            if (body.min_h || body.max_h) {
                filterArr.push({
                    [Op.or] : [
                        {
                            min_h : {
                                [Op.between]: [+body.min_h,+body.max_h] 
                            }
                        },
                        {
                            max_h : {
                                [Op.between]: [+body.min_h,+body.max_h] 
                            }
                        },
                    ]
                })
            }

            filterArr.push({
                discounted_price: {
                    [Op.ne]: null
                }
            });

            filterArr.push({
                status: config.GLOBAL_STATUSES.ACTIVE
            })

            if(ids && ids.length){
                filterArr.push({
                    id: {[Op.in]: ids}
                })
            }
           








            let filter = {
                where: {
                    [Op.and]: [...filterArr]
                }
            };
            log.info(`End filterPromotionsProducts data:${JSON.stringify(filter)}`)
            return filter
        },
        filterPromotionsProductsByCategory: async(body) => {
            log.info(`Start filterPromotionsProductsByCategory data:${JSON.stringify(body)}`)
            let filterArr = [];
            if (body.checkedCategories) {
                if (body.checkedCategories != "all") {
                    filterArr.push({
                        product_category_id: {
                            [Op.in]: body.checkedCategories
                        }
                    });
                }
            }

            let filter = {
                where: {
                    [Op.and]: [...filterArr]
                }
            };
            log.info(`End filterPromotionsProductsByCategory data:${JSON.stringify(filter)}`)
            return filter
        },
        filterProductsByCategory: async(body, whereObj) => {
            log.info(`Start filterProductsByCategory data:${JSON.stringify(body)}`)
            let filterArr = [];

            if (body.lang) filterArr.push({ lang: body.lang });
            if (body.checkedCategories) {
                if (body.checkedCategories != "all") {
                    filterArr.push({
                        id: {
                            [Op.in]: body.checkedCategories
                        }
                    });
                }
            }
            if (body.currentCategory) {
                if (body.currentCategory != "all") {
                    filterArr.push({
                        id: body.currentCategory
                    });
                }
            }

            let filter = {
                where: {
                    [Op.and]: [whereObj, ...filterArr]
                }
            };
            log.info(`End filterProductsByCategory data:${JSON.stringify(filter)}`)
            return filter
        },
        filterCategories: async(body, whereObj) => {
            log.info(`Start filterCategories data:${JSON.stringify(body)}`)
            let filterArr = [];
            if (body.category_id) filterArr.push({ product_category_id: parseInt(body.category_id) });
            /// if (body.lang) filterArr.push({ lang: body.lang });

            let filter = {
                where: {
                    [Op.and]: [...filterArr]
                }
            };
            log.info(`End filterCategories data:${JSON.stringify(filter)}`)
            return filter
        },
        filterByAttributes: async(body, whereObj) => {
            log.info(`Start filterByAttributes data:${JSON.stringify(body)}`)
            let filterArr = [];

            let arr = [{ attr_id: '3', val: '64' }, { attr_id: '3', val: '128' }, { attr_id: '3', val: '256' }, { attr_id: '4', val: '12' },
                { attr_id: '6', val: 'Білий' }
            ]

            if (body.attributes && body.attributes.length) {

                let idsArr = body.attributes.map(item => Number(item.attr_id)).filter((value, index, self) => self.indexOf(value) === index);
                let attributesObj = []
                for (let obj of idsArr) {
                    let values = body.attributes
                        .filter((el) => el.attr_id == obj)
                        .map((i) => i.val);

                    attributesObj.push({ attribute_id: obj, values })
                }

                if (attributesObj && attributesObj.length) {
                    for (let attributes of attributesObj) {
                        filterArr.push({

                            value: {
                                [Op.in]: attributes.values,
                            },
                            attribute_id: attributes.attribute_id

                        });
                    }
                }
            }

            // if (body.attributesRange) {
            //     body.attributesRange.forEach((item) => {
            //         filterArr.push({
            //                 value: {
            //                     [Op.between]: [+item.range.rangeStart, +item.range.rangeEnd]
            //                 },
            //             }, { attribute_id: item.attr_id }

            //         );
            //     })
            // }

            let filter = {
                "filterKeys": [...filterArr]
            };
            log.info(`End filterByAttributes data:${JSON.stringify(filter)}`)
            return filter
        },
        getAllProductsCategories: async(filter, filterByCategory, filterByAttribute) => {
            log.info(`Start getAllProductsCategories data:${JSON.stringify(filter, filterByCategory, filterByAttribute)}`)
            let result = await models.product.findAll({
                where: filter.where,
                distinct: true,
                include: [
                    { model: models.uploaded_files, as: "image" },
                    {
                        model: models.attribute,
                        as: 'product_attribute',
                        required: true,
                        distinct: true,
                        attributes: ['id', 'title', 'value', 'status', 'type'],
                        through: { attributes: ['value'], as: 'activeValue', required: true, where: filterByAttribute.where }
                    },
                    {
                        model: models.mark,
                        as: 'product_marks',
                        attributes: ['id', 'title', 'color'],
                        include: [{ model: models.uploaded_files, as: "mark_image" }]
                    },
                    {
                        model: models.product_category,
                        as: 'category',
                        where: filterByCategory.where,
                        required: true,
                        through: { attributes: [] }
                    },
                ]
            });
            result = result.map((item) => item.toJSON())
            log.info(`End getAllProductsCategories data:${JSON.stringify(result)}`)
            return result
        },
        getAllPromotionsProductsCategories: async(filter, filterByCategory) => {
            log.info(`Start getAllPromotionsProductsCategories data:${JSON.stringify(filter, filterByCategory)}`)
            let result = await models.product.findAll({
                where: filter,
                distinct: true,
                include: [
                    { model: models.uploaded_files, as: "image" },
                    {
                        model: models.mark,
                        as: 'product_marks',
                        attributes: ['id', 'title', 'color'],
                        include: [{ model: models.uploaded_files, as: "mark_image" }]
                    },
                    {
                        model: models.product_category,
                        as: 'category',
                        required: true,
                        through: { attributes: [], where: filterByCategory }
                    },
                ]
            });
            result = result.map((item) => item.toJSON())
            log.info(`End getAllPromotionsProductsCategories data:${JSON.stringify(result)}`)
            return result
        },

        getProductsByCategorySearch: async(filter, perPage, page, order, filterByCategory, filterByAttribute,lang) => {
            log.info(`Start getProductsByCategorySearch data:${JSON.stringify(filter, perPage, page, order, filterByCategory, filterByAttribute)}`)
            try {
                const offset = perPage * (page - 1);
                const limit = perPage;
                let result = await models.product.findAndCountAll({
                    where: filter.where,
                    offset: offset,
                    limit: limit,
                    order: order,
                    distinct: true,
                    include: [
                        { model: models.uploaded_files, as: "image" },
                        { model: models.uploaded_files, as: "hover_image" },
                        {
                            model: models.product_variations
                        },
                        {
                            model: models.mark,
                            as: 'product_marks',
                            attributes: ['id', 'title', 'color'],
                            include: [{ model: models.uploaded_files, as: "mark_image" }]
                        }
                    ]
                });

                if (result && result.rows && result.rows.length) {

                    let productsSlug = [];
                    result.rows = result.rows.map(el => {
                        el = el.toJSON();
                        productsSlug.push(`/shop/getProduct/${el.id}`);
                        return el;
                    });
                    productsSlug = await models.links.findAll({
                        where: { original_link: productsSlug },
                        raw: true
                    })

                    for (let item of result.rows) {
                        let prodSlug = productsSlug.find(el => el.original_link == `/shop/getProduct/${item.id}`);
                        if(prodSlug && prodSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${prodSlug.slug}` : `${lang}/${prodSlug.slug}`;
                    }
                }
               
                log.info(`End getProductsByCategorySearch data:${JSON.stringify(result)}`)
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

        getProductsByCategory: async(filter, perPage, page, order, filterByCategory, filterByAttrGroup,lang) => {
            log.info(`Start getProductsByCategory data:${JSON.stringify(filter, perPage, page, order, filterByCategory)}`)
            switch (order) {
                case '1':
                    order = [
                        ["popular", "DESC"],
                    ]
                    break;
                case '4':
                    order = [
                        ["updated_at", "DESC"],
                    ]
                    break;
                case '5':
                    order = [
                        ["name", "ASC"],
                    ]
                    break;
                case '6':
                    order = [
                        ["name", "DESC"],
                    ]
                    break;
                default:
                    order = [
                        ["position", "ASC"],
                        ['availability', 'DESC']
                    ]
                    break
            }
            try {
                const offset = perPage * (page - 1);
                const limit = perPage;
                let result = await models.product.findAndCountAll({
                    where: filter,
                    offset: offset,
                    limit: limit,
                    order: order,
                    distinct: true,
                    include: [
                        { model: models.uploaded_files, as: "image" },
                        { model: models.uploaded_files, as: "hover_image" },
                        {
                            model: models.mark,
                            as: 'product_marks',
                            attributes: ['id', 'title', 'color'],
                        },
                        {
                            model: models.product_category,
                            as: 'category',
                            required: true,
                            through: { attributes: ['product_category_id'], where: filterByCategory }
                        },
                        {
                            model: models.product_variations
                        }
                    ]
                });
                if (result && result.rows && result.rows.length) {
                    let productsSlug = [];
                    result.rows = result.rows.map(el => {
                        el = el.toJSON();
                        productsSlug.push(`/shop/getProduct/${el.id}`);
                        return el;
                    });
                    
                    productsSlug = await models.links.findAll({
                        where: { original_link: productsSlug },
                        raw: true
                    })

                    for (let item of result.rows) {
                        let prodSlug = productsSlug.find(el => el.original_link == `/shop/getProduct/${item.id}`);
                        if(prodSlug && prodSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${prodSlug.slug}` : `${lang}/${prodSlug.slug}`;
                    }
                }
                log.info(`End getProductsByCategory data:${JSON.stringify(result)}`)
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




        getAllProductsByViews: async(filter) => {
            log.info(`Start getAllProductsByViews data:${JSON.stringify(filter)}`)
            try {


                let order = [
                    ['position', 'DESC']
                ]
                let result = await models.product.findAndCountAll({
                    order: order,
                    where: filter,
                    distinct: true,
                    include: [
                        { model: models.uploaded_files, as: "image" },


                    ],

                })
                if (result && result.rows && result.rows.length) {
                    result.rows = result.rows.map(i => i.toJSON());
                }
                log.info(`End getAllProductsByViews data:${JSON.stringify(result)}`)
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

        getProductByFilter: async(filter) => {
            log.info(`Start getProductByFilter data:${JSON.stringify(filter)}`)
            try {
                let result = await models.product.findOne({
                        where: filter,
                        include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }, ]
                    },

                )
                log.info(`End getProductByFilter data:${JSON.stringify(result)}`)
                return result
            } catch (err) {
                log.error(err)
                err.code = 400;
                throw err;
            }
        },

        getAllProductsAttributes: async(filter, filterByCategory, filterByAttrGroup) => {
            log.info(`Start  getAllProductsAttributes data:${JSON.stringify(filter,  filterByCategory)}`)

            let result = await models.product.findAll({
                order: [
                    ['price', 'ASC']
                ],
                where: filter,
                // separate: true,
                distinct: true,
                include: [
                    {
                        model: models.attribute,
                        //separate: true,
                        as: 'product_attribute',
                        //required: true,
                        //where: filterByAttrGroup,
                        // order: [
                        //     ['position', 'ASC']
                        // ],
                        attributes: ['id', 'title', 'value', 'status', 'type', 'group_atr', 'unit_of_measurement', 'position'],
                        through: { attributes: ['value'], as: 'activeValue' },
                        include: [{
                            model: models.attribute_groups,
                            //as: "attribute_range"
                        }]

                    },
                    {
                        model: models.product_category,
                        as: 'category',
                        required: true,
                        through: { attributes: ['product_category_id'], where: filterByCategory }
                    }
                ]
            });
            //let ids = []
            let minMaxArr = []
            if (result && result.length) {
                result = result.map(i => i.toJSON());

                    let min_s = result.sort((a,b) => a.min_s - b.min_s)[0].min_s
                    let max_s = result.sort((a,b) => b.max_s - a.max_s)[0].max_s
                    let min_h = result.sort((a,b) => a.min_h - b.min_h)[0].min_h
                    let max_h = result.sort((a,b) => b.max_h - a.max_h)[0].max_h
                   
                    minMaxArr = [min_s,max_s,min_h,max_h]



                //result.forEach((item) => ids.push(item.id))
            }
            // let result2 = await models.product.findAll({
            //     where: {
            //         id: {
            //             [Op.in]: ids
            //         }
            //     },
            //     required: true,
            //     include: [{
            //         model: models.attribute,
            //         as: 'product_attribute',
            //         required: true,
            //         //where: filterByAttrGroup,
            //         attributes: ['id', 'title', 'value', 'status', 'type', 'unit_of_measurement'],
            //         through: { attributes: ['value'], as: 'activeValue' },
            //         include: [{
            //             model: models.attribute_groups,
            //             //as: "attribute_range"
            //         }]

            //     }]
            // });

            // if (result2 && result2.length) {
            //     result2 = result2.map(i => i.toJSON());
            // }
            log.info(`End getAllProductsAttributes data:${JSON.stringify(result,minMaxArr)}`)
            return [result,minMaxArr]
            //return result2
        },
        getAttrValue: async(attr_ids) => {
            try {
                log.info(`Start function getAttrValue Params: ${JSON.stringify(attr_ids)}`);
                let result = await models.attribute_values.findAll({
                    where: {
                        id: attr_ids
                    }

                });
                result = result.map(item => item.toJSON())
                log.info(`End functiongetAttrValue Result: ${JSON.stringify(result)}`);
                return result;
            } catch (err) {
                log.error(`${err}`);
                err.code = 400;
                throw err;
            }
        },

        getPopularProductByCategoryIds: async(id, categoryIds, limit) => {
            try {
                let result = await models.product.findAll({
                    where: {
                        status: config.GLOBAL_STATUSES.ACTIVE,
                        id: {
                            [Op.ne]: id
                        }
                    },
                    order: [
                        ['popular', 'DESC']
                    ],
                    limit: limit,
                    include: [{
                            model: models.product_category,
                            as: 'category',
                            attributes: ['id', 'title', 'parent_id'],
                            through: { attributes: [] },
                            where: {
                                id: {
                                    [Op.in]: categoryIds
                                }
                            },
                            include: [{
                                model: models.attribute,
                                as: 'attributes',
                                attributes: ['id', 'title'],
                                through: { attributes: [] }
                            }]
                        },
                        {
                            model: models.mark,
                            as: 'product_marks',
                            through: { attributes: [] },
                            include: [{
                                model: models.uploaded_files,
                                as: 'image'
                            }]
                        },
                        {
                            model: models.attribute,
                            as: 'product_attribute',
                            attributes: ['id', 'title'],
                            through: { attributes: ['value'], as: 'activeValue' }
                        },
                        {
                            model: models.uploaded_files,
                            as: "image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "hover_image"
                        },

                    ],
                })
                return result
            } catch (err) {
                err.code = 400;
                throw err;
            }
        },


        getViewedProductByIds: async(id, viewedProducts, lang) => {
                log.info(`Start  getViewedProductByIds Params: ${JSON.stringify({id:id, viewedProducts:viewedProducts})}`)
                try {

                    let result = await models.product.findAll({
                        where: {
                            [Op.or]: [
                                { id: viewedProducts, lang: lang,status:config.GLOBAL_STATUSES.ACTIVE },
                                { origin_id: viewedProducts, lang: lang,status:config.GLOBAL_STATUSES.ACTIVE },
                            ],
                            
                            // id: {
                            //     [Op.and]: [{
                            //             [Op.ne]: id
                            //         },
                            //         {
                            //             [Op.in]: viewedProducts
                            //         },
                            //     ]
                            // }
                        },
                        include: [{
                                model: models.mark,
                                as: 'product_marks',
                                through: { attributes: [] },
                                include: [{
                                    model: models.uploaded_files,
                                    as: 'mark_image'
                                }]
                            },
                            {
                                model: models.product_variations
                            },
                            {
                                model: models.uploaded_files,
                                as: "image"
                            },
                            {
                                model: models.uploaded_files,
                                as: "hover_image"
                            },
                        ],
                    })

                    let productHistoryRes = [];
                    if (result && result.length) {
                        let productSlug = [];
                        result = result.map(el => {
                                    productSlug.push(`/shop/getProduct/${el.id}`); 
                    el = el.toJSON();
                    return el;
                });
                productSlug = await models.links.findAll({
                    where: { original_link: productSlug },
                    raw: true
                }) 
                for (let viewed_product of result) {
                    if(viewed_product.price) viewed_product.price = viewed_product.price/100;
                    if(viewed_product.discounted_price) viewed_product.discounted_price = viewed_product.discounted_price/100;
                    let  prodSlug  =  productSlug.find(el =>  el.original_link == `/shop/getProduct/${viewed_product.id}`);
                    viewed_product.slug = prodSlug && prodSlug.slug ? prodSlug.slug : '';
                }
                //Sort in the same order as in cookie array
                for (const el of viewedProducts) {
                    for(let item of result){
                        if(item.id == el || item.origin_id == el){
                            if(item.id != id && item.origin_id!=id){
                                productHistoryRes.push(item)
                            }
                        }
                    }
                    // let prod = result.find(e => e.id == el && e.id != id);
                    // let prod2 = result.find(e => e.origin_id == el && e._origin_id != id);
                    // if (prod) productHistoryRes.push(prod)
                }
            }

            log.info(`End  getViewedProductByIds Result: ${JSON.stringify(productHistoryRes)}`)
            return productHistoryRes;

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    rewriteComparisonFromCookies: async(userId, comparisonProducts, trans) => {

        let transaction = null;
        try {
            log.info(`Start  rewriteComparisonFromCookies Params: ${JSON.stringify({userId:userId, comparisonProducts:comparisonProducts})}`)
            transaction = trans ? trans : await sequelize.transaction();
            if (comparisonProducts && comparisonProducts.length) {
                await models.product_comparisons.destroy({ where: { user_id: userId }, transaction });
                for (let item of comparisonProducts) {
                    await models.product_comparisons.create({
                        product_id: item.product_id,
                        category_id: item.category_id,
                        user_id: userId
                    }, {
                        transaction
                    });
                }
            }
            if (!trans) await transaction.commit();
            log.info(`End  rewriteComparisonFromCookies  Result: ${JSON.stringify(true)}`)
            return true
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;

        }

    },
    rewriteFavoritesFromCookies: async(userId, favoriteProducts, trans) => {
        log.info(`Start  rewriteFavoritesFromCookies Params: ${JSON.stringify({userId:userId, favoriteProducts:favoriteProducts})}`)
        let transaction = null;
        try {

            transaction = trans ? trans : await sequelize.transaction();
            if (favoriteProducts && favoriteProducts.length) {
                await models.product_favorites.destroy({ where: { user_id: userId }, transaction });
                for (let item of favoriteProducts) {
                    await models.product_favorites.create({
                        product_id: item,
                        user_id: userId
                    }, {
                        transaction
                    });
                }
            }
            if (!trans) await transaction.commit();
            log.info(`End  rewriteFavoritesFromCookies  Result: ${JSON.stringify(true)}`)
            return true
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;

        }

    },

    changePosition: async(id, position, is_last, trans) => {
        log.info(`Start product service changePosition`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            if (is_last) position++;
            await models.product.increment({ position: 1 }, { where: { position: {
                        [Op.gte]: position } }, transaction });
            await models.product.update({ position: position }, { where: {
                    [Op.or]: [{ id: id }, { origin_id: id }] }, transaction });

            if (!trans) await transaction.commit();
            log.info(`End product service changePosition`)
            return true
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },


    getProductVariation: async(filter,trans) => {
        try {
            log.info(`Start function getProductVariation Params: ${JSON.stringify(filter)}`);
            let result = await models.product_variations.findOne({
                where: filter
            });
            if(result) result = result.toJSON()
            log.info(`End function getProductVariation Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    getAllProductsByFilter: async (whereObj) => {
        try {
            log.info(`Start function getAllProductsByFilter Params: ${JSON.stringify(whereObj)}`);
            let result = await models.product.findAll({
                where: whereObj
            });
            log.info(`End function getAllProductsByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getAllCategoriesByFilter: async (whereObj) => {
        try {
            log.info(`Start function getAllCategoriesByFilter Params: ${JSON.stringify(whereObj)}`);
            let result = await models.product_category.findAll({
                where: whereObj
            });
            log.info(`End function getAllCategoriesByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getGroupAtrByFilter: async (filter) => {
        try {
            log.info(`Start function getGroupAtrByFilter Params: ${JSON.stringify(filter)}`);
            let result = await models.attribute_groups.findOne({
                where: filter
            });
            if(result) result = result.toJSON()
            
            log.info(`End function getGroupAtrByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getAtrByFilter: async (filter) => {
        try {
            log.info(`Start function getAtrByFilter Params: ${JSON.stringify(filter)}`);
            let result = await models.attribute.findOne({
                where: filter,
                raw: true
            });
            log.info(`End function getAtrByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getProdToAtrByFilter: async (filter) => {
        try {
            log.info(`Start function getAtrByFilter Params: ${JSON.stringify(filter)}`);
            let result = await models.product_to_attribute.findOne({
                where: filter,
                include:[{model:models.uploaded_files, as:"image"}]
            });
            if(result) result.toJSON()
            log.info(`End function getAtrByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    getAtrValueByFilter: async (filter) => {
        try {
            log.info(`Start function getAtrValueByFilter Params: ${JSON.stringify(filter)}`);
            let result = await models.attribute_values.findOne({
                where: filter,
                raw: true
            });
            log.info(`End function getAtrValueByFilter Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    }
}