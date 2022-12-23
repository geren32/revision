const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const Sequelize = require('sequelize');
const adminChangesHistoryService = require('./admin-changes-history.service');
const { Op } = Sequelize;
const config = require('../configs/config');
const pagesService = require('./pages.service');
const extraUtil = require("../utils/extra-util");
const linksService = require('./links.service');
const categorieService = require('./categorie.service');
const promotionsService = require('./promotions.service')
const log = require('../utils/logger');
const formsService = require('./forms.service');

const ucFirst = (str) => {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}
const recursiveMenuBody = async(object, lang) => {
    let i, result = [];
    for (i of object) {

        i.name = i.text;
        if (i.imageId) {
            let image = await models.uploaded_files.findOne({ where: { id: i.imageId } })

            //   i.image = image.filename ?  image.filename : ''
            //    i.alt = image.alt_text ? image.alt_text: ''
            //   i.description = image.description ? image.description : ''
        }
        if (!i.link) {
            const filter = {
                [Op.or]: [{ id: i.pageId }, { origin_id: i.pageId }],
                lang: lang
            };
            if (i.pageType === 'page') {
                i.link = await models.pages.findOne({ where: filter })
            } else if (i.pageType === 'post') {
                i.link = await models.posts.findOne({ where: filter })
            }
            if (i.link) i.link = `/${i.link.slug}`;
        }

        if (i.children && i.children.length > 0) {
            i.children = await recursiveMenuBody(i.children, lang)
            await result.push(i);
        } else {
            await result.push(i)
        }
    }
    return result;
}




module.exports = {
    saveHeaderFooter: async(data, lang, trans) => {
        log.info(`Start saveHeaderFooter service data:${JSON.stringify(data, lang)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.configs.update(data, { where: { type: 'header_footer', lang: lang }, transaction });
            let result = await models.configs.findOne({
                where: { type: 'header_footer', lang: lang },
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End saveHeaderFooter service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    // updateCurrency: async(data) => {
    //     await models.configs.update({ value: JSON.stringify(data) }, { where: { type: 'currency' } });
    //     let resultConfigs = await models.configs.findOne({ where: { type: 'currency' } })
    //     resultConfigs = resultConfigs.toJSON();
    //     let result = {}
    //     if (resultConfigs.value) {
    //         result.currency = JSON.parse(resultConfigs.value)
    //     }
    //     return result
    // },
    // getCurrency: async(currency) => {
    //     if (currency === 0) {
    //         return 1
    //     }
    //     currency = config.CURRENCY_CODE[currency]

    //     let { value } = await models.configs.findOne({ where: { type: `currency_${currency}` }, raw: true });
    //     let currencyValue = parseFloat(value);
    //     return currencyValue
    // },
    getHeaderFooterAdmin: async(lang, trans) => {
        log.info(`Start getHeaderFooterAdmin service data:${JSON.stringify(lang)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.configs.findOne({
                where: { type: 'header_footer', lang: lang },
                transaction
            });
            if (result) {
                result = result.toJSON();
                result.value = JSON.parse(result.value);

                if(result.value[0].email){
                    result.email = result.value[0].email;
                }
                if(result.value[0].email_icon_id){
                    result.email_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].email_icon_id, lang: result.lang }, { origin_id: result.value[0].email_icon_id, lang: result.lang }] }, transaction });
                }

                if(result.value[0].copyright){
                    result.copyright = result.value[0].copyright;
                }
                if(result.value[0].phone){
                    result.phone =result.value[0].phone;
                }

                if (result.value[0].phone_icon_id) {
                    result.phone_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].phone_icon_id, lang: result.lang }, { origin_id: result.value[0].phone_icon_id, lang: result.lang }] }, transaction });
                }
                if (result.value[0].schedule_icon_id) {
                    result.schedule_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].schedule_icon_id, lang: result.lang }, { origin_id: result.value[0].schedule_icon_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].schedule){
                    result.schedule= result.value[0].schedule
                }
                if (result.value[0].header_logo_id) {
                    result.header_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].header_logo_id, lang: result.lang }, { origin_id: result.value[0].header_logo_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].phone){
                    result.phone = result.value[0].phone;
                }
                if(result.value[0].phone_footer){
                    result.phone_footer = result.value[0].phone_footer;
                }
                if (result.value[0].phone_icon_footer_id) {
                    result.phone_icon_footer = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].phone_icon_footer_id, lang: result.lang }, { origin_id: result.value[0].phone_icon_footer_id, lang: result.lang }] }, transaction });
                }
                if (result.value[0].footer_logo_id) {
                    result.footer_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].footer_logo_id, lang: result.lang }, { origin_id: result.value[0].footer_logo_id, lang: result.lang }] }, transaction });
                }
                if (result.value[0].partner_logo_id) {
                    result.partner_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].partner_logo_id, lang: result.lang }, { origin_id: result.value[0].partner_logo_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].footer_map_link){
                    result.footer_map_link = result.value[0].footer_map_link
                }
                if (result.value[0].social_network && JSON.parse(result.value[0].social_network).length) {
                    // result.social_network = JSON.stringify(result.value[0].social_network)
                    // result.social_network = JSON.stringify(result.social_network)
                    // console.log(result.social_network,'5658698798563454647689789')
                    result.social_network = JSON.parse(result.value[0].social_network);
                    for (let social of result.social_network) {
                        social.icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: social.icon, lang: result.lang }, { origin_id: social.icon, lang: result.lang }] }, transaction });
                    }
                }

                // result.history = await adminChangesHistoryService.adminFindAllHistory({
                //     type: 'header_footer',
                //     item_id: result.id,
                //     created_at: {
                //         [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                //     }
                // }, transaction);

                // result.history = await models.admin_changes_history.findAll({where: {type:'header_footer', item_id: result.id, created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
                result.logo_link = await models.pages.findOne({where:{lang:lang,template:'homepage'},raw:true,attributes:['id']})
                if(result.logo_link){
                    result.logo_link = await models.links.findOne({where:{original_link:`/getPage/${result.logo_link.id}`},raw:true,attributes:['slug']})
                    if(result.logo_link){
                        result.logo_link = result.logo_link.slug
                    }
                }
                result.cookie_popup = await models.configs.findOne({ where: { type: 'cookie_popup', lang: lang }, raw: true, transaction });
                if(result.cookie_popup) result.cookie_popup = JSON.parse(result.cookie_popup.value);

                // if(result.phones_icon && JSON.parse(result.social_network).length) {
                //     result.social_network = JSON.parse(result.social_network);
                //     for (let social of result.social_network) {
                //         social.phones_icon = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: social.phones_icon, lang: result.lang }, { origin_id: social.icon, lang: result.lang } ] }, transaction });
                //     }
                // }

            }
            if (!trans) await transaction.commit();
            log.info(`End getHeaderFooterAdmin service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getHeaderFooter: async(lang, trans) => {
        log.info(`Start getHeaderFooter service data:${JSON.stringify(lang)}`)
        let transaction = null;
        try {

            transaction = trans ? trans : null;

            let result = await models.configs.findOne({
                where: { type: 'header_footer', lang: lang },
                // include: [
                //     { model: models.uploaded_files, as: 'phone_icon' },
                //     { model: models.uploaded_files, as: 'header_image' },
                //     { model: models.uploaded_files, as: 'schedule_icon' },
                //     { model: models.uploaded_files, as: 'header_logo' },
                //     { model: models.uploaded_files, as: 'footer_logo' },
                //     { model: models.uploaded_files, as: 'address_icon' },
                //     { model: models.uploaded_files, as: 'email_icon' },
                // ],
                transaction
            });

            if (result) {
                result = result.toJSON();
                result.value = JSON.parse(result.value);


                if(result.value[0].address){
                    result.address =result.value[0].address;
                }

                // result.phones = result.phones ? JSON.parse(result.phones) : null
                if(result.value[0].address_icon_id){
                    result.address_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].address_icon_id, lang: result.lang }, { origin_id: result.value[0].address_icon_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].email){
                    result.email = result.value[0].email;
                }
                if(result.value[0].email_icon_id){
                    result.email_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].email_icon_id, lang: result.lang }, { origin_id: result.value[0].email_icon_id, lang: result.lang }] }, transaction });
                }

                if(result.value[0].copyright){
                    result.copyright = result.value[0].copyright;
                }
                if(result.value[0].phone){
                    result.phone =result.value[0].phone;
                }

                if (result.value[0].phone_icon_id) {
                    result.phone_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].phone_icon_id, lang: result.lang }, { origin_id: result.value[0].phone_icon_id, lang: result.lang }] }, transaction });
                }
                if (result.value[0].schedule_icon_id) {
                    result.schedule_icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].schedule_icon_id, lang: result.lang }, { origin_id: result.value[0].schedule_icon_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].schedule){
                    result.schedule= result.value[0].schedule
                }
                if (result.value[0].header_logo_id) {
                    result.header_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].header_logo_id, lang: result.lang }, { origin_id: result.value[0].header_logo_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].phone){
                    result.phone = result.value[0].phone;
                }
                if(result.value[0].phone_footer){
                    result.phone_footer = result.value[0].phone_footer;
                }
                if (result.value[0].phone_icon_footer_id) {
                    result.phone_icon_footer = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].phone_icon_footer_id, lang: result.lang }, { origin_id: result.value[0].phone_icon_footer_id, lang: result.lang }] }, transaction });
                }
                if (result.value[0].footer_logo_id) {
                    result.footer_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].footer_logo_id, lang: result.lang }, { origin_id: result.value[0].footer_logo_id, lang: result.lang }] }, transaction });
                }
                if (result.value[0].partner_logo_id) {
                    result.partner_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.value[0].partner_logo_id, lang: result.lang }, { origin_id: result.value[0].partner_logo_id, lang: result.lang }] }, transaction });
                }
                if(result.value[0].footer_map_link){
                    result.footer_map_link = result.value[0].footer_map_link
                }
                //    if(result.value[0].address){
                //        result.address = result.value[0].address
                //    }
                //     if (result.header_logo4_id) {
                //         result.logo4 = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.header_logo4_id, lang: result.lang }, { origin_id: result.header_logo4_id, lang: result.lang }] }, transaction });
                //     }
                //     if (result.header_logo5_id) {
                //         result.logo5 = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.header_logo5_id, lang: result.lang }, { origin_id: result.header_logo5_id, lang: result.lang }] }, transaction });
                //     }
                //     if (result.header_logo6_id) {
                //         result.logo6 = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.header_logo6_id, lang: result.lang }, { origin_id: result.header_logo6_id, lang: result.lang }] }, transaction });
                //     }
                //     if (result.footer_logo_id) {
                //         result.footer_logo = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.footer_logo_id, lang: result.lang }, { origin_id: result.footer_logo_id, lang: result.lang }] }, transaction });
                //     }
                if (result.value[0].social_network && JSON.parse(result.value[0].social_network).length) {
                    // result.social_network = JSON.stringify(result.value[0].social_network)
                    // result.social_network = JSON.stringify(result.social_network)
                    // console.log(result.social_network,'5658698798563454647689789')
                    result.social_network = JSON.parse(result.value[0].social_network);
                    for (let social of result.social_network) {
                        social.icon = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: social.icon, lang: result.lang }, { origin_id: social.icon, lang: result.lang }] }, transaction });
                    }
                }

                // result.history = await adminChangesHistoryService.adminFindAllHistory({
                //     type: 'header_footer',
                //     item_id: result.id,
                //     created_at: {
                //         [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                //     }
                // }, transaction);

                // result.history = await models.admin_changes_history.findAll({where: {type:'header_footer', item_id: result.id, created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
                result.logo_link = await models.pages.findOne({where:{lang:lang,template:'homepage'},raw:true,attributes:['id']})
                if(result.logo_link){
                    result.logo_link = await models.links.findOne({where:{original_link:`/getPage/${result.logo_link.id}`},raw:true,attributes:['slug']})
                    if(result.logo_link){
                        result.logo_link = result.logo_link.slug
                    }
                }
                result.cookie_popup = await models.configs.findOne({ where: { type: 'cookie_popup', lang: lang }, raw: true, transaction });
                if(result.cookie_popup) result.cookie_popup = JSON.parse(result.cookie_popup.value);

                // if(result.phones_icon && JSON.parse(result.social_network).length) {
                //     result.social_network = JSON.parse(result.social_network);
                //     for (let social of result.social_network) {
                //         social.phones_icon = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: social.phones_icon, lang: result.lang }, { origin_id: social.icon, lang: result.lang } ] }, transaction });
                //     }
                // }

            }
            // if (!trans) await transaction.commit();

            log.info(`End getHeaderFooter service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            // if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    saveMenu: async(data, lang, trans) => {
        log.info(`Start saveMenu service data:${JSON.stringify(data, lang)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.configs.update({ value: data}, { where: { type: 'menu', lang: lang }, transaction });
            let result = await models.configs.findOne({ where: { type: 'menu', lang: lang }, attributes: ['updated_at', 'value', 'id'], transaction });
            if (!trans) await transaction.commit();
            log.info(`End saveMenu service data:${JSON.stringify(result)}`)
            return result.toJSON();
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getMenuAdmin: async(lang, trans) => {
        log.info(`Start getMenuAdmin service data:${JSON.stringify(lang)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.configs.findOne({ where: { type: 'menu', lang: lang },raw:true, transaction });
            if (result) {
                result.history = await adminChangesHistoryService.adminFindAllHistory({
                    type: 'menu',
                    item_id: result.id,
                    created_at: {
                        [Op.gte]: (Date.now() - config.TIME_CONST)
                    }
                }, transaction);
                // result.history = await models.admin_changes_history.findAll({where: {type:'menu', item_id: result.id, created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
            }
            if (!trans) await transaction.commit();
            log.info(`End getMenuAdmin service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getMenu: async(lang) => {
        log.info(`Start getMenu service data:${JSON.stringify(lang)}`)
        try {
            let menu = {};
            let result = await models.configs.findOne({ where: { type: 'menu'} });
            if(result){
                result = result.toJSON();


                // menu.catalog = await models.product_category.findAll({
                //     where: {status: config.GLOBAL_STATUSES.ACTIVE, lang: lang},
                //     attributes:['title','image_id'],
                //     include: [{model: models.uploaded_files, as: 'image'}],
                //     raw: true,
                //     nest: true,
                //     order:[["position","ASC"]]
                // });
                //console.log(result)
                //console.log("**************************************************************************************************")

                for (let item of JSON.parse(result.value)) {

                    let menu_result = [];
                    if (item.body) {
                        for (let body_menu of item.body) {
                            let body = {};

                            if (!body_menu.link && body_menu.type) {
                                //let page = await pagesService.getPageByFilter({ id: body_menu.id, origin_id: 0 })
                                let page = await pagesService.getPageByFilter({ id: body_menu.id })
                                if (page) {
                                    //console.log(page)
                                    let link = await extraUtil.generateLinkUrlForPage(page.type, page.id, page.template,lang)
                                    //console.log(link)
                                    let link_slug = await linksService.getLinkByFilter({ original_link: link })
                                    if(link_slug)link_slug = link_slug.toJSON()
                                    if (link_slug && link_slug.slug == "/") {
                                        body.link = `${link_slug.slug}`
                                    } else if (link_slug && link_slug.slug != "/") {
                                        //body.link = `/${link.slug}`
                                        body.link = `/${link_slug.slug}`
                                    } else {
                                        link = await models.links.findOne({ where: { original_link: `${lang !== config.LANGUAGES[0] ? `/${lang}` : ''}/blog/` + body_menu.id, type: body_menu.type } })
                                        if (link) {
                                            body.link = `/${link.slug}`
                                        } else {
                                            body.link = `/`
                                        }
                                    }
                                } else {
                                    let link_slug = await linksService.getLinkByFilter({ original_link: `${lang !== config.LANGUAGES[0] ? `/${lang}` : ''}/shop/getCategory/${body_menu.id}` })
                                    if(link_slug)  body.link = `/${link_slug.slug}`
                                }


                                if (body_menu.children && body_menu.children.length) {

                                    let children_link = {};
                                    for (let children of body_menu.children) {
                                        if (!children.link) {
                                            //let page = await pagesService.getPageByFilter({ id: children.id, origin_id: 0 })
                                            let page = await pagesService.getPageByFilter({ id: children.id})

                                            let link = await extraUtil.generateLinkUrlForPage(page.type, page.id, page.template,lang)

                                            let link_slug = await linksService.getLinkByFilter({ original_link: link })
                                            link_slug = link_slug.toJSON()

                                            // link = await models.links.findOne({
                                            //     where: {
                                            //         original_link: `/get${ucFirst(children.type)}/` + children.id,
                                            //         type: children.type
                                            //     }
                                            // })
                                            if (link_slug && link_slug.slug == "/") {
                                                children.link = `${link_slug.slug}`
                                            } else if (link_slug && link_slug.slug != "/") {
                                                //children_link.link = `/${link_slug.slug}`
                                                children.link = `/${link_slug.slug}`
                                            } else {
                                                //children_link.link = `/`
                                                children.link = `/`
                                            }
                                        }

                                    }

                                }

                            } else {
                                body.link = body_menu.link
                            }
                            if(lang && lang !='uk' && body && body.link)body.link = `/${lang}`+body.link
                            // body.link = body_menu.link ? body_menu.link : '/';
                            body.children = body_menu.children
                            body.name = body_menu.text;
                            body.icon = body_menu.icon ? body_menu.icon : {};

                            menu_result.push(body);

                        }
                    }
                    switch (item.type) {
                        case 'footer':
                            menu.footer = menu_result;
                            break
                        case 'header':
                            menu.header = menu_result;
                            break
                        case 'burger':
                            menu.burger = menu_result;
                            break
                        case 'catalog':
                            menu.catalog = menu_result;
                            break
                        case 'copyright':
                            menu.copyright = menu_result;
                            break
                        case 'footer_allegro':
                            menu.footer_allegro = menu_result;
                            break
                        case 'footer_clients':
                            menu.footer_clients = menu_result;
                            break
                        case 'footer_mini_menu':
                            menu.footer_mini_menu = menu_result;
                            break

                        // case 'mobile': menu.mobile = menu_result; break
                    }
                    // menu.push(menu_result);
                }
                if(menu.footer_list_1 && !menu.footer_list_1.text_title && (!menu.footer_list_1.item || !menu.footer_list_1.item.length)) {
                    delete menu.footer_list_1
                }
                if(menu.footer_list_2 && !menu.footer_list_2.text_title && (!menu.footer_list_2.item || !menu.footer_list_2.item.length)) {
                    delete menu.footer_list_2
                }
                if(menu.footer_list_3 && !menu.footer_list_3.text_title && (!menu.footer_list_3.item || !menu.footer_list_3.item.length)) {
                    delete menu.footer_list_3
                }

                // menu.social_network = JSON.parse(result.social_network)
                //return
                //let homePage = await pagesService.getPage({ template: "homepage" })
                //let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${homePage.id}` })
                //menu.home = homepageLink.slug
            }
            log.info(`End getMenu service data:${JSON.stringify(menu)}`)
            return menu;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    updateConfigs: async(configs, admin_id) => {
        log.info(`Start updateConfigs service data:${JSON.stringify(configs, admin_id)}`)
        let transaction = await sequelize.transaction();
        try {
            let result = {};
            let updated_at = new Date().toISOString()

            await models.configs.update({ value: configs.dealer_discount, updated_at }, { where: { type: 'dealer_discount' }, transaction });
            result.dealer_discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true, transaction });
            result.dealer_discount = result.dealer_discount.value;

            await models.configs.update({ value: configs.designer_discount, updated_at }, { where: { type: 'designer_discount' }, transaction });
            result.designer_discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true, transaction });
            result.designer_discount = result.designer_discount.value;


            await models.configs.update({ value: JSON.stringify(configs.pages_settings), updated_at }, { where: { type: 'pages_settings', lang: configs.lang }, transaction });
            result.pages_settings = await models.configs.findOne({ where: { type: 'pages_settings' }, raw: true, transaction });
            result.pages_settings = result.pages_settings.value;


            await models.configs.update({ value: JSON.stringify(configs.popups_settings), updated_at }, { where: { type: 'popups_settings', lang: configs.lang }, transaction });
            result.popups_settings = await models.configs.findOne({ where: { type: 'popups_settings', lang: configs.lang }, raw: true, transaction });
            result.popups_settings = result.popups_settings.value;


            await models.configs.update({ value: JSON.stringify(configs.self_pickup), updated_at }, { where: { type: 'self_pickup', lang: configs.lang }, transaction });
            result.self_pickup = await models.configs.findOne({ where: { type: 'self_pickup', lang: configs.lang }, raw: true, transaction });
            result.self_pickup = JSON.parse(result.self_pickup.value);

            await models.configs.update({ value: configs.primary_email, updated_at }, { where: { type: 'primary_email' }, transaction });
            result.primary_email = await models.configs.findOne({ where: { type: 'primary_email' }, raw: true, transaction });
            result.primary_email = result.primary_email.value;
            await models.configs.update({ value: configs.delivery_emails, updated_at }, { where: { type: 'delivery_emails' }, transaction });
            result.delivery_emails = await models.configs.findOne({ where: { type: 'delivery_emails' }, raw: true, transaction });
            result.delivery_emails = result.delivery_emails.value;
            await models.configs.update({ value: configs.register_emails, updated_at }, { where: { type: 'register_emails' }, transaction });
            result.register_emails = await models.configs.findOne({ where: { type: 'register_emails' }, raw: true, transaction });
            result.register_emails = result.register_emails.value;

            await models.configs.update({ value: JSON.stringify(configs.delivery_types), updated_at }, { where: { type: 'delivery_types' }, transaction });
            result.delivery_types = await models.configs.findOne({ where: { type: 'delivery_types' }, raw: true, transaction });
            result.delivery_types = JSON.parse(result.delivery_types.value);
            await models.configs.update({ value: JSON.stringify(configs.pay_types), updated_at }, { where: { type: 'pay_types' }, transaction });
            result.pay_types = await models.configs.findOne({ where: { type: 'pay_types' }, raw: true, transaction });
            result.pay_types = JSON.parse(result.pay_types.value);

            await models.configs.update({ value: JSON.stringify(configs.hide_testimonials), updated_at }, { where: { type: 'hide_testimonials' }, transaction });
            result.hide_testimonials = await models.configs.findOne({ where: { type: 'hide_testimonials' }, raw: true, transaction });
            result.hide_testimonials = JSON.parse(result.hide_testimonials.value);






            result.updated_at = updated_at;
            await adminChangesHistoryService.adminCreateHistory({ user_id: admin_id, type: 'shop_configs' }, transaction);
            // await models.admin_changes_history.create({created_at: Math.floor(new Date().getTime() / 1000),user_id: admin_id, type: 'shop_configs'},{transaction});
            result.history = await adminChangesHistoryService.adminFindAllHistory({
                type: 'shop_configs',
                created_at: {
                    [Op.gte]: (Date.now() - config.TIME_CONST)
                }
            }, transaction);
            // result.history = await models.admin_changes_history.findAll({where: {type:'shop_configs', created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
            await transaction.commit();
            log.info(`End updateConfigs service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getConfigs: async(lang) => {
        log.info(`Start getConfigs service data:${JSON.stringify(lang)}`)
        let transaction = await sequelize.transaction();
        try {
            let result = {};

            result.dealer_discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true, transaction });
            result.dealer_discount = result.dealer_discount.value;

            result.designer_discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true, transaction });
            result.designer_discount = result.designer_discount.value;

            result.primary_email = await models.configs.findOne({ where: { type: 'primary_email' }, raw: true, transaction });
            result.primary_email = result.primary_email.value;
            result.delivery_emails = await models.configs.findOne({ where: { type: 'delivery_emails' }, raw: true, transaction });
            result.delivery_emails = result.delivery_emails.value;
            result.register_emails = await models.configs.findOne({ where: { type: 'register_emails' }, raw: true, transaction });
            result.register_emails = result.register_emails.value;
            result.self_pickup = await models.configs.findOne({ where: { type: 'self_pickup', lang: lang }, raw: true, transaction });
            result.self_pickup = JSON.parse(result.self_pickup.value);
            result.pages_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true, transaction })
            result.pages_settings = JSON.parse(result.pages_settings.value);

            result.popups_settings = await models.configs.findOne({ where: { type: 'popups_settings', lang: lang }, raw: true, transaction })
            result.popups_settings = JSON.parse(result.popups_settings.value);

            result.delivery_types = await models.configs.findOne({ where: { type: 'delivery_types' }, raw: true, transaction });
            result.delivery_types = JSON.parse(result.delivery_types.value);
            result.pay_types = await models.configs.findOne({ where: { type: 'pay_types' }, raw: true, transaction });
            result.pay_types = JSON.parse(result.pay_types.value);

            result.hide_testimonials = await models.configs.findOne({ where: { type: 'hide_testimonials' }, raw: true, transaction });
            result.hide_testimonials = JSON.parse(result.hide_testimonials.value);



            result.history = await adminChangesHistoryService.adminFindAllHistory({
                type: 'shop_configs',
                created_at: {
                    [Op.gte]: (Date.now() - config.TIME_CONST)
                }
            }, transaction);
            // result.history = await models.admin_changes_history.findAll({where: {type:'shop_configs', created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
            await transaction.commit();
            log.info(`End getConfigs service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateMapConfigs: async(configs, admin_id) => {
        log.info(`Start updateMapConfigs service data:${JSON.stringify(configs, admin_id)}`)
        let transaction = await sequelize.transaction();
        try {
            let result = {};
            let updated_at = new Date().toISOString()
            await models.configs.update({ value: configs.map_key, updated_at }, { where: { type: 'map_key' }, transaction });
            result.google_maps = await models.configs.findOne({ where: { type: 'map_key' }, raw: true, transaction });
            result.google_maps = result.google_maps.value;

            await models.configs.update({ value: JSON.stringify(configs.page_404), updated_at }, { where: { type: 'page_404' }, transaction });
            result.page_404 = await models.configs.findOne({ where: { type: 'page_404' }, raw: true, transaction });
            result.page_404 = result.page_404.value ? JSON.parse(result.page_404.value) :null;

            await models.configs.update({ value: JSON.stringify(configs.cookie_popup), updated_at }, { where: { type: 'cookie_popup', lang: configs.lang }, transaction });
            result.cookie_popup = await models.configs.findOne({ where: { type: 'cookie_popup', lang: configs.lang }, raw: true, transaction });
            result.cookie_popup = result.cookie_popup.value ? JSON.parse(result.cookie_popup.value) :null;


            configs.np_key = configs.np_key && configs.np_key.value ? configs.np_key.value :null
            await models.configs.update({ value: configs.np_key, updated_at }, { where: { type: 'np_key', lang: configs.lang }, transaction });
            result.np_key = await models.configs.findOne({ where: { type: 'np_key', lang: configs.lang }, raw: true, transaction });
            result.np_key = result.value;

            configs.pre_orders_emails = configs.pre_orders_emails && configs.pre_orders_emails.value ? configs.pre_orders_emails.value : null
            await models.configs.update({ value: configs.pre_orders_emails, updated_at }, { where: { type: 'pre_orders_emails', lang: configs.lang }, transaction });
            result.pre_orders_emails = await models.configs.findOne({ where: { type: 'pre_orders_emails', lang: configs.lang }, raw: true, transaction });
            result.pre_orders_emails = result.value

            await models.configs.update({ value: JSON.stringify(configs.liqpay), updated_at }, { where: { type: 'pay_types' }, transaction });
            result.liqpay = await models.configs.findOne({ where: { type: 'pay_types' }, raw: true, transaction });
            result.liqpay = result.liqpay.value ? JSON.parse(result.liqpay.value) :null;


            await models.configs.update({value: JSON.stringify(configs.orders_mail_to_client), updated_at}, { where: {type: 'orders_mail_to_client'}, transaction })
            result.orders_mail_to_client = await models.configs.findOne({ where: { type: 'orders_mail_to_client' }, raw: true, transaction });
            result.orders_mail_to_client = result.orders_mail_to_client.value ? JSON.parse(result.orders_mail_to_client.value) :null;


            await models.configs.update({value: configs.card_privat ? configs.card_privat : false, updated_at}, { where: {type: 'card_privat_to_order'}, transaction })
            result.card_privat = await models.configs.findOne({ where: { type: 'card_privat_to_order' }, raw: true, transaction });
            result.card_privat = parseInt(result.card_privat.value);

            result.updated_at = updated_at;
            result.lang = configs.lang
            await adminChangesHistoryService.adminCreateHistory({ user_id: admin_id, type: 'map_configs' }, transaction);
            // await models.admin_changes_history.create({created_at: Math.floor(new Date().getTime() / 1000),user_id: admin_id, type: 'map_configs'},{transaction});
            result.history = await adminChangesHistoryService.adminFindAllHistory({
                type: 'map_configs',
                created_at: {
                    [Op.gte]: (Date.now() - config.TIME_CONST)
                }
            }, transaction);
            // result.history = await models.admin_changes_history.findAll({where: {type:'map_configs', created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
            await transaction.commit();
            log.info(`End updateMapConfigs service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getMapConfigs: async(lang) => {
        log.info(`Start getMapConfigs service data:${JSON.stringify(lang)}`)
        let transaction = await sequelize.transaction();
        try {
            let result = {};
            result.page_404 = await models.configs.findOne({ where: { type: 'page_404' }, raw: true, transaction });
            result.page_404 = result.page_404.value ? JSON.parse(result.page_404.value) :null;

            result.google_maps = await models.configs.findOne({ where: { type: 'map_key' }, raw: true, transaction });
            result.updated_at = result.google_maps.updated_at;
            result.google_maps = result.google_maps.value;

            result.cookie_popup = await models.configs.findOne({ where: { type: 'cookie_popup', lang: lang }, raw: true, transaction });
            result.cookie_popup = JSON.parse(result.cookie_popup.value);

            result.liqpay = await models.configs.findOne({ where: { type: 'pay_types', lang: lang }, raw: true, transaction });
            result.liqpay = JSON.parse(result.liqpay.value);

            result.card_privat = await models.configs.findOne({ where: { type: 'card_privat_to_order', lang: lang }, raw: true, transaction });
            result.card_privat = JSON.parse(result.card_privat.value);

            result.orders_mail_to_client = await models.configs.findOne({ where: { type: 'orders_mail_to_client', lang: lang }, raw: true, transaction });
            result.orders_mail_to_client = JSON.parse(result.orders_mail_to_client.value);

            result.np_key = await models.configs.findOne({ where: { type: 'np_key', lang: lang }, raw: true, transaction });

            result.pre_orders_emails = await models.configs.findOne({where:{type:'pre_orders_emails',lang:lang},raw:true, transaction})

            result.default_form = await models.configs.findOne({ where: { type: 'default_form', lang: lang }, raw: true, transaction });
            result.default_form = JSON.parse(result.default_form.value);

            result.history = await adminChangesHistoryService.adminFindAllHistory({
                type: 'map_configs',
                created_at: {
                    [Op.gte]: (Date.now() - config.TIME_CONST)
                }
            }, transaction);
            // result.history = await models.admin_changes_history.findAll({where: {type:'map_configs', created_at: {[Op.gte] : (Date.now()/1000)-5184000}}, order: [["created_at", "DESC"]], include: {model: models.user, attributes: ['id','first_name','last_name']}, transaction})
            await transaction.commit();
            log.info(`End getMapConfigs service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    }
}
