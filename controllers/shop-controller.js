const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const productService = require('../services/product.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const pagesService = require('../services/pages.service');
const templateUtil = require('../utils/template-util');
const bookingController = require('../controllers/booking.controller');
const userService = require('../services/user.service');
const menuService = require('../services/menu.service');
const categoryService = require('../services/categorie.service')
const linksService = require('../services/links.service')
const _ = require('lodash');
const productTestimonialsService = require('../services/product_testimonials.service');
const moment = require('moment');
const log = require('../utils/logger');
const paginationUtil = require('../utils/pagination-util')
const product_discount_calc = require('../utils/product_discount_calc')
const extraUtil = require('../utils/extra-util')
const productPriceUtil = require('../utils/product_price-util')
const productCompositeImagesUtil = require('../utils/composite-images')
const attributesGroupsService = require('../services/attribute_groups.service');
const formsService = require('../services/forms.service')
const attributesService = require('../services/attributes.service');
const { imagePath } = require('../utils/handebar-helpers');
const serviceService = require('../services/service.service.js')
const notificationService = require("../services/notification-service");
const axios = require("axios");
const requestIp = require('request-ip');
const adminServiceService = require("../services/admin.service.service");



function getOriginalDimentions(base,mat,user,discount,dimensions){
    let prod_price,prod_discounted_price
    if (dimensions && dimensions.length) {
        for (let [ index, dimension ] of dimensions.entries()) {
            if(index === 0) {
                dimension.is_default = true;
            }else{
                dimension.is_default = null;
            }
            let dimPrise = base + (mat * dimension.s * dimension.h) / 1000000;
            dimension.price = Math.ceil(dimPrise);

            if(user && dimension.price){
                dimension.price =  product_discount_calc(user, dimension.price, discount);
            }
            if (dimension.discount && dimension.discount_type) {
                if (dimension.discount_type == config.DISCOUNT_TYPES.VALUE) {
                    dimension.discounted_price = Math.ceil(dimension.price - dimension.discount);
                } else if (dimension.discount_type == config.DISCOUNT_TYPES.PERCENT) {
                    dimension.discounted_price = Math.ceil(dimension.price - (dimension.price * (dimension.discount / 100)));
                }
                if(user && dimension.discounted_price){
                    dimension.discounted_price = product_discount_calc(user, dimension.discounted_price, discount);
                }
            } else {
                dimension.discounted_price = null;
            }
            dimension.discounted_price = dimension.discounted_price ? dimension.discounted_price : null
            if(dimension.is_default){
                s = dimension.s;
                h = dimension.h;
                prod_price = Math.ceil(dimension.price);
                prod_discounted_price = dimension.discounted_price ? Math.ceil(dimension.discounted_price) : null;
            }
        }
    }
    return dimensions
}

function modifyProduct(result) {
    if(result.steps && result.steps.length){
        for (let step of result.steps) {
            if(step.id == 1 || step.origin_id == 1){
                if(step.attribute_groups && step.attribute_groups.length){
                    for (let atrGr of step.attribute_groups) {
                        if(atrGr.type == 2){
                            if(atrGr.attributes && atrGr.attributes.length){
                                let uniqueAtr = atrGr.attributes
                                    .map(item => item.dependent_atr_id)
                                    .filter((value, index, self) => self.indexOf(value) === index);
                                let arr = [];
                                let def = atrGr.attributes.find(item => item.is_default);
                                def = def && def.dependent_atr_id ? def.dependent_atr_id : null;
                                if(uniqueAtr && uniqueAtr.length){
                                    for (let atrId of uniqueAtr) {
                                        let obj = { depend_atr_id: atrId };
                                        obj.is_default = def && def == atrId ? true : false;
                                        obj.arr = atrGr.attributes.filter(el => el.dependent_atr_id == atrId);
                                        arr.push(obj)
                                    }
                                    atrGr.attributes = arr;
                                }
                            }
                        }
                    }
                }
            }
            if(step.id == 13 || step.origin_id == 13){
                if(step.attribute_groups && step.attribute_groups.length){
                    for (let atrGr of step.attribute_groups) {

                        if(atrGr.type == 6){
                            if(atrGr.attributes && atrGr.attributes.length){
                                let notDependAtr = atrGr.attributes.filter(item => item.dependent_atr_id === null);
                                if(notDependAtr && notDependAtr.length){
                                    for (let atr of notDependAtr) {
                                        atr.depend_atr_arr = atrGr.attributes.filter(item => item.dependent_atr_id === atr.id || item.dependent_atr_id === atr.origin_id);
                                    }
                                }
                                atrGr.attributes = notDependAtr;
                            }
                        }

                    }
                }
            }
        }

    }
    return result;
}
async function groupAttrAndOptions(getAttributes){
    let attrinuteIds = [];
    let optionsIds = [];
    for (let p of getAttributes) {
        if (p.product_attribute) {
            for (let v of p.product_attribute) {
                if(v.attribute_group){
                    optionsIds.push({
                        id: v.attribute_group.id,
                        value: v.activeValue.value,
                        title: v.attribute_group.title,
                        status: v.attribute_group.status,
                        type: v.attribute_group.type,
                    })
                } else {
                    attrinuteIds.push({
                        id: v.id,
                        value: v.activeValue.value,
                        title: v.title,
                        status: v.status,
                        type: v.type,
                        unit_of_measurement: v.unit_of_measurement
                    })
                }
            }
        }
    }
    attrinuteIds = _(attrinuteIds)
        .uniqBy(v => [v.id, v.value].join())
        .value();
    optionsIds = _(optionsIds)
        .uniqBy(v => [v.id, v.value].join())
        .value();


    attrinuteIds = _.groupBy(attrinuteIds, 'id');
    optionsIds = _.groupBy(optionsIds, 'id');


    let finalAttributes = [];
    let finalOptions = [];
    for (let property in attrinuteIds) {
        let attribute = {};
        let arrOfAttr = attrinuteIds[property];
        attribute.id = property;
        attribute.value = _.sortBy(arrOfAttr, 'value').map(i => i.value);
        attribute.title = arrOfAttr[0].title
        attribute.status = arrOfAttr[0].status
        attribute.type = arrOfAttr[0].type
        attribute.unit_of_measurement = arrOfAttr[0].unit_of_measurement
        attribute.group_attr = arrOfAttr[0].group_atr
        finalAttributes.push(attribute);
    }
    for (let property in optionsIds) {
        let attribute = {};
        let arrOfAttr = optionsIds[property];
        attribute.id = property;
        attribute.value = _.sortBy(arrOfAttr, 'value').map(i => i.value);
        attribute.title = arrOfAttr[0].title
        attribute.status = arrOfAttr[0].status
        attribute.type = arrOfAttr[0].type
        finalOptions.push(attribute);
    }

    for(let obj of finalAttributes){
        let attrs = await productService.getAttrValue(obj.value)

        obj.value = attrs

    }

    return [finalAttributes,finalOptions]
}

async function getAllCategoriesForPromotionsProducts(getAllCategories,lang){
    let getAllUniqCategoriesArrIds = []
    if (getAllCategories) {
        getAllCategories.forEach((item) => {
            if (item.category.length) {
                item.category.forEach((category) => {
                    getAllUniqCategoriesArrIds.push(category.id)
                })
            }
        })
    }
    getAllUniqCategoriesArrIds = getAllUniqCategoriesArrIds.flat()
    getAllUniqCategoriesArrIds = _.uniq(getAllUniqCategoriesArrIds);
    let CategoriesArr = await productService.getCategories(true, { id: getAllUniqCategoriesArrIds, lang: lang })
    return CategoriesArr
}


module.exports = {

    reCalculateProduct: async(req, res) => {
        let { custom_s, custom_h, product_id, custom_l, custom_l1, custom_l2, custom_m, custom_d,variation_id,default_atr } = req.body
        log.info(`Start /reCalculateProduct Params: ${JSON.stringify(req.body)}`);
        let lang = req.lang
        const userId = req.user ? req.user.userid : null;
        let user
        if (userId) {
            user = await userService.getUser(userId, ['email', 'first_name', 'last_name', 'discount','role',"coeficient","retail_prices"]);
            user = user ? user.toJSON() : user;
        }
        let result;
        let discount = null
        if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
        if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
        if(discount && discount.value) discount = discount.value

        try {
            if(custom_s) custom_s = +custom_s;
            if(custom_h) custom_h = +custom_h;
            if(custom_l) custom_l = +custom_l;
            if(custom_l1) custom_l1 = +custom_l1;
            if(custom_l2) custom_l2 = +custom_l2;
            if(custom_m) custom_m = +custom_m;
            if(custom_d) custom_d = +custom_d;

            let product
            if(default_atr){
                product = await productService.getProductByslug({
                    [Op.or]: [{ id: product_id, lang: lang }, { origin_id: product_id, lang: lang }]
                }, false, true, default_atr);
            } else {
                product = await productService.getProduct({
                    [Op.or]: [{ id: product_id, lang: lang }, { origin_id: product_id, lang: lang }]
                }, null,null)
            }

            if(product.type && product.type == config.PRODUCT_TYPES.GLASS){
                if (custom_s < +product.min_s || custom_s > product.max_s) {
                    throw new Error("custom_s not in min max width range")
                }
                if (custom_h < +product.min_h || custom_h > product.max_h) {
                    throw new Error("custom_h not in min max height range")
                }
                result = productPriceUtil.countPrice(product, false, false, custom_s, custom_h, user, discount);
                result.is_glass = true
            }else if(product.type && product.type == config.PRODUCT_TYPES.SHOWER){
                if (Number.isNaN(custom_s) || Number.isNaN(custom_h)) {
                    throw new Error("custom_s and custom_h must be INT !")
                }
                //TODO chek custom value
                // if(result.type == config.PRODUCT_TYPES.SHOWER){
                //     if(result.shower_type == config.SHOWER_TYPES.BLINDS){

                //     }else if(result.shower_type == config.SHOWER_TYPES.DOORS){

                //     }else if(result.shower_type == config.SHOWER_TYPES.WALK){

                //     }else if(result.shower_type == config.SHOWER_TYPES.BOX){

                //     }
                // }
                result = productPriceUtil.countShowerPrice(product, false, false, custom_s, custom_h, custom_l, custom_l1, custom_l2, custom_m,null, user, discount,product.changedMat,product.changedMatAtrId);
            }else if(product.type && product.type == config.PRODUCT_TYPES.SIMPLE){
                result = product;
            } else if(product.type && product.type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                let getVariation = await productService.getProductVariation({id:variation_id})
                if(getVariation){
                    getVariation.price = getVariation.price / 100
                    getVariation.price = product_discount_calc(user,getVariation.price,discount);
                    if(getVariation.discounted_price){
                        getVariation.discounted_price = getVariation.discounted_price / 100
                        getVariation.discounted_price = product_discount_calc(user,getVariation.discounted_price,discount);
                    }
                    result = getVariation
                }

            }
            if(result.is_glass && result.is_glass == true){
                if(default_atr && default_atr.length){
                    for(let item of default_atr){
                        if(item.originAtrGrId == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                            let originProdId = result.origin_id ? result.origin_id : result.id
                            let attr = await productService.getProdToAtrByFilter({attribute_id: item.originAtrId,product_id:originProdId })
                            if(attr.image){
                                result.new_image_path = imagePath(attr.image, null, 1)
                            } else {
                                if(result.gallery && result.gallery.length){
                                    result.new_image_path = imagePath(result.gallery[0].block_image, '930X930', 1)
                                } else {
                                    result.new_image_path = imagePath(result.image, '930X930', 1)
                                }
                            }
                        }
                    }
                } else {
                    if(result.gallery && result.gallery.length){
                        result.new_image_path = imagePath(result.gallery[0].block_image, '930X930', 1)
                    } else {
                        result.new_image_path = imagePath(result.image, '930X930', 1)
                    }
                }
            }

            log.info(`End /reCalculateProduct Result: ${JSON.stringify(result)}`);
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getCatalog:async(req,res)=>{
        const lang = req.lang;
        let slug = req.params.slug;
        let user, notificationsCount;
        const languages = config.LANGUAGES
        const page_id = req.params.id
        const id = req.user ? req.user.userid : null;
        let page
        try{
            page = await pagesService.getPage({[Op.or]:[{id:page_id,lang:lang, template: 'services' },{origin_id:page_id,lang:lang, template: 'services'}]},null,lang);

            let seoSection = null
            if (page && page.sections && page.sections.length) {
                for (let k = 0; k < page.sections[0].body.length; k++) {
                    if (page.sections[0].body[k].type == "2") seoSection = page.sections[0].body[k]
                    if (page.sections[0].body[k].type == "18" ) {
                        if (page.sections[0].body[k].content && page.sections[0].body[k].content.ids && page.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            for (let review of page.sections[0].body[k].content.ids) {
                                review = await pagesService.getFaqByPage({id:review.id})
                                if(review){
                                    review.block_title = review.title
                                    if(review.first_comment)review.block_text = review.first_comment.text
                                    mass.push(review)
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }
                    if (page.sections[0].body[k].type == "16" ) {
                        if (page.sections[0].body[k].blocks && page.sections[0].body[k].blocks.length) {
                            let mass =[]
                            for (let item of page.sections[0].body[k].blocks) {
                                if(item.ids && item.ids.length){
                                    for(let review of item.ids){
                                        if(review && typeof review == 'object')review = review.id
                                        review = await pagesService.getReviewByPage({id:review})
                                        if(review){
                                            mass.push(review)
                                        }
                                    }
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }
                   if (page.sections[0].body[k].type == "20" ) {
                       if (page.sections[0].body[k].content && page.sections[0].body[k].content.ids&& page.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            for (let item of page.sections[0].body[k].content.ids) {
                                item = await pagesService.getCategoryByPage({id:item.id})
                                if(item){
                                    item.link = await models.links.findOne({where:{original_link:`/shop/getServiceCategory/${item.id}`},raw:true,attributes:['slug']})
                                    item.link = item.link && item.link.slug ? item.link.slug : '/'
                                    mass.push(item)
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }
                    if (page.sections[0].body[k].type == "23" || page.sections[0].body[k].type == "22") {
                        if (page.sections[0].body[k].content.ids && page.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            for(let service of page.sections[0].body[k].content.ids){
                                if(typeof service == 'object')service = service.id
                                service = await pagesService.getServiceByPage({id:service,status:config.GLOBAL_STATUSES.ACTIVE})
                                if(service){
                                    let productLink = await linksService.getLinkByFilter({ original_link: `/shop/getService/${service.id}`,lang })
                                    if (productLink) {
                                        productLink = productLink.toJSON()
                                        service.link = productLink.slug
                                    }
                                    mass.push(service)
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }
                }
            }

            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', "role"]);

                user = user ? user.toJSON() : user;
                user = {...user };
                notificationsCount = await notificationService.countUserNotifications(id, lang);
            }

            let links = await linksService.getAllLinks({ original_link: '/shop/catalog' });
            let slugs = {}
            if(links && links.length){
                links.forEach((item,i)=>{
                    if(item.slug == '/'){
                        slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/` : `/${languages[i]}${item.slug}`
                    } else slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
                })
            }
            res.render(
                'client/services', {
                    langs: req.langs,
                    slugs,
                    lang: lang,
                    metaData: req.body.metaData,
                    layout: 'client/layout.hbs',
                    header_footer: header_footer ? header_footer : null,
                    menu: menu ? menu : null,
                    page: page,
                    user,
                    consultation_form: await pagesService.getFormByPage(4,lang),
                    notificationsCount: notificationsCount ? notificationsCount: null,
                    isPage: true,
                    seoSection
                });
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getCategoryById:async(req,res)=>{
        const lang = req.lang;
        let slug = req.params.slug;
        let user, notificationsCount;
        const languages = config.LANGUAGES
        const id = req.user ? req.user.userid : null;
        const cat_id = req.params.id
        let current_page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 12;
        let page
        let all_category_services
        let countPages;
        let minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        let paginationData
        let allActiveCategory
        const ip = requestIp.getClientIp(req)

        let ipCountry = await axios({
            method: 'get',
            url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        })
        if(ipCountry)ipCountry = ipCountry.data
        try{
            page = await serviceService.getCategory({ id:cat_id},null,lang);
            if(page){
                all_category_services = await serviceService.getAllCategoryServices(current_page,perPage,cat_id,lang,null,ipCountry)
            }
            allActiveCategory = await serviceService.getAllActiveCategory({id:{[Op.ne]:cat_id},lang:lang,status:config.GLOBAL_STATUSES.ACTIVE})
            let seoSection = null
            if (page && page.sections && page.sections.length) {
                for (let k = 0; k < page.sections[0].body.length; k++) {
                    if (page.sections[0].body[k].type == "2") seoSection = page.sections[0].body[k]
                    if (page.sections[0].body[k].type == "18" ) {
                        if (page.sections[0].body[k].content && page.sections[0].body[k].content.ids && page.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            for (let review of page.sections[0].body[k].content.ids) {
                                review = await pagesService.getFaqByPage({id:review.id})
                                if(review){
                                    review.block_title = review.title
                                    if(review.first_comment)review.block_text = review.first_comment.text
                                    mass.push(review)
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }
                    if (page.sections[0].body[k].type == "16" ) {
                        if (page.sections[0].body[k].blocks && page.sections[0].body[k].blocks.length) {
                            let mass =[]
                            for (let item of page.sections[0].body[k].blocks) {
                                if(item.ids && item.ids.length){
                                    for(let review of item.ids){
                                        review = await pagesService.getReviewByPage({id:review.id})
                                        if(review){
                                            mass.push(review)
                                        }
                                    }
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }
                    if (page.sections[0].body[k].type == "20" ) {
                        if (page.sections[0].body[k].content && page.sections[0].body[k].content.ids&& page.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            for (let item of page.sections[0].body[k].content.ids) {
                                item = await pagesService.getCategoryByPage({id:item.id})
                                if(item){
                                    item.link = await models.links.findOne({where:{original_link:`/shop/getCategory/${item.id}`},raw:true,attributes:['slug']})
                                    item.link = item.link && item.link.slug ? item.link.slug : '/'
                                    mass.push(item)
                                }
                            }
                            page.sections[0].body[k].blocks = mass
                        }
                    }

                }
            }
            paginationData = await paginationUtil.pagination(countPages, all_category_services.count, perPage, current_page, minPage, maxPage, lastElem, isPaginationShow)
            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', "role"]);

                user = user ? user.toJSON() : user;
                user = {...user };
                notificationsCount = await notificationService.countUserNotifications(id, lang);
            }

            let slugs = {}
            let links = await serviceService.getAllLinksByServicesCategory(cat_id)
            if(links && links.length){
                links.forEach((item,i)=>{
                    if(item.slug == '/'){
                        slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/` : `/${languages[i]}${item.slug}`
                    } else slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
                })
            }
            res.render(
                'client/statement', {
                    langs: req.langs,
                    slugs,
                    lang: lang,
                    metaData: req.body.metaData,
                    layout: 'client/layout.hbs',
                    header_footer: header_footer ? header_footer : null,
                    menu: menu ? menu : null,
                    page: page,
                    user,
                    consultation_form: await pagesService.getFormByPage(4,lang),
                    notificationsCount: notificationsCount ? notificationsCount: null,
                    isPage: true,
                    seoSection,
                    all_category_services,
                    countPages: paginationData.countPages,
                    isPaginationShow: paginationData.isPaginationShow,
                    pagination: paginationData.pagination,
                    lastElem: paginationData.pagination.lastElem,
                    pagination_js:true,
                    allActiveCategory
                });
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getCategoryByIdAjax:async(req,res)=>{
        const lang = req.lang;
        let slug = req.params.slug;
        let user, notificationsCount;
        const languages = config.LANGUAGES
        const id = req.user ? req.user.userid : null;
        const cat_id = req.params.id ? req.params.id : req.body.cat_id;
        let search = req.body.search
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 12;
        let all_category_services
        let countPages;
        let minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        let paginationData
        const ip = requestIp.getClientIp(req)

        let ipCountry = await axios({
            method: 'get',
            url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        })
        try{
            all_category_services = await serviceService.getAllCategoryServices(page,perPage,cat_id,lang,search,ipCountry)
            paginationData = await paginationUtil.pagination(countPages, all_category_services.count, perPage, page, minPage, maxPage, lastElem, isPaginationShow)

            const pagination = await templateUtil.getTemplate({
                countPages: paginationData.countPages,
                isPaginationShow: paginationData.isPaginationShow,
                pagination: paginationData.pagination,
            }, 'partials/pagination');

            const html = await templateUtil.getTemplate({
                all_category_services,
                lang: lang
            },'client/statement-ajax' );
            // const search_text = await templateUtil.getTemplate({
            //     lang:lang,
            //     all_category_services
            // },'client/statement-search-ajax')
            log.info(`End getAllPostsAjax data:${JSON.stringify(html,pagination,all_category_services)}`)
            return res.json({
                html: html,
                pagination: pagination,
                search:all_category_services,
            })
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getServiceById:async (req,res)=>{
        try {
            const ip = requestIp.getClientIp(req)

            let ipCountry = await axios({
                method: 'get',
                url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            })
            if(ipCountry)ipCountry = ipCountry.data
            const lang = req.lang;
            let id = req.params.id;
            const languages = config.LANGUAGES;
            let renderPage = 'client/statement_detail';
            const userId = req.user ? req.user.userid : null;

            let result = await serviceService.getService({[Op.or]:[{id:id,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},{origin_id:id,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE}]})
            if(!result){
                return  res.redirect(`/${lang}/404`)
            }

            if(result && result.service_country_pricing && result.service_country_pricing.length && ipCountry && ipCountry.country){
                for(let country_price of result.service_country_pricing){
                    if(country_price.ip == ipCountry.country){
                        result.price = country_price.price
                    }
                }
            }
            if(result && result.constructor.length && typeof result.constructor[0] == 'object'){
                result.last = result.constructor.length - 1

            }
            if (result && result.sections && result.sections.length) {
                for (let k = 0; k < result.sections[0].body.length; k++) {
                    if (result.sections[0].body[k].type == "16" ) {
                        if (result.sections[0].body[k].content && result.sections[0].body[k].content.ids && result.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            if(result.sections[0].body[k].content && result.sections[0].body[k].content.ids && result.sections[0].body[k].content.ids.length){
                                for (let review of result.sections[0].body[k].content.ids) {
                                    review = await pagesService.getReviewByPage({id:review.id})
                                    if(review){
                                        mass.push(review)
                                    }
                                }
                                result.sections[0].body[k].blocks = mass
                            }
                        }
                    }
                    if (result.sections[0].body[k].type == "18" ) {
                        if (result.sections[0].body[k].content && result.sections[0].body[k].content.ids && result.sections[0].body[k].content.ids.length) {
                            let mass =[]
                            for (let review of result.sections[0].body[k].content.ids) {
                                review = await pagesService.getFaqByPage({id:review.id})
                                if(review){
                                    review.block_title = review.title
                                    if(review.first_comment)review.block_text = review.first_comment.text
                                    mass.push(review)
                                }
                            }
                            result.sections[0].body[k].blocks = mass
                        }
                    }
                }
            }
            let total_price
            if(result && result.price && result.count_price){
                total_price = result.price + result.count_price
            }
            let user, notificationsCount;
            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            if (userId) {
                user = await userService.getUser(userId, ['id', 'first_name', 'last_name',"father_name", 'email', 'phone', "role","address","house",'apartment',"inn","num_passport",'birthday_date','is_private']);
                notificationsCount = await notificationService.countUserNotifications(userId, lang);
                user = user ? user.toJSON() : user;
                user = {...user };
            }
            let slugs = {}
            let links = await serviceService.getAllLinksByServices(id)
            if(links && links.length){
                links.forEach((item,i)=>{
                    if(item.slug == '/'){
                        slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/` : `/${languages[i]}${item.slug}`
                    } else slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
                })
            }
            let isMap_statement = true
            let map_key = await models.configs.findOne({ where: { type: 'map_key' }, raw: true });
            let privat_card = await models.configs.findOne({where:{type:'card_privat_to_order',lang:lang},raw:true})
            if(result.preview){
                await adminServiceService.deleteService(result.id, null);
            }
            if(privat_card)privat_card = privat_card.value
            res.render(renderPage, {
                langs: req.langs,
                lang: lang,
                layout: 'client/layout.hbs',
                metaData: req.body.metaData,
                result: result,
                header_footer: header_footer ? header_footer : null,
                menu: menu ? menu : null,
                user,
                consultation_form: await pagesService.getFormByPage(4,lang),
                notificationsCount: notificationsCount ? notificationsCount: null,
                total_price,
                lightTheme: true,
                step:true,
                isMap_statement,
                map_key: map_key.value,
                privat_card,
                slugs,
                form: await pagesService.getFormByPage(4,lang),
                consultations:true,
            });


        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },





















    getProductById: async(req, res) => {
        try{
            const lang = req.lang;
            let id = req.params.id
            let favProducts = req.favProducts;
            let favProductsIds = favProducts;
            let favorite = favProducts && favProducts.length ? favProducts.length : 0;
            let cart = req.cart;
            let product_history
            let viewedProducts = req.viewedProducts;
            let isConfiguratorShow = false;
            const userId = req.user ? req.user.userid : null;
            let slugs = {};
            const languages = config.LANGUAGES;
            let renderPage = 'client/product-detail';

            const forms = await models.forms.findAll({ where: { status: config.GLOBAL_STATUSES.ACTIVE, lang: lang }, raw: true });


            let result = await productService.getProductByslug({ [Op.or]: [
                    { id: id, lang: lang, status: config.GLOBAL_STATUSES.ACTIVE },
                    { origin_id: id, lang: lang, status: config.GLOBAL_STATUSES.ACTIVE }
                ] }, true);


            let user;
            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            if (userId) {
                user = await userService.getUser(userId, ['email', 'first_name', 'last_name', 'discount','role',"coeficient","retail_prices"]);
                user = user ? user.toJSON() : user;
                favProductsIds = await productService.getAllFavoritesProductIds(userId);
                favorite = favProductsIds && favProductsIds.length ? favProductsIds.length : 0;
            }
            let discount = null
            if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
            if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
            if(discount && discount.value) discount = discount.value

            let catalogPage = await pagesService.getPage({ lang, template: "collections" }, null, lang)
            let catalogLink = await linksService.getLinkByFilter({ original_link: `/shop/getCategories/${catalogPage.id}`,lang })
            catalogLink = catalogLink.toJSON()
            catalogPage.slug = catalogLink.slug
            if(catalogPage.slug) catalogPage.slug = lang === config.LANGUAGES[0] ? `${catalogPage.slug}` : `${lang}/${catalogPage.slug}`;
            if (result) {

                if(result.price) result.price = product_discount_calc(user,result.price,discount)
                if(result.discounted_price) result.discounted_price = product_discount_calc(user,result.discounted_price,discount)

                let originProductId = result.origin_id ? result.origin_id : result.id;

                let otherLangsIds = await productService.getAllProductsByFilter({ origin_id: originProductId });
                let otherLangsOriginalLinks = otherLangsIds.map((i, index) => `/shop/getProduct/${i.id}`);
                let originalLinksFilter = {
                    [Op.in]: [`/shop/getProduct/${originProductId}`, ...otherLangsOriginalLinks]
                };
                let links = await linksService.getAllLinks({ original_link: originalLinksFilter });
                if (links && links.length) {
                    links.forEach((item, i) => {
                        slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
                    })
                }

                if (result.together_cheaper_products && result.together_cheaper_products.length) {
                    result.together_cheaper_products_old_price = product_discount_calc(user,result.price,discount)
                    result.together_cheaper_products_price = result.discounted_price ? product_discount_calc(user,result.discounted_price,discount) : result.price;
                    result.together_cheaper_products = await Promise.all(result.together_cheaper_products.map(async(el, index) => {
                            if(el){
                                if (index <= 1) {
                                    result.together_cheaper_products_price += product_discount_calc(user,el.promotional_price,discount);
                                    result.together_cheaper_products_old_price += product_discount_calc(user,el.price,discount);
                                }
                                el.slug = await linksService.getLinkObjByFilter({ original_link: `/shop/getProduct/${el.id}`,lang });
                            }
                            return el
                        })
                    );
                }


                if (result.category && result.category.length) {
                    result.category = await Promise.all(result.category.map(async(el) => {
                        el.slug = await linksService.getLinkObjByFilter({ original_link: `/shop/getCategory/${el.id}`,lang });
                        if(el.slug) el.slug = lang === config.LANGUAGES[0] ? `${el.slug.slug}` : `${lang}/${el.slug.slug}`;
                        return el
                    }));

                    if(!result.characteristics_image){
                        let categ = result.category.find(item => item.characteristics_image)
                        if(categ && categ.characteristics_image){
                            result.characteristics_image = categ.characteristics_image;
                        }
                    }
                    if(!result.reviews_image){
                        let categ = result.category.find(item => item.reviews_image)
                        if(categ && categ.reviews_image){
                            result.reviews_image = categ.reviews_image;
                        }
                    }
                }




                if (viewedProducts && viewedProducts.length) {
                    let viewProd =  await productService.getViewedProductByIds(id, viewedProducts,lang);
                    //viewProd = viewProd.map((item) =>item.toJSON())
                    for(let i = 0; i< viewProd.length; i++){
                        if(viewProd[i].type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                            viewProd[i].price = null;
                            viewProd[i].discounted_price = null;
                            if(viewProd[i].product_variations && viewProd[i].product_variations.length){
                                let variationsName = viewProd[i].product_variations.find(item => !item.value);
                                if(variationsName && variationsName.name){
                                    viewProd[i].product_variations
                                        .filter(item => item.value)
                                        .map((item, index) => {
                                            let k = item;
                                            if(k.price) k.price = Math.round(k.price/100);
                                            if(k.discounted_price) k.discounted_price = Math.round(k.discounted_price/100);
                                            if(k.name) delete k.name;
                                            if(index === 0){
                                                viewProd[i].price = product_discount_calc(user,k.price,discount);
                                                if(k.discounted_price) viewProd[i].discounted_price = product_discount_calc(user,k.discounted_price,discount);
                                            }
                                            return k
                                        });
                                }
                            }
                        } else {
                            //viewProd[i].price =  viewProd[i].price/100
                            if( viewProd[i].discounted_price){
                                //viewProd[i].discounted_price =  viewProd[i].discounted_price/100
                                viewProd[i].discounted_price = product_discount_calc(user,viewProd[i].discounted_price,discount)
                            }
                            viewProd[i].price = product_discount_calc(user,viewProd[i].price,discount)
                        }
                    }
                    product_history = viewProd
                }

                if (result.product_attribute && result.product_attribute.length) {
                    let options = [];
                    let attributes = [];

                    for (let atr of result.product_attribute) {
                        if(atr.group_atr && atr.attribute_group  && atr.attribute_group.title){
                            options.push(atr.attribute_group.title)
                        }else{
                            attributes.push({
                                title: atr.title,
                                value: atr.value && atr.value.value ? atr.value.value : '',
                            })
                        }
                    }
                    result.options = options.filter((v, i, a) => a.indexOf(v) === i).join();
                    result.attributes = attributes;

                }
                if (result.dimensions && result.dimensions.length) {
                    let dimensions_text = [];
                    for (const dimension of result.dimensions) {
                        if(dimension && dimension.s && dimension.h) dimensions_text.push(`${dimension.s}x${dimension.h}`);
                    }
                    result.dimensions_text = dimensions_text.join();
                }

                let productTestimonials = await  productTestimonialsService.getAllProductTestimonialsByFilter({
                    parent_id: 0,
                    status: config.GLOBAL_STATUSES.ACTIVE,
                    origin_product_id: originProductId,
                }, 1, 500);

                if (productTestimonials && productTestimonials.data && productTestimonials.data.length) {

                    result.isShowMore = productTestimonials.isShowMore;
                    result.product_testimonials = productTestimonials.data;

                    let showLength = productTestimonials.data.length > 3 ? 3 : productTestimonials.data.length;
                    let showTestimonials = []
                    for (let i = 0; i < showLength; i++) {
                        if(result.product_testimonials[i]) showTestimonials.push(result.product_testimonials[i]);
                    }
                    if(showTestimonials && showTestimonials.length){
                        result.product_testimonials = await productTestimonialsService.getAllProductTestimonialsAnswersByFilter(showTestimonials)
                    }

                }else{
                    result.product_testimonials = [];
                    result.isShowMore = productTestimonials.isShowMore;
                }

                if(result.image) result.gallery.unshift({ block_image: result.image });
                result.slug = await linksService.getLinkObjByFilter({ original_link: `/shop/getProduct/${result.id}`,lang });
                if(result.origin_id == 0){
                    result.favourite = favProductsIds.includes(result.id) ? true : false;
                } else result.favourite = favProductsIds.includes(result.origin_id) ? true : false;

                if(result.steps && result.steps.length) isConfiguratorShow = true;

                if(result.characteristics && result.characteristics.length){
                    for(let item of result.characteristics){
                        let isSelective = item.text.split(',')
                        if(isSelective.length>1){
                            item.text = item.text.split(',')
                            item.isSelective = true
                        }
                    }
                }


            }else{
                res.status(403);
                renderPage = './404';
            }

            let homePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${homePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;

            //Add product to cookie viewed_products
            if (viewedProducts && viewedProducts.length) {
                viewedProducts = viewedProducts.filter((el, index) => el != id && index < config.VIEWED_PRODUCTS_HISTORY.VIEWED_PRODUCTS_NUMDER);
                viewedProducts.unshift(id);
            } else {
                viewedProducts.push(id);
            }

            //Set viewed_products cookie
            viewedProducts = JSON.stringify(viewedProducts);
            res.cookie('viewed_products', viewedProducts, { maxAge: config.VIEWED_PRODUCTS_HISTORY.COOKIE_MAX_AGE });

            let renderHeader = 'client/layout.hbs';

            let oneClickForm = await formsService.getFormById({type:2,lang:lang})
            let thankPopupContent = {
                popup_icon: oneClickForm.popup_icon,
                popup_title: oneClickForm.popup_title,
                popup_text: oneClickForm.popup_text
            }

            let page_settings = await models.configs.findOne({ where: { type: 'popups_settings', lang: lang }, raw: true });
            if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
            if (page_settings && page_settings.your_message_sended) page_settings = page_settings.your_message_sended



            let hide_testimonials = await models.configs.findOne({ where: { type: 'hide_testimonials' }, raw: true });
            hide_testimonials = JSON.parse(hide_testimonials.value);



            let info_popup_obj = {}

            if(result && result.type == config.PRODUCT_TYPES.SHOWER){
                let prod_informer
                if(result.informer && result.informer.length) prod_informer = result.informer
                Object.assign(info_popup_obj,config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type])

                let ids = []
                for(let key in info_popup_obj){
                    ids.push(info_popup_obj[key])
                }
                let getAllAttrGr = await attributesGroupsService.getAttributeGroupAllByFilter(
                    { [Op.or]: [{ id: ids, lang: lang },
                            { origin_id: ids, lang: lang }]
                    });
                if(getAllAttrGr && getAllAttrGr.length) getAllAttrGr = getAllAttrGr.map(item => item.toJSON())
                for(let item in info_popup_obj){
                    getAllAttrGr.forEach(el => {
                        let origElId = el.origin_id ? el.origin_id : el.id
                        //let value = config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type][origElId]
                        let value = Object.keys(config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type])
                            .find(key => config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type][key] === origElId);
                        if(prod_informer && prod_informer.length){
                            for(let item of prod_informer){
                                if((item.value == value) && item.hint_text && item.title){
                                    info_popup_obj[value] = value
                                }
                            }
                        } else {
                            if(lang ==config.LANGUAGES[0]){
                                if(el.id == info_popup_obj[item]){
                                    if(!el.title || !el.hint_text){
                                        delete info_popup_obj[item]
                                    }
                                }
                            } else {
                                if(el.origin_id == info_popup_obj[item]){
                                    if(!el.title || !el.hint_text){
                                        delete info_popup_obj[item]
                                    }
                                }
                            }
                        }



                    })
                }
            }

            if(result && result.body && result.body.length){
                for(let i = 0; i<result.body.length;i++){
                    if(i == result.body.length-1){
                        result.body[i].lastEl = true
                    }
                }
            }
            let colors = []
            if(result && result.steps && result.steps.length){
                for(let step of result.steps){
                    if(step.id == config.MIRROR_COLOR_STEP_ORIGIN_ID || step.origin_id == config.MIRROR_COLOR_STEP_ORIGIN_ID){
                        for(let atrGr of step.attribute_groups){
                            if(atrGr.id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID || atrGr.origin_id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                                for(let attr of atrGr.attributes){
                                    let obj = {
                                        attr_obj :{
                                            originAtrGrId: atrGr.origin_id ? atrGr.origin_id : atrGr.id,
                                            originAtrId: attr.origin_id ? attr.origin_id : attr.id,
                                            originAtrValueId: "",
                                            dependAtrId:  "",
                                        },
                                        title: attr.title
                                    }


                                    if(attr.is_default){
                                        let originAttrId = attr.origin_id ? attr.origin_id : attr.id
                                        let originProdId = result.origin_id ? result.origin_id : result.id
                                        let attribute = await productService.getProdToAtrByFilter({attribute_id: originAttrId,product_id:originProdId })
                                        if(attribute.image){
                                            if(result.gallery && result.gallery.length){
                                                result.gallery[0].block_image = attribute.image
                                                result.gallery[0].block_image.is_color = true
                                            } else {
                                                result.image = attribute.image
                                                result.image = true
                                            }
                                        }
                                        obj.is_default = true
                                    }

                                    colors.push(obj)
                                }
                            }
                        }
                    }
                }
            }


            res.render(renderPage, {
                langs: req.langs,
                colors: colors && colors.length ? colors : null,
                lang: lang,
                info_popup_obj,
                layout: renderHeader,
                hide_testimonials,
                metaData: req.body.metaData,
                result: result,
                favorite: favorite ? favorite : null,
                header_footer: header_footer ? header_footer : null,
                menu: menu ? menu : null,
                isProduct: true,
                isConfiguratorShow,
                cart: cart,
                user,
                homePage,
                product_history,
                catalogPage,
                oneClickForm,
                page_settings_title: page_settings.title ? page_settings.title : null,
                page_settings_text: page_settings.text ? page_settings.text : null,
                page_settings_icon: page_settings.image ? page_settings.image : null,
                forms: forms,
                thankPopupContent,
                lightTheme: true,
                slugs,
            });
        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },



    getAllCategories: async(req, res) => {
        log.info(`Start getAllCategories data:${JSON.stringify(req.body)}`)
        const is_mobile_req = req.query.is_mobile_req;
        let pageId = req.url && req.url.includes('/getCategories/') ? req.url.split('/getCategories/').pop() : null;

        let body = req.body;
        let renderPage;
        const lang = req.lang;
        body.lang = lang;
        const languages = config.LANGUAGES
        let pageBody = await pagesService.getPage({ id: pageId, status: config.GLOBAL_STATUSES.ACTIVE },null,lang);
        let getAllCategories = await categoryService.getOriginWithProductsCategories(lang)

        if (pageBody && pageBody.lang !== lang) {
            let filter = pageBody.origin_id === 0 ? {
                [Op.or]: [{ id: pageBody.id, lang: lang }, { origin_id: pageBody.id, lang: lang }]
            } : {
                [Op.or]: [{ id: pageBody.origin_id, lang: lang }, { origin_id: pageBody.origin_id, lang: lang }]
            };
            pageBody = await pagesService.getPage({...filter, status: config.GLOBAL_STATUSES.ACTIVE },null,lang);
        }
        if (!pageBody || pageBody.template !== 'collections') {
            renderPage = './404';
        } else {
            renderPage = 'client/categories';


        }
        const original_id = pageBody  && pageBody.origin_id ? pageBody.origin_id : pageBody.id
        const otherLangsForPage = await pagesService.getAllPages({ origin_id: original_id });
        const otherLangsForPageOriginalLinks = otherLangsForPage.map((i,index) => extraUtil.generateLinkUrlForPage(i.type, i.id, i.template,languages[index+1]));
        const pageOriginalLinksFilter = {
            [Op.in]: [extraUtil.generateLinkUrlForPage(pageBody.type, original_id, pageBody.template, languages[0]), ...otherLangsForPageOriginalLinks]
        };
        let links = await linksService.getAllLinks({ original_link: pageOriginalLinksFilter });
        let slugs = {}
        if(links && links.length){
            links.forEach((item,i)=>{
                slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
            })
        }

        let header_footer = await menuService.getHeaderFooter(lang);
        const id = req.user ? req.user.userid : null;
        let user;
        if (id) {
            user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone','role']);

            user = user ? user.toJSON() : user;
            user = {...user };
        }
        let favorite = await productService.getCountFavorites(id);
        let menu = await menuService.getMenu(lang);

        let homePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${homePage.id}`,lang })
        homepageLink = homepageLink.toJSON()
        homePage.slug = homepageLink.slug
        if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;

        const renderHeader = 'client/layout.hbs';
        let cart = req.cart



        log.info(`End getAllCategories`)
        res.render(renderPage, {
            langs: req.langs,
            lang: lang,
            homePage,
            cart,
            metaData: req.body.metaData,
            layout: renderHeader,
            page_title: pageBody && pageBody.title ? pageBody.title : null,
            seoSection: pageBody.sections && pageBody.sections.length ? pageBody.sections[0].body[0] : null,
            categoriesList: getAllCategories,
            menu,
            slugs,
            first_name: user ? user.first_name : null,
            last_name: user ? user.last_name : null,
            header_footer: header_footer ? header_footer : null,
            user,
            favorite: favorite ? favorite : null
        });
    },
    // getCategoryById: async(req, res) => {
    //     log.info(`Start getCategoryById data:${JSON.stringify(req.body)}`)
    //     const is_mobile_req = req.query.is_mobile_req;
    //     const lang = req.lang;
    //     const languages = config.LANGUAGES
    //     let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
    //     let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 16;
    //     let homePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
    //     let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${homePage.id}`,lang })
    //     homepageLink = homepageLink.toJSON()
    //     homePage.slug = homepageLink.slug
    //     if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
    //     let categoriesPage = await pagesService.getPage({ lang,template: "collections" },null,lang)
    //     let categoriesLink = await linksService.getLinkByFilter({ original_link: `/shop/getCategories/${categoriesPage.id}`,lang })
    //     categoriesLink = categoriesLink.toJSON()
    //     categoriesPage.slug = categoriesLink.slug
    //     if(categoriesPage.slug) categoriesPage.slug = lang === config.LANGUAGES[0] ? `${categoriesPage.slug}` : `${lang}/${categoriesPage.slug}`;
    //     let favProducts = req.favProducts;
    //     let favProductsIds = favProducts;
    //     let favorite = favProducts && favProducts.length ? favProducts.length : 0;
    //     let cart = req.cart
    //
    //     if(req.query.current_page) page = parseInt(req.query.current_page)
    //     if(req.query.per_page) perPage = parseInt(req.query.per_page)
    //     if(req.query.min_s) req.body.min_s = parseInt(req.query.min_s)
    //     if(req.query.max_s) req.body.max_s = parseInt(req.query.max_s)
    //     if(req.query.min_h) req.body.min_h = parseInt(req.query.min_h)
    //     if(req.query.max_h) req.body.max_h = parseInt(req.query.max_h)
    //
    //     if(req.query.width_triggered) req.body.width_triggered = req.query.width_triggered
    //     if(req.query.height_triggered) req.body.height_triggered = req.query.height_triggered
    //
    //     if(req.query.attributes) req.body.attributes = req.query.attributes
    //     if(req.query.options) req.body.options = req.query.options
    //     if(req.query.sortBy){
    //         req.body.sortBy = parseInt(req.query.sortBy)
    //     } else req.body.sortBy = 4
    //
    //
    //     let body = req.body;
    //     let countPages;
    //     let minPage, maxPage;
    //     let lastElem = true;
    //     let isPaginationShow = true;
    //     let paginationData
    //     let category_slug
    //     body.lang = lang;
    //     req.body.category_id = req.params.id
    //     req.body.lang = req.lang
    //
    //     let slugs = {}
    //
    //     let category = await productService.getCagegoryById(req.body.category_id)
    //
    //     let originCategoryId =  category .origin_id ?  category .origin_id :  category .id;
    //     let otherLangsIds = await productService.getAllCategoriesByFilter({ origin_id: originCategoryId });
    //     let otherLangsOriginalLinks = otherLangsIds.map((i,index) => `/shop/getCategory/${i.id}`);
    //     let originalLinksFilter = {
    //         [Op.in]: [`/shop/getCategory/${originCategoryId}`, ...otherLangsOriginalLinks]
    //     };
    //     let links = await linksService.getAllLinks({ original_link: originalLinksFilter });
    //     if(links && links.length){
    //         links.forEach((item,i)=>{
    //             if(item.lang == lang) category_slug = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
    //             slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
    //         })
    //     }
    //
    //     const id = req.user ? req.user.userid : null;
    //     let user, notificationsCount;
    //     if (id) {
    //         user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone','role','coeficient','retail_prices','discount']);
    //         user = user ? user.toJSON() : user;
    //         user = {...user };
    //         notificationsCount = await notificationService.countUserNotifications(id, lang);
    //     }
    //
    //     let discount = null
    //     if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
    //     if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
    //     if(discount && discount.value) discount = discount.value
    //
    //
    //
    //     let filterByCategory = await productService.filterCategories(req.body)
    //
    //     let header_footer = await menuService.getHeaderFooter(lang);
    //
    //     let menu = await menuService.getMenu(lang);
    //
    //
    //     let viewedProducts = req.viewedProducts;
    //     let product_history
    //     if (viewedProducts && viewedProducts.length) {
    //         let viewProd =  await productService.getViewedProductByIds(id, viewedProducts,lang);
    //         //viewProd = viewProd.map((item) =>item.toJSON())
    //         for(let i = 0; i< viewProd.length; i++){
    //             if(viewProd[i].type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
    //                 viewProd[i].price = null;
    //                 viewProd[i].discounted_price = null;
    //                 if(viewProd[i].product_variations && viewProd[i].product_variations.length){
    //                     let variationsName = viewProd[i].product_variations.find(item => !item.value);
    //                     if(variationsName && variationsName.name){
    //                         viewProd[i].product_variations
    //                             .filter(item => item.value)
    //                             .map((item, index) => {
    //                                 let k = item;
    //                                 if(k.price) k.price = Math.round(k.price/100);
    //                                 if(k.discounted_price) k.discounted_price = Math.round(k.discounted_price/100);
    //                                 if(k.name) delete k.name;
    //                                 if(index === 0){
    //                                     viewProd[i].price = product_discount_calc(user,k.price,discount);
    //                                     if(k.discounted_price) viewProd[i].discounted_price = product_discount_calc(user,k.discounted_price,discount);
    //                                 }
    //                                 return k
    //                             });
    //                     }
    //                 }
    //             } else {
    //                 //viewProd[i].price =  viewProd[i].price/100
    //                 if( viewProd[i].discounted_price){
    //                     //viewProd[i].discounted_price =  viewProd[i].discounted_price/100
    //                     viewProd[i].discounted_price = product_discount_calc(user,viewProd[i].discounted_price,discount)
    //                 }
    //                 viewProd[i].price = product_discount_calc(user,viewProd[i].price,discount)
    //             }
    //         }
    //         product_history = viewProd
    //     }
    //
    //     let filterByAttribute = await productService.filterByAttributes(req.body)
    //     let filterByAttrGroup = await productService.filterByAttrGroup(req.body)
    //     let filter = await productService.filterProducts(filterByAttribute, req.body,null,filterByCategory.where)
    //     let category_products = await productService.getProductsByCategory(filter.where, perPage, page, req.body.sortBy, filterByCategory.where,filterByAttrGroup.where,lang)
    //     for (let i = 0; i < category_products.data.length; i++) {
    //
    //         if(category_products.data[i].type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
    //             category_products.data[i].price = null;
    //             category_products.data[i].discounted_price = null;
    //             if(category_products.data[i].product_variations && category_products.data[i].product_variations.length){
    //                 let variationsName = category_products.data[i].product_variations.find(item => !item.value);
    //                 if(variationsName && variationsName.name){
    //                     category_products.data[i].product_variations
    //                         .filter(item => item.value)
    //                         .map((item, index) => {
    //                             let k = item;
    //                             if(k.price) k.price = Math.round(k.price/100);
    //                             if(k.discounted_price) k.discounted_price = Math.round(k.discounted_price/100);
    //                             if(k.name) delete k.name;
    //                             if(index === 0){
    //                                 category_products.data[i].price = product_discount_calc(user,k.price,discount);
    //                                 if(k.discounted_price )category_products.data[i].discounted_price = product_discount_calc(user,k.discounted_price,discount);
    //                             }
    //                             return k
    //                         });
    //                 }
    //             }
    //
    //         } else {
    //             category_products.data[i].price = category_products.data[i].price/100
    //             if(category_products.data[i].discounted_price){
    //                 category_products.data[i].discounted_price = category_products.data[i].discounted_price/100
    //                 category_products.data[i].discounted_price = product_discount_calc(user,category_products.data[i].discounted_price,discount)
    //             }
    //             category_products.data[i].price = product_discount_calc(user,category_products.data[i].price,discount)
    //         }
    //     }
    //
    //
    //
    //     let getAllPosibleAttrsAndOptions
    //     let getPosibleAttributes
    //     if(req.query.min_s || req.query.max_s || req.query.min_h || req.query.max_h || req.query.attributes || req.query.options){
    //         getPosibleAttributes = await productService.getAllProductsAttributes(filter.where, filterByCategory.where,filterByAttrGroup.where)
    //         getAllPosibleAttrsAndOptions = await groupAttrAndOptions(getPosibleAttributes[0])
    //     }
    //
    //
    //
    //
    //
    //     let getAttributes = await productService.getAllProductsAttributes({status: config.GLOBAL_STATUSES.ACTIVE,lang}, filterByCategory.where,null)
    //     let getAllAttrsAndOptions = await groupAttrAndOptions(getAttributes[0])
    //
    //
    //
    //
    //
    //
    //
    //     paginationData = await paginationUtil.pagination(countPages,category_products.count,perPage,page,minPage,maxPage,lastElem,isPaginationShow)
    //     let seoSection
    //     if(page =='1'){
    //         if (category.sections && category.sections[0].body[0]) {
    //             seoSection = category.sections[0].body[0]
    //         }
    //     }
    //
    //
    //     let min_s,max_s,min_h,max_h
    //
    //     if(req.query.min_s || req.query.max_s || req.query.min_h || req.query.max_h || req.query.attributes || req.query.options){
    //         min_s = getPosibleAttributes && getPosibleAttributes[1][0] ? getPosibleAttributes[1][0] : 0
    //         max_s = getPosibleAttributes && getPosibleAttributes[1][1] ? getPosibleAttributes[1][1] : 0
    //         min_h = getPosibleAttributes && getPosibleAttributes[1][2] ? getPosibleAttributes[1][2] : 0
    //         max_h = getPosibleAttributes && getPosibleAttributes[1][3] ? getPosibleAttributes[1][3] : 0
    //     } else {
    //         min_s = getAttributes && getAttributes[1][0] ? getAttributes[1][0] : 0
    //         max_s = getAttributes && getAttributes[1][1] ? getAttributes[1][1] : 0
    //         min_h = getAttributes && getAttributes[1][2] ? getAttributes[1][2] : 0
    //         max_h = getAttributes && getAttributes[1][3] ? getAttributes[1][3] : 0
    //     }
    //
    //
    //     let show_width_height = true
    //     if(config.HARDCODE_CATEGORIES_IDS.includes(+req.body.category_id)){
    //         show_width_height = false
    //     }
    //
    //
    //     log.info(`End getCategoryById`)
    //     let lightTheme = true
    //     res.render('client/category', {
    //         langs: req.langs,
    //         lang: lang,
    //         show_width_height,
    //         category_slug: category_slug,
    //         metaData: req.body.metaData,
    //         layout: 'client/layout.hbs',
    //         slugs,
    //         body:req.body,
    //         attributes: getAllAttrsAndOptions[0],
    //         options: getAllAttrsAndOptions[1],
    //         posibleAttrs: getAllPosibleAttrsAndOptions && getAllPosibleAttrsAndOptions[0] ? getAllPosibleAttrsAndOptions[0] : null,
    //         posibleOptions: getAllPosibleAttrsAndOptions && getAllPosibleAttrsAndOptions[1] ? getAllPosibleAttrsAndOptions[1] : null,
    //         product_history,
    //         categoriesPage: categoriesPage,
    //         homePage: homePage,
    //         category: category,
    //         products_count: category_products.count,
    //         category_products: category_products,
    //         min_s,
    //         max_s,
    //         min_h,
    //         max_h,
    //         menu,
    //         lastElem: paginationData.pagination.lastElem,
    //         page,
    //         lightTheme,
    //         countPages: paginationData.countPages,
    //         isPaginationShow: paginationData.isPaginationShow,
    //         pagination :  paginationData.pagination,
    //         header_footer: header_footer ? header_footer : null,
    //         user,
    //         cart,
    //         // favorite: favorite ? favorite : null,
    //         notificationsCount: notificationsCount ? notificationsCount: null,
    //         seoSection,
    //         activeAttr: req.body.attributes,
    //         activeOptions: req.body.options,
    //         isCategorySearch: true
    //     });
    //
    // },
    configurator: async (req, res) => {
        try {
            const lang = req.lang;
            const languages = config.LANGUAGES;
            const userId = req.user ? req.user.userid : null;
            let id = req.params.id;
            let favProducts = req.favProducts;
            let favProductsIds = favProducts;
            let favorite = favProducts && favProducts.length ? favProducts.length : 0;
            let cart = req.cart;
            let slugs = {};
            let user;
            let atrGroupSize;
            let configuratorTemplate = 'client/configurator';
            let sizes_from_detail = req.query
            let copy_configurator = req.query
            let result
            let default_atr_ids = [];
            if(Object.keys((sizes_from_detail)).length == 0 || !sizes_from_detail.from_detail) sizes_from_detail = false
            if(Object.keys((copy_configurator)).length == 0 || !copy_configurator.copy_values_from_configurator) copy_configurator = false
            if(!copy_configurator){
                if(sizes_from_detail && sizes_from_detail.default_atr && sizes_from_detail.default_atr.length){
                    default_atr_ids = sizes_from_detail.default_atr
                    result = await productService.getProductByslug({
                        [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                    }, false, true, default_atr_ids);
                }else {
                    result = await productService.getProductByslug({
                        [Op.or]: [{ id: id, lang: lang, status: config.GLOBAL_STATUSES.ACTIVE }, { origin_id: id, lang: lang, status: config.GLOBAL_STATUSES.ACTIVE }]
                    }, true, true);
                }

            } else {

                if(copy_configurator.default_atr && copy_configurator.default_atr.length) default_atr_ids = copy_configurator.default_atr;
                result = await productService.getProductByslug({
                    [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                }, false, true, default_atr_ids);

                if(default_atr_ids && default_atr_ids.length){
                    let originAtrValueIds = default_atr_ids.filter(item => item.originAtrValueId).map(item => Number(item.originAtrValueId));

                    if(originAtrValueIds && originAtrValueIds.length){
                        defaultAtrValue = await attributesService.getAttributesValues({
                            [Op.or]: [{ id: originAtrValueIds, lang: lang }, { origin_id: originAtrValueIds, lang: lang }]
                        })
                    }
                }
            }


            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            if (userId) {
                user = await userService.getUser(userId, ['id', 'first_name', 'last_name', 'email', 'phone','role','coeficient','retail_prices','discount']);
                user = user ? user.toJSON() : user;
                favProductsIds = await productService.getAllFavoritesProductIds(userId);
                favorite = favProductsIds && favProductsIds.length ? favProductsIds.length : 0;
            }
            let discount = null;
            if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
            if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
            if(discount && discount.value) discount = discount.value;

            let orig_dimensions
            let tempObj = {}
            if (result) {
                if(!copy_configurator){
                    if(user){
                        if(result.type == config.PRODUCT_TYPES.GLASS){
                            if(sizes_from_detail){
                                result = productPriceUtil.countPrice(result, false, false, sizes_from_detail.custom_s, sizes_from_detail.custom_h, user, discount);
                                Object.assign(tempObj, result)
                                orig_dimensions = productPriceUtil.countPrice(tempObj, false, false, null, null, user, discount);
                            } else result = productPriceUtil.countPrice(result, false, false, null, null, user, discount);

                        }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                            configuratorTemplate = 'client/configurator-shower';
                            if(sizes_from_detail){
                                result = productPriceUtil.countShowerPrice(result, false, false, sizes_from_detail.custom_s, sizes_from_detail.custom_h, sizes_from_detail.custom_l, sizes_from_detail.custom_l1, sizes_from_detail.custom_l2, sizes_from_detail.custom_m, sizes_from_detail.custom_d, user, discount,result.changedMat,result.changedMatAtrId);
                            } else result = productPriceUtil.countShowerPrice(result, false, false, null, null, null, null, null, null, null, user, discount,result.changedMat,result.changedMatAtrId);
                        }
                    }else{
                        if(result.type == config.PRODUCT_TYPES.GLASS){
                            if(sizes_from_detail){
                                result = productPriceUtil.countPrice(result, false, false,sizes_from_detail.custom_s, sizes_from_detail.custom_h);
                                orig_dimensions = getOriginalDimentions(result.base,result.mat,null,null,result.dimensions)
                            } else result = productPriceUtil.countPrice(result, false, false);
                        }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                            configuratorTemplate = 'client/configurator-shower';
                            if(sizes_from_detail){
                                result = productPriceUtil.countShowerPrice(result, false, false,sizes_from_detail.custom_s, sizes_from_detail.custom_h, sizes_from_detail.custom_l, sizes_from_detail.custom_l1, sizes_from_detail.custom_l2, sizes_from_detail.custom_m, sizes_from_detail.custom_d, user, discount,result.changedMat,result.changedMatAtrId);
                            } else result = productPriceUtil.countShowerPrice(result, false, false,null, null, null, null, null, null, null, user, discount,result.changedMat,result.changedMatAtrId);
                        }
                    }
                } else {
                    let { s, h, l, l1, l2, m, d } = req.query
                    if(user){
                        if(result.type == config.PRODUCT_TYPES.GLASS){
                            result = productPriceUtil.countPrice(result, false, false, s, h, user, discount);
                        }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                            configuratorTemplate = 'client/configurator-shower';
                            result = productPriceUtil.countShowerPrice(result, false, false, s, h, l, l1, l2, m, d, user, discount,result.changedMat,result.changedMatAtrId);
                        }
                    }else{
                        if(result.type == config.PRODUCT_TYPES.GLASS){
                            result = productPriceUtil.countPrice(result, false, false, s, h);
                        }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                            configuratorTemplate = 'client/configurator-shower';
                            result = productPriceUtil.countShowerPrice(result, false, false, s, h, l, l1, l2, m, d, null, null,result.changedMat,result.changedMatAtrId);
                        }
                    }
                    if(result.config_checkout && result.config_checkout.length){
                        for (let configCheckout of result.config_checkout) {
                            if(configCheckout && configCheckout.origin_id){
                                let atrValObj = default_atr_ids.find(item => item.originAtrId == configCheckout.origin_id);
                                if(atrValObj && atrValObj.originAtrValueId){
                                    let atrVal = defaultAtrValue.find(item => item.id == atrValObj.originAtrValueId || item.origin_id == atrValObj.originAtrValueId);
                                    if(atrVal && atrVal.value){
                                        configCheckout.value = atrVal.value;
                                    }
                                }

                            }
                        }
                    }
                }









                let originProductId = result.origin_id ? result.origin_id : result.id;
                result = modifyProduct(result);
                if (result.dimensions && result.dimensions.length) {
                    if(sizes_from_detail){
                        if(orig_dimensions && orig_dimensions && orig_dimensions.length){
                            result.dimensions = orig_dimensions
                            result.dimensions.forEach(item => item.is_default = false)
                        }
                        for (const dimension of result.dimensions) {
                            if(dimension && dimension.s && dimension.h){
                                if(dimension.s == result.default_s && dimension.h == result.default_h){
                                    dimension.is_default = true
                                }
                            }
                        }
                    }else {
                        let dimensions_text = [];
                        for (const dimension of result.dimensions) {
                            if(dimension && dimension.s && dimension.h) dimensions_text.push(`${dimension.s}x${dimension.h}`);
                        }
                        result.dimensions_text = dimensions_text.join();
                    }

                }
                let main_lightning_swicher_show,aditional_lightning_swicher_show,heater_swicher_show,lens_swicher_show
                if(result && result.steps && result.steps.length){
                    for(let step of result.steps){
                        if(step.attribute_groups && step.attribute_groups.length){
                            for(atrGr of step.attribute_groups){
                                for(let step2 of result.steps){
                                    if(step2.id == 7 || step2.origin_id == 7){ //Основна підсвітка
                                        if(step2.attribute_groups && step2.attribute_groups.length){
                                            for(atrGr2 of step2.attribute_groups){
                                                if(atrGr2.attributes && atrGr2.attributes){
                                                    if(atrGr2.type == 3){
                                                        for(let attr of atrGr2.attributes){
                                                            if(attr.is_default) main_lightning_swicher_show = true
                                                        }
                                                    }
                                                    else if(atrGr2.type == 4){
                                                        for(let attr of atrGr2.attributes){
                                                            if(attr.is_default) aditional_lightning_swicher_show = true
                                                        }
                                                    }

                                                }

                                            }
                                        }
                                    }
                                    if(step2.id == 10 || step2.origin_id == 10){ //Підігрів
                                        if(step2.attribute_groups && step2.attribute_groups.length){
                                            for(atrGr2 of step2.attribute_groups){
                                                if(atrGr2.attributes && atrGr2.attributes){
                                                    for(let attr of atrGr2.attributes){
                                                        if(attr.is_default) heater_swicher_show = true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(step2.id == 13 || step2.origin_id == 13){ //Косметична лінза
                                        if(step2.attribute_groups && step2.attribute_groups.length){
                                            for(atrGr2 of step2.attribute_groups){
                                                if(atrGr2.attributes && atrGr2.attributes){
                                                    for(let attr of atrGr2.attributes){
                                                        if(attr.is_default){
                                                            if(attr.id!=config.HARDCODE_LANS_ATR_WITH_NO_SWITCHER && attr.origin_id!=config.HARDCODE_LANS_ATR_WITH_NO_SWITCHER){
                                                                lens_swicher_show = true
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
                }
                for(let step of result.steps){
                    if(step.id == 25 || step.origin_id == 25){
                        if(step.attribute_groups && step.attribute_groups.length){
                            for(atrGr of step.attribute_groups){
                                if(atrGr.id == 8 || atrGr.origin_id == 8){
                                    if(main_lightning_swicher_show) atrGr.switcher = true
                                }
                                if(atrGr.id == 95 || atrGr.origin_id == 95){
                                    if(aditional_lightning_swicher_show) atrGr.switcher = true
                                }
                                if(atrGr.id == 98 || atrGr.origin_id == 98){
                                    if(lens_swicher_show) atrGr.switcher = true
                                }
                                if(atrGr.id == 101 || atrGr.origin_id == 101){
                                    if(heater_swicher_show) atrGr.switcher = true
                                }
                            }
                        }
                    }
                    if(step.id == config.MIRROR_COLOR_STEP_ORIGIN_ID || step.origin_id == config.MIRROR_COLOR_STEP_ORIGIN_ID){
                        for(let atrGr of step.attribute_groups){
                            if(atrGr.id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID || atrGr.origin_id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                                for(let attr of atrGr.attributes){
                                    if(attr.is_default){
                                        let originAttrId = attr.origin_id ? attr.origin_id : attr.id
                                        let originProdId = result.origin_id ? result.origin_id : result.id
                                        let attribute = await productService.getProdToAtrByFilter({attribute_id: originAttrId,product_id:originProdId })
                                        if(attribute.image){
                                            result.image = attribute.image
                                            result.is_color = true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if(!main_lightning_swicher_show && !aditional_lightning_swicher_show && !heater_swicher_show && !lens_swicher_show){
                    for(let step of result.steps){
                        if(step.id == 25 || step.origin_id == 25){
                            step.no_switchers = true
                        }
                    }
                }
                let otherLangsIds = await productService.getAllProductsByFilter({ origin_id: originProductId });
                let otherLangsOriginalLinks = otherLangsIds.map((i,index) => `/configurator/${i.id}`);
                let originalLinksFilter = [`configurator/${originProductId}`, ...otherLangsOriginalLinks];
                originalLinksFilter.forEach((item,i)=>{
                    slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item}` : `/${languages[i]}${item}`
                })
                result.slug = await linksService.getLinkObjByFilter({ original_link: `/shop/getProduct/${result.id}`,lang });
                if(result && result.slug) result.slug = lang === config.LANGUAGES[0] ? `${result.slug.slug}` : `${lang}/${result.slug.slug}`;

                if(result.type == config.PRODUCT_TYPES.GLASS){
                    atrGroupSize = await attributesGroupsService.getAttributeGroupByFilter({ [Op.or]: [{ id: 28, lang: lang }, { origin_id: 28, lang: lang }] },null, true);
                    if(atrGroupSize.attribute_groups && atrGroupSize.attribute_groups.length && atrGroupSize.attribute_groups[0] && atrGroupSize.attribute_groups[0].video_links) {
                        atrGroupSize.attribute_groups[0].video_links = JSON.parse(atrGroupSize.attribute_groups[0].video_links);
                    }
                } else if (result.type == config.PRODUCT_TYPES.SHOWER){
                    atrGroupSize = await attributesGroupsService.getAttributeGroupByFilter({ [Op.or]: [{ id: 79, lang: lang }, { origin_id: 79, lang: lang }] },null, true);
                    if(atrGroupSize.attribute_groups && atrGroupSize.attribute_groups.length && atrGroupSize.attribute_groups[0] && atrGroupSize.attribute_groups[0].video_links) {
                        atrGroupSize.attribute_groups[0].video_links = JSON.parse(atrGroupSize.attribute_groups[0].video_links);
                    }
                }

                if(result.category){
                    let categ = result.category.find(item => item.configurator_image);
                    result.configurator_image = categ && categ.configurator_image ? categ.configurator_image : null;

                }


            }else{
                res.status(403);
                configuratorTemplate = './404';
            }

            let homepage = await pagesService.getPage({ lang, template: "homepage" },null,lang)
            if(homepage){
                const link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(homepage.type, homepage.id, homepage.template, lang),lang })
                if(link) homepage.link = link.toJSON();
            }
            let info_popup_obj = {}

            if(result && result.type == config.PRODUCT_TYPES.SHOWER){
                let prod_informer
                if(result.informer && result.informer.length) prod_informer = result.informer
                Object.assign(info_popup_obj,config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type])

                let ids = []
                for(let key in info_popup_obj){
                    ids.push(info_popup_obj[key])
                }
                let getAllAttrGr = await attributesGroupsService.getAttributeGroupAllByFilter(
                    { [Op.or]: [{ id: ids, lang: lang },
                            { origin_id: ids, lang: lang }]
                    });
                if(getAllAttrGr && getAllAttrGr.length) getAllAttrGr = getAllAttrGr.map(item => item.toJSON())
                for(let item in info_popup_obj){
                    getAllAttrGr.forEach(el => {
                        let origElId = el.origin_id ? el.origin_id : el.id
                        //let value = config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type][origElId]
                        let value = Object.keys(config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type])
                            .find(key => config.HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE[result.shower_type][key] === origElId);
                        if(prod_informer && prod_informer.length){
                            for(let item of prod_informer){
                                if((item.value == value) && item.hint_text && item.title){
                                    info_popup_obj[value] = value
                                }
                            }
                        } else {
                            if(lang ==config.LANGUAGES[0]){
                                if(el.id == info_popup_obj[item]){
                                    if(!el.title || !el.hint_text){
                                        delete info_popup_obj[item]
                                    }
                                }
                            } else {
                                if(el.origin_id == info_popup_obj[item]){
                                    if(!el.title || !el.hint_text){
                                        delete info_popup_obj[item]
                                    }
                                }
                            }
                        }



                    })
                }
            }

            if(result && result.config_checkout && result.config_checkout.length){
                let arr = []
                for(let item of result.config_checkout){
                    let isPush = true
                    if(item.gr_attr_origin_id == config.SHELF_TYPE_GR_ATTR_ID){
                        if(item.selectValue && item.selectValue.value && item.value == item.selectValue.value) item.value = null
                        for(let el of result.config_checkout){
                            if(el.gr_attr_origin_id == config.SHELF_COUNT_GR_ATTR_ID){
                                if(el.discounted_price){
                                    item.count_price += el.discounted_price
                                } else {
                                    item.count_price += el.count_price
                                }
                            }
                        }
                    }
                    if(item.gr_attr_origin_id == config.SHELF_COUNT_GR_ATTR_ID){
                        isPush = false
                    }
                    if(isPush) arr.push(item)
                }
                result.config_checkout = arr
            }

            let renderHeader = 'client/layout.hbs';

            // res.json(result);

            let browserPageName

            switch (lang) {
                case 'uk':
                    browserPageName = "Конфігуратор"
                    break;
                case 'ru':
                    browserPageName = "Конфигуратор"
                    break;
                case 'en':
                    browserPageName = "Configurator"
                    break;
                default:
                    break;
            }

            let homePage = {}
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                homepageLink = homepageLink.toJSON()
                homePage.slug = homepageLink.slug
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }

            res.render(configuratorTemplate, {
                langs: req.langs,
                lang: lang,
                info_popup_obj,
                layout: renderHeader,
                metaData: req.body.metaData,
                result: result,
                favorite: favorite ? favorite : null,
                first_name: user ? user.first_name : null,
                last_name: user ? user.last_name : null,
                header_footer: header_footer ? header_footer : null,
                menu: menu ? menu : null,
                isConfigurator: true,
                cart: cart,
                browserPageName: browserPageName,
                user,
                homepage,
                slugs,
                atrGroupSize: atrGroupSize,
                homePage
            });

        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    configuratorAjax: async (req, res) => {
        log.info(`Start configuratorAjax data:${JSON.stringify(req.body)}`)
        try {
            let { id, s, h, l, l1, l2, m, d, default_atr, step_size, isDeleteStep } = req.body;
            //TODO validation
            if(!id){
                return res.status(errors.BAD_REQUEST_INVALID_BODY_REQUEST.code).json({
                    message: errors.BAD_REQUEST_INVALID_BODY_REQUEST.message,
                    errCode: errors.BAD_REQUEST_INVALID_BODY_REQUEST.code
                });
            }
            const lang = req.lang;
            const languages = config.LANGUAGES;
            const userId = req.user ? req.user.userid : null;
            let user;
            let reviewHtml;
            let stepHtml={};
            let default_atr_ids = [];
            let defaultAtrValue = [];
            if(default_atr && default_atr.length) default_atr_ids = default_atr;

            let result = await productService.getProductByslug({
                [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
            }, false, true, default_atr_ids);

            if(default_atr_ids && default_atr_ids.length){
                let originAtrValueIds = default_atr_ids.filter(item => item.originAtrValueId).map(item => Number(item.originAtrValueId));

                if(originAtrValueIds && originAtrValueIds.length){
                    defaultAtrValue = await attributesService.getAttributesValues({
                        [Op.or]: [{ id: originAtrValueIds, lang: lang }, { origin_id: originAtrValueIds, lang: lang }]
                    })
                }
            }

            if (userId) {
                user = await userService.getUser(userId, ['id', 'first_name', 'last_name', 'email', 'phone','role','coeficient','retail_prices','discount']);
                user = user ? user.toJSON() : user;
                favProductsIds = await productService.getAllFavoritesProductIds(userId);
                favorite = favProductsIds && favProductsIds.length ? favProductsIds.length : 0;
            }
            let discount = null;
            if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
            if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
            if(discount && discount.value) discount = discount.value;

            if (result) {
                if(user){
                    if(result.type == config.PRODUCT_TYPES.GLASS){
                        result = productPriceUtil.countPrice(result, false, false, s, h, user, discount,isDeleteStep);
                    }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                        result = productPriceUtil.countShowerPrice(result, false, false, s, h, l, l1, l2, m, d, user, discount,result.changedMat,result.changedMatAtrId,isDeleteStep);
                    }
                }else{
                    if(result.type == config.PRODUCT_TYPES.GLASS){
                        result = productPriceUtil.countPrice(result, false, false, s, h,null,null,isDeleteStep);
                    }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                        result = productPriceUtil.countShowerPrice(result, false, false, s, h, l, l1, l2, m, d, null, null,result.changedMat,result.changedMatAtrId,isDeleteStep);
                    }
                }

                if(result.config_checkout && result.config_checkout.length){
                    for (let configCheckout of result.config_checkout) {
                        if(configCheckout && configCheckout.origin_id){
                            let atrValObj = default_atr_ids.find(item => item.originAtrId == configCheckout.origin_id);
                            if(atrValObj && atrValObj.originAtrValueId){
                                let atrVal = defaultAtrValue.find(item => item.id == atrValObj.originAtrValueId || item.origin_id == atrValObj.originAtrValueId);
                                if(atrVal && atrVal.value){
                                    configCheckout.value = atrVal.value;
                                }
                            }

                        }
                    }
                }

                //if(result.price) result.price = (result.price/100).toFixed(0);
                //if(result.discounted_price) result.discounted_price = (result.discounted_price/100).toFixed(0);
                result = modifyProduct(result);
                result.new_image_path = null
                let main_lightning_swicher_show,aditional_lightning_swicher_show,heater_swicher_show,lens_swicher_show
                if(result && result.steps && result.steps.length){
                    for(let step of result.steps){
                        if(step.attribute_groups && step.attribute_groups.length){
                            for(atrGr of step.attribute_groups){
                                for(let step2 of result.steps){
                                    if(step2.id == 7 || step2.origin_id == 7){ //Основна підсвітка
                                        if(step2.attribute_groups && step2.attribute_groups.length){
                                            for(atrGr2 of step2.attribute_groups){
                                                if(atrGr2.attributes && atrGr2.attributes){
                                                    if(atrGr2.type == 3){
                                                        for(let attr of atrGr2.attributes){
                                                            if(attr.is_default) main_lightning_swicher_show = true
                                                        }
                                                    }
                                                    else if(atrGr2.type == 4){
                                                        for(let attr of atrGr2.attributes){
                                                            if(attr.is_default) aditional_lightning_swicher_show = true
                                                        }
                                                    }

                                                }

                                            }
                                        }
                                    }
                                    if(step2.id == 10 || step2.origin_id == 10){ //Підігрів
                                        if(step2.attribute_groups && step2.attribute_groups.length){
                                            for(atrGr2 of step2.attribute_groups){
                                                if(atrGr2.attributes && atrGr2.attributes){
                                                    for(let attr of atrGr2.attributes){
                                                        if(attr.is_default) heater_swicher_show = true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(step2.id == 13 || step2.origin_id == 13){ //Косметична лінза
                                        if(step2.attribute_groups && step2.attribute_groups.length){
                                            for(atrGr2 of step2.attribute_groups){
                                                if(atrGr2.attributes && atrGr2.attributes){
                                                    for(let attr of atrGr2.attributes){
                                                        if(attr.is_default){
                                                            if(attr.id!=config.HARDCODE_LANS_ATR_WITH_NO_SWITCHER && attr.origin_id!=config.HARDCODE_LANS_ATR_WITH_NO_SWITCHER){
                                                                lens_swicher_show = true
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
                }
                let changedMainImage = false

                for(let step of result.steps){
                    if(step.id == 25 || step.origin_id == 25){
                        if(step.attribute_groups && step.attribute_groups.length){
                            for(atrGr of step.attribute_groups){
                                if(atrGr.id == 8 || atrGr.origin_id == 8){
                                    if(main_lightning_swicher_show) atrGr.switcher = true
                                }
                                if(atrGr.id == 95 || atrGr.origin_id == 95){
                                    if(aditional_lightning_swicher_show) atrGr.switcher = true
                                }
                                if(atrGr.id == 98 || atrGr.origin_id == 98){
                                    if(lens_swicher_show) atrGr.switcher = true
                                }
                                if(atrGr.id == 101 || atrGr.origin_id == 101){
                                    if(heater_swicher_show) atrGr.switcher = true
                                }
                            }

                        }
                    }
                    if(step.id == config.MIRROR_COLOR_STEP_ORIGIN_ID || step.origin_id == config.MIRROR_COLOR_STEP_ORIGIN_ID){
                        for(let atrGr of step.attribute_groups){
                            if(atrGr.id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID || atrGr.origin_id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                                for(let attr of atrGr.attributes){
                                    if(attr.is_default){
                                        let originAttrId = attr.origin_id ? attr.origin_id : attr.id
                                        let originProdId = result.origin_id ? result.origin_id : result.id
                                        let attribute = await productService.getProdToAtrByFilter({attribute_id: originAttrId,product_id:originProdId })
                                        if(attribute.image){
                                            result.new_image_path = imagePath(attr.image, null, 1)
                                            changedMainImage = true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if(!changedMainImage) result.new_image_path = imagePath(result.image, '930X930', 1)
                if(!main_lightning_swicher_show && !aditional_lightning_swicher_show && !heater_swicher_show && !lens_swicher_show){
                    for(let step of result.steps){
                        if(step.id == 25 || step.origin_id == 25){
                            step.no_switchers = true
                        }
                    }
                }

                if(result && result.config_checkout && result.config_checkout.length){
                    let arr = []
                    for(let item of result.config_checkout){
                        let isPush = true
                        if(item.gr_attr_origin_id == config.SHELF_TYPE_GR_ATTR_ID){
                            if(item.selectValue && item.selectValue.value && item.value == item.selectValue.value) item.value = null
                            for(let el of result.config_checkout){
                                if(el.gr_attr_origin_id == config.SHELF_COUNT_GR_ATTR_ID){
                                    if(el.discounted_price){
                                        item.count_price += el.discounted_price
                                    } else {
                                        item.count_price += el.count_price
                                    }
                                }
                            }
                        }
                        if(item.gr_attr_origin_id == config.SHELF_COUNT_GR_ATTR_ID){
                            isPush = false
                        }
                        if(isPush) arr.push(item)
                    }
                    result.config_checkout = arr
                }

                if(result.type == config.PRODUCT_TYPES.GLASS){
                    reviewHtml = await templateUtil.getTemplate({
                        result: result,
                        lang
                    }, 'client/steps/configurator-review');

                    if(result.steps && result.steps.length){
                        for (let step of result.steps) {
                            let origStId = step.origin_id ? step.origin_id : step.id;
                            stepHtml[`originStep${origStId}`]= await templateUtil.getTemplate({
                                step: step,
                                lang
                            }, 'client/steps/configurator-steps');
                        }
                    }

                }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                    reviewHtml = await templateUtil.getTemplate({
                        result: result,
                        lang
                    }, 'client/steps/configurator-review-shower');

                    if(result.steps && isDeleteStep && result.steps.length){
                        for (let step of result.steps) {
                            let origStId = step.origin_id ? step.origin_id : step.id;
                            stepHtml[`originStep${origStId}`]= await templateUtil.getTemplate({
                                step: step,
                                lang
                            }, 'client/steps/configurator-steps-shower');
                        }
                    }

                }
            }

            res.json({
                reviewHtml: reviewHtml,
                price: result && result.price ? result.price : '',
                discounted_price: result && result.discounted_price ? result.discounted_price : '',
                stepHtml:stepHtml,
                price_without_option_price: result.price_without_option_price ? result.price_without_option_price :'',
                new_image_path: result && result.new_image_path ? result.new_image_path : null,
            })

        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },

    compositeImg: async (req, res) => {
        log.info(`Start compositeImg data:${JSON.stringify(req.body)}`)
        try {

            let { mainImg, compositeArr  } = req.body;

            if(!mainImg || !compositeArr || !compositeArr.length){
                return res.status(200).json({
                    message: errors.BAD_REQUEST_INVALID_BODY_REQUEST.message,
                    errCode: errors.BAD_REQUEST_INVALID_BODY_REQUEST.code
                });
            }
            let img = await productCompositeImagesUtil(mainImg, compositeArr);
            log.info(`End compositeImg`)
            res.end(img);

        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    configuratorPopup: async (req, res) => {
        log.info(`Start configuratorPopup data:${JSON.stringify(req.body)}`)
        try {
            let atrGr
            let { id, lang, product_id } = req.body;
            let values_from_product = ['l','l1','l2','m','d','s','h']
            if(!lang) lang = config.LANGUAGES[0];

            if(values_from_product.includes(id)){
                let getProduct = await productService.getOnlyProductById({ [Op.or]: [{ id: product_id, lang: lang }, { origin_id: product_id, lang: lang }] })
                if(getProduct.informer){
                    getProduct.informer = JSON.parse(getProduct.informer)
                    if(getProduct.informer.length){
                        for(let item of getProduct.informer){
                            if((item.value == id)){
                                let find = getProduct.informer.find(el => el.value == id)
                                if(find){
                                    let obj = {
                                        title : find.title,
                                        hint_text : find.hint_text,
                                        video_links : find.video_links
                                    }
                                    atrGr = obj
                                }

                            }
                        }
                    }
                }
            } else {
                atrGr = await attributesGroupsService.getAtrGrByFilter({ [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }] });
                if(atrGr && atrGr.video_links){
                    atrGr.video_links = JSON.parse(atrGr.video_links);
                    if(atrGr.type == 10){
                        let step = await attributesGroupsService.getStepByFilter({id:atrGr.step_id})
                        atrGr.step = step.toJSON()
                    }
                }
            }

            let html = await templateUtil.getTemplate({
                atrGr: atrGr
            }, 'client/steps/configurator-popup');

            res.json({ html: html })

        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
}
