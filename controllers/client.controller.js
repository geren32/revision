const { models } = require("../sequelize-orm");
const sequelize = require("../sequelize-orm");
const clientService = require("../services/client.service");
const { Op } = require("sequelize");
const userService = require("../services/user.service");
const config = require("../configs/config");
const emailUtil = require("../utils/mail-util");
const templateUtil = require("../utils/template-util");
const moment = require("moment");
const bookingController = require("../controllers/booking.controller");
const productService = require("../services/product.service");
const orders = require("../services/order.service");
const menuService = require("../services/menu.service");
const _ = require("lodash");
const adminPromocodeService = require("../services/admin-promocode.service");
const bcryptUtil = require("../utils/bcrypt-util");
const errors = require("../configs/errors");
const mailchimp = require("../utils/mailchimp-util");
const log = require("../utils/logger");
const linksService = require("../services/links.service");
const productTestimonialsService = require("../services/product_testimonials.service");
const addressService = require("../services/adress.service");
const bookingService = require("../services/booking.service");
// let currencyValue = 28;
const formsService = require('../services/forms.service');
const axios = require("axios");
const uuid = require('uuid');
const pagesService = require("../services/pages.service");
const paymentService = require("../services/payment.service");
const cartService = require("../services/cart.service");
const  productPriceUtil = require('../utils/product_price-util')
const handlebarHelpers = require('../utils/handebar-helpers');
const product_discount_calc_without_coef = require('../utils/product_discount_calc_without_coef');
const exportXlsUtil = require('../utils/exportXLS');
const product_discount_calc = require('../utils/product_discount_calc');
const smsUtil = require('../utils/sms-util');
const pdfUtil = require('../utils/pdf-util');
const attributesService = require('../services/attributes.service');
const productCompositeImagesFromOptionsUtil = require('../utils/get-compositeIMG-from-options-util');
const DIA = require('../build/run-sdk');
const extraUtil = require('../utils/extra-util');
const notificationService = require('../services/notification-service');
const paginationUtil = require('../utils/pagination-util');
const statusService = require('../services/status.service');
const utilsCognito = require ('../utils/cognito-util');
const s3Util = require ('../utils/s3-util');
const JSZip = require('jszip');
const html_to_pdf = require('html-pdf-node');
// const IITUtil = require("../utils/IIT-library-util/main");
const fs = require('fs');
const FormData = require('form-data');
const helloSignUtil = require('../utils/hello-sign-util');
const openDataBotUtil = require('../utils/opendata-bot-util');
const https = require('https');
const QRCode = require('qrcode');
const requestIp = require("request-ip");
const adminServiceService = require("../services/admin.service.service");
const ordersService = require("../services/order.service");
const handlebars = require("handlebars");
const s3Service = require("aws-sdk");
const s3 = new s3Service.S3({
    secretAccessKey : config.AWS_SECRET_ACCESS_KEY ,
    accessKeyId : config.AWS_ACCESS_KEY_ID ,
    region : config.AWS_REGION_NAME
});
const Puppeteer = require('puppeteer');
module.exports = {
    clienttest : async (req, res) => {
        return res.status(200).json({
            userid: req.userid,
            role: req.role,
            first_name: req.first_name
        });
    } ,
    clienttest1: async (req, res) => {
        const lang = req.lang;
        const languages = config.LANGUAGES
        const id = req.user ? req.user.id : null;
        let slugs = {}
        if(languages && languages.length){
            languages.forEach((item,i)=>{
                if(item && item == 'uk'){
                    slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/` : `/${languages[i]}/404`
                } else slugs[languages[i]] = `${config.LANGUAGES[i]}/404`
            })
        }
        let user;
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        if(id){
            user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', 'role']);
            user = user ? user.toJSON() : user;
        }
        res.render('client/thank-you-diya', {
            langs: req.langs,
            lang: lang,
            slugs,
            metaData: req.body.metaData,
            layout: 'client/layout.hbs',
            user,
            first_name: user ? user.first_name : null,
            last_name: user ? user.last_name : null,
            header_footer: header_footer ? header_footer: null,
            menu: menu ? menu: null,
        });
    },
    getClientPersonalData: async(req, res) => {
        const id = req.user.userid;
        const lang = req.lang;
        let cart = req.cart;
        log.info(`Start get /cabinet. Personal cabinet`);
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/cabinet'
            } else slugs[languages[i]] = `/${languages[i]}/client/cabinet`
        }
        if (!id) return res.json('No id');
        try {

            let user = await userService.getUser({ id: id });
            user = user.toJSON();
            if(user && user.is_private){
                user.is_private = user.is_private && user.is_private == 2 ?true :false;
            }
            let menu = await menuService.getMenu(lang);
            let header_footer = await menuService.getHeaderFooter(lang);

            let browserPageName

            switch (lang) {
                case 'uk':
                    browserPageName = "Кабінет"
                    break;
                case 'ru':
                    browserPageName = "Кабинет"
                    break;
                case 'en':
                    browserPageName = "Cabinet"
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
            let map_key = await models.configs.findOne({ where: { type: 'map_key' }, raw: true });
            let notificationsCount = await notificationService.countUserNotifications(id, lang);
            log.info(`End get /cabinet. Result: ${JSON.stringify(user)}`);

            res.render("cabinet-pozov/cabinet-data", {
                layout: "client/layout.hbs",
                menu,
                slugs,
                cart,
                header_footer: header_footer ? header_footer : null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                notificationsCount: notificationsCount ? notificationsCount: null,
                // favorite: favorite ? favorite : null,
                config: config ? config : null,
                lang: lang ? lang : null,
                user,
                homePage,
                isMap_statement: true,
                map_key: map_key.value,
                browserPageName,
                isCabinet:true,
                menu_panel: 'personal_data',
            });
        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    updateClientData: async(req, res) => {
        const id = req.user.userid;
        if (!id) res.json('No id')
        const userData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            father_name: req.body.father_name,
            email: req.body.email,
            // phone: req.body.phone,
            birthday_date: req.body.birthday_date,
            address: req.body.address,
            house: req.body.house,
            inn : req.body.inn,
            apartment:req.body.apartment,
            num_passport : req.body.num_passport,
            is_private : req.body.is_private && req.body.is_private != 'false' ? 2 :1,
            updated_at: new Date().toISOString(),
        };
        const lang = req.lang
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.father_name || !userData.birthday_date || !userData.address  || !userData.house) {
            return res.status(errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        try {
            log.info(`Start post /cabinet/update-client-data Params: ${JSON.stringify(req.body)}`);

            if (req.body.email && !config.REGEX_EMAIL.test(req.body.email)) {
                return res.status(errors.CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                    message: errors.CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                });
            }
            // if (
            //     req.body.phone &&
            //     (!config.REGEX_PHONE.test(req.body.phone) || req.body.phone.length != 19)
            // ) {
            //     return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
            //         message: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.message[lang],
            //         errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code,
            //     });
            // }
            const userExist = await userService.getUser({ email: userData.email }, ["id", "email"]);
            if (userExist && userExist.id != id) {
                return res.status(errors.CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED.code).json({
                    message: errors.CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED.code,
                });
            }
            // const phoneExist = await userService.getUser({ phone: userData.phone }, [
            //     "id",
            // ]);
            // if (phoneExist && phoneExist.id != id) {
            //     return res.status(errors.CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED.code).json({
            //         message: errors.CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED.message[lang],
            //         errCode: errors.CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED.code,
            //     });
            // }
            let [day, month, year] = userData.birthday_date.split('.');
            userData.birthday_date = new Date(+year, +month, +day);
            userData.birthday_date.setHours(userData.birthday_date.getHours() + 3)
            userData.birthday_date.setMonth(userData.birthday_date.getMonth() - 1)
            await userService.updateUserByFilter(userData, { id: id });
            log.info(`End post /cabinet/update-client-data Result: Дані успішно змінено!`);
            return res.json({ message: config.TEXTS[lang].data_successfully_updated });
        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    getClientHistory: async(req, res) => {
        const lang = req.lang;
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/history-orders'
            } else slugs[languages[i]] = `/${languages[i]}/client/history-orders`
        }
        const id = req.user.userid;
        if (!id) return res.json('No id');
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        if(req.query.current_page) page = parseInt(req.query.current_page)
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 9;
        log.info(`Start get /history-orders `)
        let user;
        if (id){
            user = await userService.getUser({ id: id });
            user = user.toJSON();
        }

        let ordersArr = await orders.getAllOrdersByUser(id, page, perPage,lang);
        ordersArr.rows = await Promise.all(ordersArr.rows.map(async item => {
            let orderStatus = await statusService.getOrderStatusByFilter({ [Op.or]: [{ id: item.status, lang: lang }, { origin_id: item.status, lang: lang }] });
            if(orderStatus) {
                orderStatus = orderStatus.toJSON();
                item.statusText = orderStatus.title;
                item.statusColor = orderStatus.color;
            }
            if(item.service_id){
                item.service = await models.service.findOne({where: {[Op.or]: [{ id: item.service_id, lang: lang }, { origin_id: item.service_id, lang: lang }]}, attributes: ['title','id'], raw: true});
            }else if(item.additional_id){
                item.service = await models.service_additional.findOne({where: {id:item.additional_id}, attributes: ['title','id'], raw: true});
                if(item.parent_order_id) {
                    item.parentOrder = await models.orders.findOne({where: {id: item.parent_order_id}, include: {model: models.service}});
                    if(item.parentOrder && item.parentOrder.service) {
                        item.parentOrder = item.parentOrder.service.title;
                    } else item.parentOrder = null;
                }
            }
            return item;
        }));

        // let favorite = await productService.getCountFavorites(id);
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);

        let browserPageName;
        switch (lang) {
            case 'uk':
                browserPageName = "Кабінет"
                break;
            case 'ru':
                browserPageName = "Кабинет"
                break;
            case 'en':
                browserPageName = "Cabinet"
                break;
            default:
                break;
        }
        let countPages;
        let minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        let paginationData = await paginationUtil.pagination(countPages, ordersArr.count, perPage, page, minPage, maxPage, lastElem, isPaginationShow)
        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }
        let notificationsCount = await notificationService.countUserNotifications(id, lang);
        log.info(`End get /history-orders Result: ${JSON.stringify(ordersArr)}`)
        res.render('cabinet-pozov/cabinet-history', {
            layout: "client/layout.hbs",
            user,
            slugs,
            homePage,
            browserPageName,
            orders: ordersArr && ordersArr.rows ? ordersArr.rows : null,
            lang: lang,
            config: config ? config : null,
            countPages: paginationData.countPages,
            isPaginationShow: paginationData.isPaginationShow,
            pagination: paginationData.pagination,
            lastElem: paginationData.pagination.lastElem,
            consultation_form: await pagesService.getFormByPage(4,lang),
            notificationsCount: notificationsCount ? notificationsCount: null,
            // favorite: favorite ? favorite : null,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            isCabinet: true,
            menu_panel: 'history_orders',
            pagination_js: true,
        });
    },
    getClientHistoryAjax: async(req, res) => {
        log.info(`Start getClientHistoryAjax data:${JSON.stringify(req.body)}`);
        const lang = req.lang ?  req.lang :config.LANGUAGES[0];
        const id = req.user.userid;
        if (!id) return res.json('No id');
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 9;
        log.info(`Start get /history-orders `)
        let ordersArr = await orders.getAllOrdersByUser(id, page, perPage,lang);
        if(ordersArr && ordersArr.rows && ordersArr.rows.length){
            for(let item of ordersArr.rows){
                let orderStatus = await statusService.getOrderStatusByFilter({ [Op.or]: [{ id: item.status, lang: lang }, { origin_id: item.status, lang: lang }] });
                if(orderStatus) {
                    orderStatus = orderStatus.toJSON();
                    item.statusText = orderStatus.title;
                    item.statusColor = orderStatus.color;
                }
                if(item.service_id){
                    item.service = await models.service.findOne({where: {[Op.or]: [{ id: item.service_id, lang: lang }, { origin_id: item.service_id, lang: lang }]}, attributes: ['title','id'], raw: true});
                }else if(item.additional_id){
                    item.service = await models.service_additional.findOne({where: {id:item.additional_id}, attributes: ['title','id'], raw: true});
                    if(item.parent_order_id) {
                        item.parentOrder = await models.orders.findOne({where: {id: item.parent_order_id}, include: {model: models.service}});
                        if(item.parentOrder && item.parentOrder.service) {
                            item.parentOrder = item.parentOrder.service.title;
                        } else item.parentOrder = null;
                    }
                }
            }
        }
        let countPages;
        let minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        let paginationData = await paginationUtil.pagination(countPages, ordersArr.count, perPage, page, minPage, maxPage, lastElem, isPaginationShow)
        log.info(`End get /history-orders Result: ${JSON.stringify(ordersArr)}`)
        const pagination = await templateUtil.getTemplate({
            countPages: paginationData.countPages,
            isPaginationShow: paginationData.isPaginationShow,
            pagination: paginationData.pagination,
        }, 'partials/pagination');

        const html = await templateUtil.getTemplate({
            orders: ordersArr.rows,
            lang: lang
        }, 'cabinet-pozov/cabinet-history-ajax');
        log.info(`End getClientHistoryAjax data:${JSON.stringify(html,pagination)}`);
        res.json({
            html: html,
            pagination: pagination,
        })
    },
    getClientHistoryDetail: async(req, res) => {
        const lang = req.lang;
        let slugs = {};
        const languages = config.LANGUAGES;
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = `/client/history-order-detail/${req.params.order_id}`;
            } else slugs[languages[i]] = `/${languages[i]}/client/history-order-detail/${req.params.order_id}`;
        }
        const id = req.user.userid;
        if(req.params.order_id == 1) req.params.order_id = 141;
        let user;
        try {
            log.info(` Start get /client/history-order-detail/ Params: ${JSON.stringify(req.params)}`);
            if (!id) return res.json('No id');
            if (id){
                user = await userService.getUser({ id: id });
                user = user.toJSON();
            }
            let order = await bookingService.getBookingByFilter({id:req.params.order_id});
            if(order.service_type == 1 && order.pay_status == 1 && order.pay_type == 1)order.button_online_pay = true
            if(order.pay_type && order.pay_type == 3)order.price = 0
            // let order = await bookingService.getBookingByFilter({user_id:id,id:req.params.order_id, status: {[Op.ne]:1}});
            order.pay_type = order.pay_type ? config.SERVICE_PAY_TYPE_TEXT[order.pay_type].type[lang] : '';
            order.delivery_type_text = order.delivery_type ? config.SERVICE_DELIVERY_TYPE_TEXT[order.delivery_type].type[lang] : '';
            order.court_fee = order.court_price;
            if(order.court_id)order.court = await models.courts.findOne({where:{[Op.or]:[{id:order.court_id,lang:lang},{origin_id:order.court_id,lang:lang}]},raw:true})
            if(order.service_id && !order.additional_id){
                order.service = await models.service.findOne({where: {[Op.or]: [{ id: order.service_id, lang: lang }, { origin_id: order.service_id, lang: lang }]}, attributes: ['title','id','not_show_dia'], include: {model: models.service_additional_files}});
                order.additional_service = await models.service_additional.findAll({where:{service_id:order.service_id},raw:true})
                if(order.service) {
                    order.service = order.service.toJSON();
                } else order.service = {not_show_dia: true};
            }else if(order.additional_id){
                order.service = await models.service_additional.findOne({where:{id:order.additional_id}});
                if(order.service) {
                    order.service = order.service.toJSON();
                    order.service.not_show_dia = false;
                } else order.service = {not_show_dia: false};
            }
            order.ordered_additional_services = await models.orders.findAll({where: {parent_order_id: order.id}});
            if(order.ordered_additional_services && order.ordered_additional_services.length) {
                order.ordered_additional_services = await Promise.all(order.ordered_additional_services.map(async item => {
                    item = item.toJSON();
                    item.service = await models.service_additional.findOne({where: {id:item.additional_id}, raw: true});
                    return item;
                }));
            }
            let orderStatus = await statusService.getOrderStatusByFilter({ [Op.or]: [{ id: order.status, lang: lang }, { origin_id: order.status, lang: lang }] });
            if(orderStatus) {
                orderStatus = orderStatus.toJSON();
                order.statusText = orderStatus.title;
                order.statusColor = orderStatus.color;
            }
            order.details = await models.orders_form_results.findOne({where: {type: 6, orders_id: order.id}, raw:true});
            if(order.details) {
                order.details = order.details.value.split(';');
                order.details = order.details.map(item => {
                    item = item.split(',');
                    return item;
                })
            } else {
                if(user.first_name && user.last_name) {
                    order.details = [[user.first_name+' '+user.last_name,user.phone,user.email]];
                } else {
                    order.details = [[user.phone,user.email]];
                }
            }
            if(order.order_files && order.order_files.length > 2) {
                order.is_signed = true;
                if (!order.is_court_send && !order.signature_request_id) order.show_court_send = true;
            }
            if(order.user_sign) order.is_signed = true;
            if((!order.service.not_show_dia || order.parent_order_id) && !order.signature_request_id) {
                order.show_dia = true;
            }
            if(order.status !== 11 && order.status !== 13 && order.send_status !== 1 && !order.is_signed) {
                order.show_sign_btns = true;
            } else {
                order.show_sign_btns = false;
            }
            if(order.status !== 11 && order.status !== 13 && order.send_status !== 1) order.download_document = true;
            if(!order.show_sign_btns && !order.is_signed) {
                order.hide_buttons = true;
            } else order.hide_buttons = false;
            if(order.status === 13 || order.pay_type && order.pay_type == config.SERVICE_PAY_TYPE_TEXT[1].type[lang] && order.service_type && order.service_type == 1 && order.pay_status && order.pay_status == 1) order.show_payment = true;
            if(order.show_court_send || order.is_court_send) order.show_order_images = true;

            if(order && order.service && order.service.service_additional_files && order.service.service_additional_files.length) {
                let service_additional_files = [];
                order.service.service_additional_files = await Promise.all(order.service.service_additional_files.map(async item => {
                    if(item.tag) {
                        let order_field_result = await models.orders_form_results.findOne({where: {name_field: item.tag, orders_id: order.id}});
                        if (!order_field_result){
                            return null;
                        }else{
                            if(order_field_result.type == config.FORM_FIELDS_TYPES.CHILD && order_field_result.value && order_field_result.title == '2') {
                                order_field_result = order_field_result.value.split(',');
                                for (let i = 0; i < order_field_result.length; i++) {
                                    let new_item = Object.assign({},item);
                                    new_item.title += ' ' + order_field_result[i];
                                    service_additional_files.push(new_item);
                                }
                                return null;
                            }else{
                                return null;
                            }
                        }
                    }
                    return item;
                }));
                order.service.service_additional_files = order.service.service_additional_files.filter(item => !!item);
                if(service_additional_files && service_additional_files.length) {
                    order.service.service_additional_files.push(...service_additional_files);
                    order.service.service_additional_files.sort((a,b) => a.id - b.id);
                }
            }
            // let favorite = await productService.getCountFavorites(id);
            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);

            let browserPageName;
            switch (lang) {
                case 'uk':
                    browserPageName = "Кабінет";
                    break;
                case 'ru':
                    browserPageName = "Кабинет";
                    break;
                case 'en':
                    browserPageName = "Cabinet";
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
            log.info(`End get /client/history-order-detail/ Result: ${JSON.stringify(order)}`);
            let notificationsCount = await notificationService.countUserNotifications(id, lang);
            res.render("cabinet-pozov/cabinet-history-detail", {
                layout: "client/layout.hbs",
                user,
                slugs,
                homePage,
                browserPageName,
                lang: lang,
                notificationsCount: notificationsCount ? notificationsCount: null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                config: config,
                order,
                // favorite: favorite ? favorite : null,
                header_footer: header_footer ? header_footer : null,
                menu: menu ? menu : null,
                isCabinet: true
            });
        } catch (err) {
            console.log(err,'343454764868567362526')
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    getChangePassword: async(req, res) => {
        log.info(`Start get /changePassword ${JSON.stringify(req.body)}`)
        const lang = req.lang;
        let slugs = {};
        const languages = config.LANGUAGES;
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/changePassword'
            } else slugs[languages[i]] = `/${languages[i]}/client/changePassword`
        }
        const id = req.user.userid;
        let cart = req.cart;
        if (!id) res.json('No id');
        let user;
        if (id) {
            user = await userService.getUser({ id: id })
            user = user.toJSON();
        }

        let browserPageName;
        switch (lang) {
            case 'uk':
                browserPageName = "Кабінет"
                break;
            case 'ru':
                browserPageName = "Кабинет"
                break;
            case 'en':
                browserPageName = "Cabinet"
                break;
            default:
                break;
        }

        let homePage = {};
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang);
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        // let favorite = await productService.getCountFavorites(id);
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let notificationsCount = await notificationService.countUserNotifications(id, lang);
        log.info(`End get /changePassword`)
        res.render("cabinet-pozov/cabinet-change-password", {
            layout: "client/layout.hbs",
            lang: lang,
            homePage,
            cart,
            browserPageName,
            slugs,
            user,
            config: config ? config : null,
            notificationsCount: notificationsCount ? notificationsCount: null,
            consultation_form: await pagesService.getFormByPage(4,lang),
            // favorite: favorite ? favorite : null,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            isCabinet:true
        });
    },
    changePassword: async(req, res) => {
        const id = req.user ? req.user.userid : null;
        const lang = req.lang
        let { password, new_password, confirm_new_password } = req.body;
        log.info(`Start post /changePassword  Params: ${JSON.stringify(req.body)}`);
        if (!password || !new_password || !confirm_new_password) {
            return res
                .status(errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code)
                .json({
                    message: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
        }
        if (new_password != confirm_new_password) {
            return res
                .status(errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code)
                .json({
                    message: errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code,
                });
        }
        if (password == new_password) {
            return res
                .status(errors.CLIENT_BAD_REQUEST_USER_PASSWORD_SAME_AS_OLD.code)
                .json({
                    message: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_SAME_AS_OLD.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_SAME_AS_OLD.code,
                });
        }
        if (!config.REGEX_PASSWORD.test(new_password)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code,
            });
        }
        try {
            const user = await userService.getUser(id, ["id","first_name","last_name", "email","phone"]);

            // const isComparePassword = await bcryptUtil.comparePassword(
            //     password,
            //     user.password
            // );
            // if (!isComparePassword) {
            //     return res.status(errors.CLIENT_BAD_REQUEST_INVALID_OLD_PASSWORD.code).json({
            //         message: errors.CLIENT_BAD_REQUEST_INVALID_OLD_PASSWORD.message[lang],
            //         errCode: errors.CLIENT_BAD_REQUEST_INVALID_OLD_PASSWORD.code,
            //     });
            // }
            // const newHashPassword = await bcryptUtil.hashPassword(new_password);
            // await user.update({
            //     password: newHashPassword,
            //     updated_at: new Date().toISOString(),
            // });

            let phoneToCognito = user.phone.replace(/[()\s]/g, '');
            // let userCognito = await utilsCognito.setUserPasswordByAdminByPhone(phoneToCognito, new_password).catch((err) => {
            //     if (err) {
            //         log.error(`Failed to set user password, ${err.message}: ${phoneToCognito}`);
            //         err.code = 400;
            //         throw err;
            //     }
            // });
            let userCognito = await utilsCognito.changePassword(req.cookies['jwt'], password, new_password).catch((err) => {
                if (err) {
                    log.error(`Failed to set user password, ${err.message}: ${phoneToCognito}`);
                    err.code = 400;
                    throw err;
                }
            });
            await notificationService.createNotification(config.NOTIFICATION_TYPES.CHANGE_PASSWORD, user.id);

            let mailObj = {
                to: user.email,
                subject: config.TEXTS[lang].password_reset_title,
                data: {
                    userName: user.first_name,
                    userLastName: user.last_name,
                    lang: req.lang
                }
            };
            emailUtil.sendMail(mailObj, 'reset-pass');

            log.info(`End post /changePassword  Result: Пароль змінено! `);
            return res.json({ message: config.TEXTS[lang].password_successfully_changed });

        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: 400,
            });
        }
    },

    getClientNotifications: async(req, res) => {
        const lang = req.lang;
        let slugs = {};
        const languages = config.LANGUAGES;
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/notifications';
            } else slugs[languages[i]] = `/${languages[i]}/client/notifications`;
        }
        const id = req.user.userid;
        if (!id) return res.json('No id');
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        if(req.query.current_page) page = parseInt(req.query.current_page);
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 6;
        log.info(`Start get /Notifications `)
        let user;
        if (id){
            user = await userService.getUser({ id: id });
            user = user.toJSON();
        }

        // let ordersArr = await orders.getAllOrdersByUser(id, page, perPage);
        let notificationsArr = await notificationService.getAllUserNotificationsByFilter({id:id}, lang);
        if(notificationsArr.user_notifications && notificationsArr.user_notifications.length) {
            let notificationIds = [];
            notificationsArr = notificationsArr.user_notifications.map(item => {
                let notificationOriginId = item.origin_id ? item.origin_id : item.id ;
                notificationIds.push(notificationOriginId);
                item.difference = new Date().getTime() - new Date(item.created_at).getTime();
                return item;
            }).reverse();
            await notificationService.markAsRead(notificationIds, id);
        } else {
            notificationsArr = [];
        }

        // let favorite = await productService.getCountFavorites(id);
        let notificationsCount = await notificationService.countUserNotifications(id, lang);
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);

        let browserPageName;
        switch (lang) {
            case 'uk':
                browserPageName = "Кабінет"
                break;
            case 'ru':
                browserPageName = "Кабинет"
                break;
            case 'en':
                browserPageName = "Cabinet"
                break;
            default:
                break;
        }
        // let countPages;
        // let minPage, maxPage;
        // let lastElem = true;
        // let isPaginationShow = true;
        // let paginationData = await paginationUtil.pagination(countPages, ordersArr.count, perPage, page, minPage, maxPage, lastElem, isPaginationShow)
        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        log.info(`End get /notifications Result: ${JSON.stringify(notificationsArr)}`);

        res.render('cabinet-pozov/cabinet-notifications', {
            layout: "client/layout.hbs",
            user,
            slugs,
            homePage,
            browserPageName,
            notifications: notificationsArr ? notificationsArr : null,
            lang: lang,
            config: config ? config : null,
            // countPages: paginationData.countPages,
            // isPaginationShow: paginationData.isPaginationShow,
            // pagination: paginationData.pagination,
            // lastElem: paginationData.pagination.lastElem,
            notificationsCount: notificationsCount ? notificationsCount: null,
            consultation_form: await pagesService.getFormByPage(4,lang),
            // favorite: favorite ? favorite : null,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            isCabinet: true,
            menu_panel: 'notifications',
            pagination_js: true,
        });
    },





    favorites: async(req, res) => {
        const lang = req.lang;
        const id = req.user.userid;
        let cart = req.cart;
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/cabinet/favorites'
            } else slugs[languages[i]] = `/${languages[i]}/client/cabinet/favorites`
        }
        if (!id) res.json('No id')
        log.info(`Start get /cabinet/favorites`)
        let user;
        if (id) {
            user = await userService.getUser({ id: id })
            user = user.toJSON();
        }
        let discount = null
        if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
        if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
        if(discount && discount.value) discount = discount.value


        let result = await productService.getFavorites({ user_id: id, lang: lang });
        if(result.rows && result.rows.length){
            for (let i = 0; i < result.rows.length; i++) {
                if(result.rows[i].type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                    result.rows[i].price = null;
                    result.rows[i].discounted_price = null;
                    if(result.rows[i].product_variations && result.rows[i].product_variations.length){
                        let variationsName = result.rows[i].product_variations.find(item => !item.value);
                        if(variationsName && variationsName.name){
                            result.rows[i].product_variations
                                .filter(item => item.value)
                                .map((item, index) => {
                                    let k = item;
                                    if(k.price) k.price = Math.round(k.price/100);
                                    if(k.discounted_price) k.discounted_price = Math.round(k.discounted_price/100);
                                    if(k.name) delete k.name;
                                    if(index === 0){
                                        result.rows[i].price = product_discount_calc(user,k.price,discount);
                                        if(k.discounted_price) result.rows[i].discounted_price = product_discount_calc(user,k.discounted_price,discount);
                                    }
                                    return k
                                });
                        }
                    }
                } else {
                    result.rows[i].product.price = result.rows[i].product.price / 100
                    result.rows[i].product.price = product_discount_calc(user,result.rows[i].product.price,discount)
                    if (result.rows[i].product.discounted_price){
                        result.rows[i].product.discounted_price = result.rows[i].product.discounted_price / 100
                        result.rows[i].product.discounted_price = product_discount_calc(user,result.rows[i].product.discounted_price,discount)

                    }
                }
                let productLink = await linksService.getLinkByFilter({ original_link: `/shop/getProduct/${result.rows[i].product.id}`,lang});
                if (productLink) {
                    productLink = productLink.toJSON();
                    result.rows[i].product.slug = productLink.slug;
                    if(result.rows[i].product.slug) result.rows[i].product.slug = lang === config.LANGUAGES[0] ? `${result.rows[i].product.slug}` : `${lang}/${result.rows[i].product.slug}`;
                }
            }
        }


        let favorite = await productService.getCountFavorites(id);

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Улюблені"
                break;
            case 'ru':
                browserPageName = "Избранные"
                break;
            case 'en':
                browserPageName = "Favourites"
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

        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let lightTheme = true
        log.info(`End /cabinet/favorites Result: ${result} `)
        res.render("cabinet/cabinet-favorites.hbs", {
            layout: "client/layout.hbs",
            favorite: favorite ? favorite : null,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            config: config ? config : null,
            lang: lang ? lang : null,
            result,
            browserPageName,
            user,
            cart,
            homePage,
            lightTheme,
            isCabinet:true
        });
    },
    deleteFavorites: async(req, res) => {
        const id = req.user.userid;
        if (!id) res.json('No id')

        const body = req.body;
        try {
            log.info(
                `Start post /cabinet/onlydeletefavorites. Params: ${JSON.stringify(
                    req.body
                )}`
            );
            let data = {
                product_id: body.product_id,
                user_id: id,
            };
            await productService.deletefavorites(data);
            let result = await productService.getCountFavorites(id);
            log.info(
                `End post /cabinet/onlydeletefavorites. Params: ${JSON.stringify(
                    result
                )}`
            );
            return res.json(result);
        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    addfavorites: async(req, res) => {
        const id = req.user.userid;
        if (!id) return res.json('No id')

        const body = req.body;
        try {
            log.info(
                `Start post /cabinet/addfavorites. Params: ${JSON.stringify(req.body)}`
            );



            let product_id = await productService.getProductByFav(body.product_id);


            let data = {
                product_id: product_id,

                user_id: id,
            };

            let result = await productService.addfavorites(data);
            result = await productService.getCountFavorites(id);
            log.info(
                `End post /cabinet/addfavorites. Result: ${JSON.stringify(result)}`
            );
            return res.json(result);
        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    checkPromocode: async(req, res) => {
        let { user_id, promocode_title, total_price } = req.body;
        const lang = req.lang
        log.info(`Start /check_promocode Params: ${JSON.stringify(req.body)}`);
        if (!promocode_title || !total_price){
            return res.status(errors.CLIENT_BAD_REQUEST.code).json({
                message: errors.CLIENT_BAD_REQUEST.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST.code,
            });
        }

        let promocode = await adminPromocodeService.getPromocode({
            title: promocode_title,
        });
        if (!promocode) {
            return res.status(errors.CLIENT_BAD_REQUEST_PROMOCODE_NOT_FOUND.code).json({
                message: errors.CLIENT_BAD_REQUEST_PROMOCODE_NOT_FOUND.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_PROMOCODE_NOT_FOUND.code,
            });
        }
        if (promocode.status !== config.PROMOCODE_STATUSES[2].value) {
            return res.status(errors.CLIENT_BAD_REQUEST_PROMOCODE_NOT_ACTIVE.code).json({
                message: errors.CLIENT_BAD_REQUEST_PROMOCODE_NOT_ACTIVE.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_PROMOCODE_NOT_ACTIVE.code,
            });
        }
        if (promocode.user_id != user_id && promocode.user_id != 0) {
            return res.status(errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.code).json({
                message: errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.code,
            });
        }
        if (promocode.usage_count >= promocode.total_usage) {
            return res.status(errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.code).json({
                message: errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.code,
            });
        }
        if (promocode.type == config.PROMOCODES_TYPES.VALUE && (total_price - promocode.discount) < 0) {
            return res.status(errors.CLIENT_BAD_REQUEST_PROMOCODE_DISCOUNT_BIGGER_THAN_PRICE.code).json({
                message: errors.CLIENT_BAD_REQUEST_PROMOCODE_DISCOUNT_BIGGER_THAN_PRICE.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_PROMOCODE_DISCOUNT_BIGGER_THAN_PRICE.code,
            });
        }
        let new_price;
        let discount;
        if (promocode.type == config.PROMOCODES_TYPES.PERCENT) {
            discount = total_price * (promocode.discount / 100);
            new_price = total_price - discount;
        } else if (promocode.type == config.PROMOCODES_TYPES.VALUE) {
            discount = promocode.discount;
            new_price = total_price - promocode.discount;
        } else {
            return res.status(errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.code).json({
                message: errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED.code,
            });
        }
        log.info(`End /check_promocode Result: ${JSON.stringify({ discount, new_price: new_price, promocode_id: promocode.id,promocode_title: promocode.title })}`);
        res.status(200).json({ discount: Math.round(discount), new_price: Math.round(new_price), promocode_id: promocode.id,promocode_title: promocode.title });
    },
    networksWithStores: async(req, res) => {
        const lang = req.lang;
        log.info(`Start  get /networksWithStores  `);
        let getStores = await clientService.networks_with_stores(lang);
        let markers = [];
        getStores.forEach((item) => {
            let days
            if (item.hours) days = item.hours.split(":")[0];
            let workHours
            if(item.hours) workHours = item.hours.split(":");
            workHours = workHours.splice(1, workHours.length - 1);
            workHours = workHours.join(":");
            item.days = days;
            item.workHours = workHours;
        });
        for (let i = 0; i < getStores.length; i++) {
            let dataString = "";
            if (getStores[i].images[0].type) {
                dataString =
                    `<div class="info-box-inner">
                    <i></i>
                    <div class="info-box-img"><img src="${handlebarHelpers.imagePath(getStores[i].images[0].block_image,'350X167')}" alt="${getStores[i].images[0].block_image.alt_text}" /></div>
                    <div class="info-box-text">
                        <div class="title">${getStores[i].title}</div>
                        <div class="contact-item">
                            <div class="contact-img"><img src="/img/icons/icon-4.svg" alt="" /></div>
                            <div class="contact-info"><div>${getStores[i].address}</div></div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-img"><img src="/img/icons/icon-2.svg" alt="" /></div>
                            <div class="contact-info"><a href="tel:${getStores[i].phone}">${getStores[i].phone}</a></div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-img"><img src="/img/icons/icon-3.svg" alt="" /></div>
                            <div class="contact-info">
                                ${getStores[i].workHours}
                            </div>
                        </div>
                    </div>
            </div>`;
            } else
                dataString =
                    `<div class="info-box-inner">
                <i></i>
                <div class="info-box-img"><img src="${handlebarHelpers.imagePath(getStores[i].images[0].block_image,'350X167')}" alt="${getStores[i].images[0].block_image.alt_text}" /></div>
                <div class="info-box-text">
                    <div class="title">${getStores[i].title}</div>
                    <div class="contact-item">
                        <div class="contact-img"><img src="/img/icons/icon-4.svg" alt="" /></div>
                        <div class="contact-info"><div>${getStores[i].address}</div></div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-img"><img src="/img/icons/icon-2.svg" alt="" /></div>
                        <div class="contact-info"><a href="tel:${getStores[i].phone}">${getStores[i].phone}</a></div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-img"><img src="/img/icons/icon-3.svg" alt="" /></div>
                        <div class="contact-info">
                            ${getStores[i].workHours}
                        </div>
                    </div>
                </div>
            </div>`;




            markers.push({
                id: getStores[i].id,
                dataRel: "map",
                dataCity: getStores[i].city.city ? getStores[i].city.city : null,
                dataLat: getStores[i].map_lat ? getStores[i].map_lat : null,
                dataLng: getStores[i].map_lng ? getStores[i].map_lng : null,
                dataImg: getStores[i].icon && getStores[i].icon.type && getStores[i].icon.filename ? handlebarHelpers.imagePath(getStores[i].icon, 'original') : null,
                dataImgActive: getStores[i].icon_hover && getStores[i].icon_hover.type && getStores[i].icon_hover.filename ?  handlebarHelpers.imagePath(getStores[i].icon_hover, 'original') : null,
                dataName: getStores[i].title ? getStores[i].title : null,
                dataCont: getStores[i].hours ? getStores[i].hours : null,
                dataAdress: getStores[i].address ?  `<p>${getStores[i].address}</p>` : null,
                dataString: dataString ? dataString : null,
            });
        }
        log.info(`End /networksWithStores Result: ${JSON.stringify(markers)}`);
        res.json({ markers: markers });
    },
    clientfavorites: async(req, res) => {
        const lang = req.lang;
        let cart = req.cart;
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/favorites'
            } else slugs[languages[i]] = `/${languages[i]}/client/favorites`
        }
        let favProductsIds = req.favProducts
        log.info(`Start get /favorites`)
        let result
        if (favProductsIds && favProductsIds.length) {
            result = await productService.getAllProductsByFav(favProductsIds, lang);
            for (let i = 0; i < result.rows.length; i++) {
                if(result.rows[i].type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                    result.rows[i].price = null;
                    result.rows[i].discounted_price = null;
                    if(result.rows[i].product_variations && result.rows[i].product_variations.length){
                        let variationsName = result.rows[i].product_variations.find(item => !item.value);
                        if(variationsName && variationsName.name){
                            result.rows[i].product_variations
                                .filter(item => item.value)
                                .map((item, index) => {
                                    let k = item;
                                    if(k.price) k.price = Math.round(k.price/100);
                                    if(k.discounted_price) k.discounted_price = Math.round(k.discounted_price/100);
                                    if(k.name) delete k.name;
                                    if(index === 0){
                                        result.rows[i].price = product_discount_calc(user,k.price,discount);
                                        if(k.discounted_price) result.rows[i].discounted_price = product_discount_calc(user,k.discounted_price,discount);
                                    }
                                    return k
                                });
                        }
                    }
                } else {
                    result.rows[i].price = result.rows[i].price / 100
                    if (result.rows[i].discounted_price){
                        result.rows[i].discounted_price = result.rows[i].discounted_price / 100
                    }
                }


                favProductsIds.forEach((e) => {
                    if (result.rows[i].id == e) {
                        result.rows[i].favourite = true;
                    }
                });
            }

        }
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let lightTheme = true

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Улюблені"
                break;
            case 'ru':
                browserPageName = "Избранные"
                break;
            case 'en':
                browserPageName = "Favourites"
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

        log.info(`End get /favorites Result: ${JSON.stringify(result)}`)
        res.render("client/favourites", {
            layout: "client/layout.hbs",
            favorite: result && result.rows && result.rows.length ? result.rows.length : null,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            lang: lang ? lang : null,
            result,
            homePage,
            browserPageName,
            cart,
            slugs,
            lightTheme,
            isCabinet:true
        });
    },
    buyOnClick: async(req, res) => {
        let { name, phone, form_id, count, product_id, custom_s, custom_h, custom_l, custom_l1, custom_l2, custom_m, custom_d, variation_id,default_atr } = req.body;
        const lang = req.lang;
        const languages = config.LANGUAGES
        const transaction = await sequelize.transaction();
        try {
            log.info(`Start  post /buyOnClick ${JSON.stringify(req.body)} `);

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


            if (!name && !phone) {
                return res
                    .status(errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code)
                    .json({
                        message: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message[lang],
                        errCode: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });
            }

            if (phone && (!config.REGEX_PHONE.test(phone) || phone.length != 19)) {
                return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
                    message: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code,
                });
            }
            let total_price
            let prod
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
                prod = productPriceUtil.countPrice(product, false, false, custom_s, custom_h, user, discount);
            }else if(product.type && product.type == config.PRODUCT_TYPES.SHOWER){
                if (Number.isNaN(custom_s) || Number.isNaN(custom_h)) {
                    throw new Error("custom_s and custom_h must be INT !")
                }
                prod = productPriceUtil.countShowerPrice(product, false, false, custom_s, custom_h, custom_l, custom_l1, custom_l2, custom_m,custom_d, user, discount,product.changedMat,product.changedMatAtrId);
            }else if(product.type && product.type == config.PRODUCT_TYPES.SIMPLE){
                prod = product;
            } else if(product.type && product.type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                prod = product
                let getVariation = await productService.getProductVariation({id:variation_id})
                if(getVariation){
                    getVariation.price = getVariation.price / 100
                    getVariation.price = product_discount_calc(user,getVariation.price,discount);
                    result.price = getVariation.price
                    if(getVariation.discounted_price){
                        getVariation.discounted_price = getVariation.discounted_price / 100
                        getVariation.discounted_price = product_discount_calc(user,getVariation.discounted_price,discount);
                        result.discounted_price = getVariation.discounted_price
                    }


                }

            }

            if(prod.discounted_price){
                total_price = prod.discounted_price*count
            } else total_price = prod.price*count


            let productLink = await linksService.getLinkByFilter({
                original_link: `/shop/getProduct/${prod.id}`,
                lang
            });
            if (productLink) {
                productLink = productLink.toJSON();
                prod.slug = productLink.slug;
            }

            if(default_atr && default_atr.length){
                for(let item of default_atr){
                    if(item.originAtrGrId == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                        let originProdId = product.origin_id ? product.origin_id : product.id
                        let attr = await productService.getProdToAtrByFilter({attribute_id: item.originAtrId,product_id:originProdId })
                        if(attr.image){
                            product.image = attr.image
                        }
                    }
                }
            }


            let form = await formsService.getFormById(form_id);
            let original_id
            if(form.origin_id == 0){
                original_id = form.id
            } else original_id = form.origin_id
            if (form) {
                let message =  `Нова консультація по товару ${prod.name}   sku:${prod.sku}  Кількість: ${count}  Загальна ціна: ${total_price} грн.
                Лінк: ${config.FRONT_URL}/${prod.slug}`;
                let messageEmail = `Нова консультація по товару ${prod.name}   sku:${prod.sku}  Кількість: ${count}  Загальна ціна: ${total_price} грн.`;
                let link = `${config.FRONT_URL}/${prod.slug}`

                await formsService.createFormComment({ message, phone, name, form_id: original_id, created_at: new Date().toISOString() });

                if (prod) {
                    if (form.emails) {
                        let getOriginForm = await formsService.getFormById(original_id);
                        let adminEmails = form.emails.trim().split(",");
                        for (let adminEmail of adminEmails) {
                            let mailObj = {
                                to: adminEmail,
                                subject: getOriginForm.title,
                                data: {
                                    info: { message: messageEmail, name,phone,link },
                                    lang:'uk'
                                }
                            };
                            emailUtil.sendMail(mailObj, 'form-question-to-admin');

                        }
                    }
                }
            }

            await transaction.commit();
            res.status(200).json(true);

            log.info("End  post /buyOnClick ");
        } catch (error) {
            await transaction.rollback();
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getNovaPoshta: async(req,res) => {
        log.info(`Start  post /getNovaPoshta ${JSON.stringify(req.body)} `);
        let delivery_types = await models.configs.findOne({ where: { type: 'delivery_types' } });
        delivery_types = JSON.parse(delivery_types.value);
        let api_key = delivery_types[2].api_key
        if(!req.body.second_req){
            axios({
                method: 'post',
                url: 'https://api.novaposhta.ua/v2.0/json/',
                data: JSON.stringify({
                    modelName: 'Address',
                    calledMethod: 'searchSettlements',
                    methodProperties: {
                        CityName: req.body.request_term,
                        Limit: 555,
                        Language: req.body.lang
                    },
                    apiKey: api_key
                }),
            }).then((response) => {
                return res.json(response.data)
            }, (error) => {
            });
        }else {
            axios({
                method: 'post',
                url: 'https://api.novaposhta.ua/v2.0/json/',
                dataType: 'json',
                data: JSON.stringify({
                    modelName: "AddressGeneral",
                    calledMethod: "getWarehouses",
                    methodProperties: {
                        CityRef: req.body.value_selected,
                        TypeOfWarehouseRef : "9a68df70-0267-42a8-bb5c-37f427e36ee4",
                        Language: req.body.lang
                    },
                    apiKey: api_key
                })
            }).then((response) => {
                return res.json(response.data)
            }, (error) => {
            });
        }
        log.info(`End post /getNovaPoshta`);
    },
    thankYou: async(req,res) => {
        const lang = req.lang
        let service_id = req.params.service_id
        let id, user, notificationsCount;
        if(req.user && req.user.userid){
            id = req.user.userid
        } else if(req.userid) {
            id = req.userid;
        } else id = req.tempUser;
        if (id){
            user = await userService.getUser(id, ['id', 'first_name', 'last_name',"father_name", 'email', 'phone', "role","address","house","inn","num_passport"]);
            notificationsCount = await notificationService.countUserNotifications(id, lang);
            user = user ? user.toJSON() : user;
            user = {...user };
        }
        const userId = req.user ? req.user.userid : null;

        if(!id) id = req.params.user_id
        if (!id) res.json('No id')

        let order = await bookingService.getBookingByFilter({user_id:id,id:req.params.order_id},null,true)

        if (req.params.payment_type == 1){
            if(order.status != 7 && order.status != 8){
                setTimeout( await checkOrder,1000)
            }
        }
        async function checkOrder  (){
            order = await bookingService.getBookingByFilter({user_id:id,id:req.params.order_id},null,true)
            if(order.status != 7 && order.status != 8){
                await models.orders.update({ status: 13 },{where:{ id: order.id }})
                let link = await models.links.findOne({where:{original_link:`/shop/getService/${service_id}`}})
                if(lang == 'uk') return  res.redirect(`/${link.slug}`)
                return  res.redirect(`/${lang}/${link.slug}`)
            }
        }
        let slugs = {}

        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = `/payment/thank_you/${req.params.order_id}/${id}/${req.params.payment_type}/${service_id}`
            } else slugs[languages[i]] = `/${languages[i]}/payment/thank_you/${req.params.order_id}/${id}/${req.params.payment_type}/${service_id}`
        }
        log.info(`Start get /thank_you`);
        try {
            let service_title
            if(service_id){
                service_title = await models.service.findOne({where:{id:service_id},raw:true,attributes:['title','id']})
                if(service_title)service_title = service_title.title
            }
            let plaintiff
            let defendant
            if(order){
                if(order.orders_form_results && order.orders_form_results.length){
                    for(let item of order.orders_form_results){
                        if(item.type == config.FORM_FIELDS_TYPES.INFO_BLOCK){
                            let val = item.value.split(';')
                            if(val.length > 1){
                                plaintiff = val[0]
                                defendant = val[1]
                            }else{
                                plaintiff = val[0]
                            }
                        }
                    }
                }
                if(plaintiff && plaintiff.length){
                    plaintiff = plaintiff.split(',')
                }
                if(defendant && defendant.length){
                    defendant = defendant.split(',')
                }
            }
            let service = await models.service.findOne({where:{id:order.service_id},raw:true})
            let send_to_mail = service.options ? JSON.parse(service.options) :null
            if(send_to_mail && send_to_mail.in_create && send_to_mail.in_create == true && send_to_mail.message_to_e_mail && order.pay_status == config.BOOKING_PAY_STATUSES.PAID && order.send_status == 1) {
                let files = await models.orders_to_user_uploaded_files.findOne({
                    where: {order_id: order.id},
                    raw: true
                })
                let file_name
                if (files) {
                    files = await models.user_uploaded_files.findOne({
                        where: {id: files.user_uploaded_files_id},
                        raw: true
                    })
                    file_name = files.filename
                }
                let clientMailObj = {
                    to: order.user.email,
                    subject: 'Доброго дня, ваш документ!',
                    data: {
                        name: service.title,
                        order: order,
                        lang: lang
                    },
                    attachments: [
                        {
                            path: config.FRONT_URL + '/booking/getFileOrders/' + order.id,
                            filename: file_name
                        }
                    ]
                };
                emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                await models.orders.update({send_status: 2}, {where: {id: order.id}})
            }
            // let notificationsCount = await notificationService.countUserNotifications(id, lang);

            let menu = await menuService.getMenu(lang);
            let header_footer = await menuService.getHeaderFooter(lang);

            if(req.method === 'POST' && !user) res.redirect(req.originalUrl);

            log.info(`End get /thank_you.`);
            res.render("client/thank-you", {
                layout: "client/layout.hbs",
                menu,
                slugs,
                user,
                order:order,
                notificationsCount: notificationsCount ? notificationsCount: null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                header_footer: header_footer ? header_footer : null,
                lang: lang ? lang : null,
                plaintiff,
                defendant,
                service_title
            });
        } catch (err) {
            log.error(`${err}`);
            await transaction.rollback();
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    thankYouCabinet:async (req,res)=>{
        const lang = req.lang
        let service_id = req.params.additional_id
        let id
        if(req.user && req.user.userid){
            id = req.user.userid
        } else if(req.userid) {
            id = req.userid;
        } else id = req.tempUser;
        let user;
        if (id){
            user = await userService.getUser({ id: id });
            user = user.toJSON();
        }
        if(!id) id = req.params.user_id
        if (!id) res.json('No id')

        let order = await bookingService.getBookingByFilter({user_id:id,id:req.params.order_id},null,true)

        if (req.params.payment_type == 1){
            if(order.status != 7 && order.status != 8){
                await models.orders.update({ status: 13 },{where:{ id: order.id }})
                if(lang == 'uk') return  res.redirect(`/client/history-orders`)
                return  res.redirect(`/${lang}/client/history-orders`)
            }
        }
        let slugs = {}

        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = `/payment/cabinet/thank_you/${req.params.order_id}/${id}/${req.params.payment_type}/${service_id}`
            } else slugs[languages[i]] = `/${languages[i]}/payment/cabinet/thank_you/${req.params.order_id}/${id}/${req.params.payment_type}/${service_id}`
        }
        log.info(`Start get /thank_you`);
        try {
            let service_title
            if(service_id){
                service_title = await models.service_additional.findOne({where:{id:service_id},raw:true,attributes:['title','id']})
                if(service_title)service_title = service_title.title
            }
            let plaintiff
            let defendant
            if(order){
                if(order.orders_form_results && order.orders_form_results.length){
                    for(let item of order.orders_form_results){
                        if(item.type == config.FORM_FIELDS_TYPES.INFO_BLOCK){
                            let val = item.value.split(';')
                            if(val.length > 1){
                                plaintiff = val[0]
                                defendant = val[1]
                            }else{
                                plaintiff = val[0]
                            }
                        }
                    }
                }
                if(plaintiff && plaintiff.length){
                    plaintiff = plaintiff.split(',')
                }
                if(defendant && defendant.length){
                    defendant = defendant.split(',')
                }
            }
            let service = await models.service_additional.findOne({where:{id:order.additional_id},raw:true})
            let origin_service_title
            if(service){
                let options = await models.service.findOne({where:{id:service.service_id},raw:true,attributes:['options','id','title']})
                if(options){
                    service.options = options.options
                    origin_service_title = options.title
                }
            }
            let send_to_mail = service.options ? JSON.parse(service.options) :null
            if(send_to_mail && send_to_mail.in_create && send_to_mail.in_create == true && send_to_mail.message_to_e_mail && order.pay_status == config.BOOKING_PAY_STATUSES.PAID && order.send_status == 1) {
                let files = await models.orders_to_user_uploaded_files.findOne({
                    where: {order_id: order.id},
                    raw: true
                })
                let file_name
                if (files) {
                    files = await models.user_uploaded_files.findOne({
                        where: {id: files.user_uploaded_files_id},
                        raw: true
                    })
                    file_name = files.filename
                }
                let clientMailObj = {
                    to: order.user.email,
                    subject: 'Доброго дня, ваш документ!',
                    data: {
                        name: service.title,
                        order: order,
                        lang: lang
                    },
                    attachments: [
                        {
                            path: config.FRONT_URL + '/booking/getFileOrders/' + order.id,
                            filename: file_name
                        }
                    ]
                };
                emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                await models.orders.update({send_status: 2}, {where: {id: order.id}})
            }
            let notificationsCount = await notificationService.countUserNotifications(id, lang);

            let menu = await menuService.getMenu(lang);
            let header_footer = await menuService.getHeaderFooter(lang);
            let homePage = {}
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                homepageLink = homepageLink.toJSON()
                homePage.slug = homepageLink.slug
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }
            let browserPageName;
            switch (lang) {
                case 'uk':
                    browserPageName = "Кабінет"
                    break;
                case 'ru':
                    browserPageName = "Кабинет"
                    break;
                case 'en':
                    browserPageName = "Cabinet"
                    break;
                default:
                    break;
            }

            if(req.method === 'POST' && !user) res.redirect(req.originalUrl);

            log.info(`End get /thank_you.`);
            res.render("cabinet-pozov/thank-you", {
                order:order,
                notificationsCount: notificationsCount ? notificationsCount: null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                header_footer: header_footer ? header_footer : null,
                lang: lang ? lang : null,
                plaintiff,
                defendant,
                service_title,
                layout: "client/layout.hbs",
                user,
                menu,
                service,
                origin_service_title,
                slugs,
                homePage,
                browserPageName,
                config: config ? config : null,
                // favorite: favorite ? favorite : null,
                isCabinet: true,
                menu_panel: 'history_orders',
            });
        } catch (err) {
            log.error(`${err}`);
            await transaction.rollback();
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    liqPayCallBack : async ( req, res ) => {
        let buff = new Buffer( req.body.data, 'base64');
        let data = buff.toString();

        let pay_types = await models.configs.findOne({ where: { type: 'pay_types' } });
        pay_types = JSON.parse(pay_types.value);

        let public_key = pay_types[1].liqpay_public_key
        let private_key = pay_types[1].liqpay_private_key

        data = JSON.parse(data)
        const  LiqPay  = require('../utils/liqpay-util');
        const  liqpay = new LiqPay(public_key, private_key);
        const signature = liqpay.str_to_sign(
            private_key +
            req.body.data +
            private_key
        );
        if(req.query.order_id){
            data.order_id = req.query.order_id
        }
        if (data && data.status && data.status == "success"  && signature == req.body.signature){
            await models.orders.update({ status: 7,pay_status:config.BOOKING_PAY_STATUSES.PAID},{where:{ id: data.order_id }})
        }else{
            await models.orders.update({ status: 13,pay_status:config.BOOKING_PAY_STATUSES.NOT_PAID},{where:{ id: data.order_id }})
        }
        await notificationService.createNotification(config.NOTIFICATION_TYPES.ORDER, null, null, data.order_id);
        return res.status(200).json(true);
    },

    getTempUserID: async(req,res) => {
        let id = uuid.v1()
        return res.json(id)
    },
    documents: async(req,res) => {
        const id = req.user.userid;
        const lang = req.lang;
        let cart = req.cart;
        log.info(`Start get /cabinet/documents`);
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/client/cabinet'
            } else slugs[languages[i]] = `/${languages[i]}/client/cabinet`
        }
        if (!id) res.json('No id')
        let page_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
        if (page_settings && page_settings.cabinet) page_settings = page_settings.cabinet
        try {

            let user = await userService.getUser({ id: id });
            user = user.toJSON();
            let discount
            if (user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
            if (user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
            let favorite = await productService.getCountFavorites(id);
            let menu = await menuService.getMenu(lang);
            let header_footer = await menuService.getHeaderFooter(lang);

            let getAllCollections = await productService.getAllCategoriesByFilter({status:config.GLOBAL_STATUSES.ACTIVE,lang,lang})
            getAllCollections = getAllCollections.map(item => item.toJSON())

            let browserPageName

            switch (lang) {
                case 'uk':
                    browserPageName = "Кабінет"
                    break;
                case 'ru':
                    browserPageName = "Кабинет"
                    break;
                case 'en':
                    browserPageName = "Cabinet"
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


            log.info(`End get /cabinet/documents`)
            res.render("cabinet/cabinet-documents", {
                layout: "client/layout.hbs",
                menu,
                slugs,
                cart,
                page_settings: page_settings ? page_settings : null,
                header_footer: header_footer ? header_footer : null,
                favorite: favorite ? favorite : null,
                config: config ? config : null,
                lang: lang ? lang : null,
                user,
                homePage,
                getAllCollections,
                browserPageName,
                isCabinet:true
            });
        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    exportCatProductsXLS: async(req,res) => {
        const id = req.user.userid;
        if (!id) return res.json('No id')
        let user;
        if (id) {
            user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone','role','coeficient','retail_prices','discount']);
            if(user) user.toJSON()
        }
        let lang = req.lang
        let discount = null
        if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
        if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
        if(discount && discount.value) discount = discount.value

        const category = req.params.category_id

        try {
            log.info(
                `Start exportCatProductsXLS`
            );
            let resultsArr = []
            let categoryTitle = await productService.getCagegoryById(category)
            categoryTitle = categoryTitle.title

            let getCurrentTime = new Date().toISOString()

            let result = await models.product.findAll({
                where:{status:config.GLOBAL_STATUSES.ACTIVE},
                include: [
                    {
                        model: models.product_category,
                        as: 'category',
                        required: true,
                        through: { attributes: ['product_category_id'], where: {'product_category_id': category} }
                    },
                    {
                        model: models.product_to_attribute,
                        where: {attribute_id: null},
                        required: true,
                    },
                ],
            })
            if(result && result.length) {

                result = result.map(item => item.toJSON())
                let count = 0
                for (let product of result){

                    if(product.product_to_attributes && product.product_to_attributes.length){

                        product.dimensions =  product.product_to_attributes
                        for (const dimension of product.dimensions) {
                            count ++
                            resultsArr = JSON.stringify(resultsArr)
                            let obj = productPriceUtil.countPrice(product, false,false,dimension.s,dimension.h,null,null)
                            obj.retail_price = product_discount_calc_without_coef(user,obj.price,discount)
                            obj.price = Math.ceil(obj.price)
                            obj.retail_price = Math.ceil(obj.retail_price)
                            obj.dimension = dimension.value
                            obj.order_number = count
                            resultsArr = JSON.parse(resultsArr)
                            resultsArr.push(obj)
                        }
                    }
                }

            }
            let file = await exportXlsUtil.exportXlsCategoryProducts(resultsArr,lang,categoryTitle,getCurrentTime);
            log.info(`End exportCatProductsXLS`);
            res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(file);
        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },
    generateRewiewPDF: async(req,res) => {
        log.info(`Start generateRewiewPDF data:${JSON.stringify(req.query)}`)
        try {
            let { id, s, h, l, l1, l2, m, d, default_atr} = req.query;
            //TODO validation
            if(!id){
                return res.status(errors.BAD_REQUEST_INVALID_BODY_REQUEST.code).json({
                    message: errors.BAD_REQUEST_INVALID_BODY_REQUEST.message,
                    errCode: errors.BAD_REQUEST_INVALID_BODY_REQUEST.code
                });
            }

            let lang = req.lang;
            if (!lang) lang = config.LANGUAGES[0]
            const userId = req.user ? req.user.userid : null;
            let user;
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
                        result = productPriceUtil.countPrice(result, false, false, s, h, user, discount);
                    }else if(result.type == config.PRODUCT_TYPES.SHOWER){
                        result = productPriceUtil.countShowerPrice(result, false, false, s, h, l, l1, l2, m, d, user, discount,result.changedMat,result.changedMatAtrId);
                    }
                }else{
                    if(result.type == config.PRODUCT_TYPES.GLASS){
                        result = productPriceUtil.countPrice(result, false, false, s, h);
                    }else if(result.type == config.PRODUCT_TYPES.SHOWER){
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

                if(result && result.steps && result.steps.length){

                    for(let step of result.steps){
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
                }
                result = await productCompositeImagesFromOptionsUtil(result)
            }




            let pdf
            if(result && result.type == config.PRODUCT_TYPES.GLASS){
                pdf = await pdfUtil.generatePdf({result: result,lang},'client/review_pdfs/review_mirror_pdf')
            }else if(result && result.type == config.PRODUCT_TYPES.SHOWER){
                pdf = await pdfUtil.generatePdf({result: result,lang},'client/review_pdfs/review_shower_pdf')
            }

            log.info(`End generateRewiewPDF`)

            res.set("Content-Type", "application/pdf");
            res.send(pdf)

        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    savaProductReview: async(req, res) => {
        try {
            let result;
            let { product_id, parent_id, name, email, rating=5, text } = req.body;
            const lang = req.body.lang ? req.body.lang : req.lang;

            log.info(`Start /savaProductReview Params: ${JSON.stringify(req.body)}`);
            if (!product_id || !parent_id || !name || !email) {
                return res
                    .status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code)
                    .json({
                        message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                        errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });
            }

            if (!config.REGEX_EMAIL.test(email)) {
                return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                });
            }

            let product = await productService.getProductByFilter({
                [Op.or]: [ { id: product_id, lang }, { origin_id: product_id, lang } ],
            });

            let checkProductReviewsConfig = await models.configs.findOne({
                where: { type: "check_product_reviews" },
                raw: true,
            });
            let isValidate = checkProductReviewsConfig && checkProductReviewsConfig.value
                ? JSON.parse(checkProductReviewsConfig.value)
                : 1;

            if (product) {
                let originProductId = product.origin_id ? product.origin_id : product.id;

                product = product.toJSON();
                result = await productTestimonialsService.createProductTestimonial({
                    origin_product_id: originProductId,
                    parent_id,
                    name,
                    email,
                    status: isValidate && isValidate.status ?
                        config.GLOBAL_STATUSES.WAITING : config.GLOBAL_STATUSES.ACTIVE,
                    rating,
                    published_at: new Date().toISOString(),
                    text,
                });
                if (result) {
                    result = result.toJSON();
                    result.published_at = moment(new Date(result.published_at)).format(
                        "MM.DD.YYYY"
                    );

                    result.answers = [];
                    result.product_id = originProductId;
                }
            }

            if (isValidate && !isValidate.status) {
                let htmlComment;
                if (result.parent_id != 0) {
                    htmlComment = await templateUtil.getTemplate({ result, lang: lang ? lang : null },
                        "client/product-reviews-answer-ajax"
                    );
                } else {
                    htmlComment = await templateUtil.getTemplate({ result, lang: lang ? lang : null },
                        "client/product-reviews-ajax"
                    );
                }
                log.info(`End /savaProductReview`)
                return res.status(200).json({ html: htmlComment });
            } else {
                let text

                switch (lang) {
                    case 'uk':
                        text = "Дякуємо за відгук!"
                        break;
                    case 'ru':
                        text = "Спасибо за ваш отзыв!"
                        break;
                    case 'en':
                        text = "Thank you for your comment!"
                        break;
                    default:
                        break;
                }
                log.info(`End /savaProductReview Result: ${JSON.stringify({ message: text })}`)
                return res.status(200).json({ message: text });
            }
        } catch (err) {
            log.error(`${err}`)
            return res.status(400).json({
                message: err.message,
                errCode: 400,
            });
        }
    },
    showMoreProductReview: async(req, res) => {
        try {
            log.info(`Start /showMoreProductReview Params: ${JSON.stringify(req.body)}`);
            let result;
            let { product_id, page } = req.body;
            page = page ? parseInt(page) : 1;
            const lang = req.body.lang ? req.body.lang : req.lang;

            if (!product_id) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code)
                    .json({
                        message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                        errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });
            }
            let isShowMore = false;
            let testimonials = await productTestimonialsService.getAllProductTestimonialsByFilter({
                origin_product_id: product_id,
                parent_id: 0,
                status: config.GLOBAL_STATUSES.ACTIVE,
            }, page, 3, true);

            if(testimonials && testimonials.data && testimonials.data.length){
                testimonials.data = await productTestimonialsService.getAllProductTestimonialsAnswersByFilter(testimonials.data);
                isShowMore = testimonials.isShowMore
            }

            let htmlComment = await templateUtil.getTemplate({
                    id: product_id,
                    testimonials: testimonials.data,
                    lang: lang ? lang : null
                },
                "client/product-show-more-reviews-ajax"
            );
            log.info(`End /savaProductReview`)
            return res.status(200).json({ html: htmlComment, isShowMore });

        } catch (err) {
            log.error(`${err}`)
            return res.status(400).json({
                message: err.message,
                errCode: 400,
            });
        }
    },
    getAutocompleteServices : async (req, res) => {
        try {
            let result = [];
            log.info(`Start /getAutocompleteServices`);
            let services = await models.service.findAll({attributes: ['title','id'], where: {lang: req.lang}});
            services = await Promise.all(services.map(async item => {
                item = item.toJSON();
                let link = extraUtil.generateLinkUrlForPage(null, item.id, 'service');
                let link_slug = await linksService.getLinkByFilter({ original_link: link });
                item.slug = '/' + link_slug.slug;
                result.push(item);
                return item;
            }));
            let news = await models.posts.findAll({attributes: ['title','id'], where: {lang: req.lang}});
            news = await Promise.all(news.map(async item => {
                item = item.toJSON();
                let link_slug = await linksService.getLinkByFilter({ original_link: `/getPost/${item.id}` });
                item.slug = '/' + link_slug.slug;
                result.push(item);
                return item;
            }));
            log.info(`End /getAutocompleteServices Result: ${JSON.stringify({ services })}`);
            return res.status(200).json(result);
        } catch (error) {
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },


    signDia: async (req,res) =>{
        log.info(`Start /signDia data: ${JSON.stringify(req.body)}`);
        try {
            let result = await DIA.getDeepLink('sadsadsada');
            log.info(`End /signDia data: ${result}`);
            res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    sendToCourt: async (req, res) => {
        log.info(`Start /sendToCourt data: ${JSON.stringify(req.params)}`);
        try {
            let result = false;
            if(req.params.order_id) {
                let order_id = req.params.order_id;
                let order = await models.orders.findOne({
                    where: { id: order_id },raw:true
                });
                let user = await userService.getUser({id:order.user_id}, ['id', 'first_name', 'last_name', 'email', 'phone']);
                let court = await models.courts.findOne({where:{id:order.court_id},raw:true})
                if(court && court.email){
                    let mailObjToCourt = {
                        to: court.email,
                        subject: config.TEXTS[config.LANGUAGES[0]].sign_court,
                        data: {
                            info: {
                                subject: config.TEXTS[config.LANGUAGES[0]].sign_court,
                                first_name: user.first_name,
                                lang: config.LANGUAGES[0]
                            },
                            lang: config.LANGUAGES[0]
                        },
                        attachments:[
                            {
                                path: config.FRONT_URL + '/downloadOrderFiles/' + order.id,
                                filename: `order_${order.id}.zip`
                            }
                        ]
                    };
                    emailUtil.sendMail(mailObjToCourt, "form-to-client");
                }
                // add key
                await models.orders.update({is_court_send: true,status:21},{where:{id:order.id}});
            }
            log.info(`End /sendToCourt data: ${result}`);
            res.status(200).json(result);
        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    signOrderHelloSign: async (req,res) =>{
        log.info(`Start /signOrderHelloSign data: ${JSON.stringify(req.body)}`);
        let signatureUrl, user;
        const lang = req.lang;
        try {
            let order = await ordersService.getOrdersByFilter({ id: req.params.order_id });
            user = await userService.getUser({ id: req.user.userid });
            user = user.toJSON();
            if(order.signature_request_id) {
                log.info(`End /signOrderHelloSign data: https://app.hellosign.com/sign/${order.signature_request_id}`);
                return res.status(200).json({ url: `https://app.hellosign.com/sign/${order.signature_request_id}` });
            } else {
                let service = await ordersService.getService({[Op.or]: [{ id: order.service_id, lang: lang }, { origin_id: order.service_id, lang: lang }]});
                let html = service ? service.template_hello_sign : '';
                let show_tags = false;
                if(html.includes('[[admin_sign_tag]]') || html.includes('[[client_sign_tag]]')) {
                    show_tags = true;
                    html = html.replace('[[client_sign_tag]]','<span style="color:white;position: relative;top: 10px;">[sig|req|signer1]</span>');
                    html = html.replace('[[admin_sign_tag]]','<span style="color:white;position: relative;top: 10px;">[sig|req|signer2]</span>');
                }
                if(order.orders_form_results && order.orders_form_results){
                    order.orders_form_results.forEach(item => {
                        html = html.replace( new RegExp( `{{${item.name_field}}}`, "g" ), item.value );
                    })
                }
                let court = await models.courts.findOne({where: {id: order.court_id, lang: lang}});
                if(court) {
                    let court_html = '<p style="text-align: right;">'
                    if(court.title) court_html += `<span lang="${lang}">${court.title}</span><br>`;
                    if(court.address) court_html += `<span lang="${lang}">${court.address}</span><br>`;
                    if(court.email) court_html += `<span lang="${lang}">${court.email}</span><br>`;
                    court_html += '</p>';
                    html = court_html + html;
                }
                let contract_text
                if(lang == 'uk'){
                    contract_text = 'ДОГОВІР №'
                }else{
                    contract_text = 'CONTRACT №'
                }
                if(contract_text){
                    let today
                    if(order.created_at){
                        today = order.created_at
                    }
                    if(today){
                        today = today.setHours(today.getHours() + 3)
                        today = moment(today).format('DD.MM.YYYY');
                        contract_text = contract_text +' ' +today
                    }
                    contract_text = contract_text + ' - ' + order.id
                    html = html.replace( new RegExp( '{{contract_number}}', "g" ), contract_text);

                }
                if(lang == 'uk') {
                    let today = new Date()
                    today = today.setHours(today.getHours() + 3)
                    let today_moon = moment(today).locale(lang).format('MMMM')
                    let tooday_day = moment(today).date();
                    let tooday_year = moment(today).year();
                    let date_text = tooday_day + ' ' + today_moon + ' ' + tooday_year + ' ' + 'року'
                    html = html.replace( new RegExp( '{{today_date}}', "g" ), date_text )
                }
                // html = handlebars.compile(html);
                // html = await html();
                html =  html.replace(/ *\{[^}]*\} */g,'')
                html =  html.replace(/}/g,'')

                const browser = await Puppeteer.launch({
                    headless: true,
                    args: ['--use-gl=egl'],
                });
                const page = await browser.newPage();
                await page.setContent(html);
                const contract = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: { left: 50, top: 20, right: 50 }
                });
                // let contract = await html_to_pdf.generatePdf({ content: html }, { format: 'A4', margin: {left: '50px', right: '50px', top: '20px'} });
                const formData = new FormData();
                let docName = service.title + ' - ' + order.user.first_name + ' ' + order.user.last_name;
                docName = docName.replace(/<[^>]*>?/gm, '');
                formData.append('order_id', order.id);
                formData.append('document', contract, `documents/${docName}.pdf`);
                formData.append('user_id',order.user_id);
                let result = await axios.post(`${config.FRONT_URL}/upload/uploadFileServiceDocument?client_id=${order.user_id}`,formData,{
                    'maxContentLength': Infinity,
                    'maxBodyLength': Infinity,
                    headers: {
                        ...formData.getHeaders(),
                    },
                })
                if(result.data && result.data.id){
                    await models.orders_to_user_uploaded_files.create({
                        order_id:order.id,
                        user_uploaded_files_id:result.data.id,
                        type: 'pdf_hello_sign'
                    })
                }else{
                    log.info(`End /signOrderHelloSign data: ${null}`);
                    return null;
                }
                signatureUrl = await helloSignUtil.orderSign(result.data, user, order, show_tags);
                log.info(`End /signOrderHelloSign data: ${signatureUrl}`);
                if(signatureUrl && signatureUrl.signature_request) {
                    await models.orders.update({signature_request_id: signatureUrl.signature_request.signature_request_id},{where: {id: order.id}});
                    return res.status(200).json({ url: signatureUrl.signature_request.signing_url });
                } else return null;

            }
        } catch (error) {
            console.log(error);
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    getSignHashDeepLink: async (req, res) => {
        log.info(`Start /signDia data: ${JSON.stringify(req.params)}`);
        try {
            let result = false;
            if(req.params.order_id) {
                let id = req.params.order_id;
                let checkFiles = await models.orders_to_user_uploaded_files.findAll({where:{order_id:id},raw:true});
                if(checkFiles && checkFiles.length && checkFiles.length === 2) {
                    let oldFiles = await models.orders_to_user_uploaded_files.findAll({where:{order_id:id, type: 'pdf_dia'},raw:true});
                    if(oldFiles && oldFiles.length) {
                        await Promise.all(oldFiles.map(async item => {
                            let item_file = await models.user_uploaded_files.findOne({where: {id: item.user_uploaded_files_id}, raw: true});
                            if(item_file) s3Util.deleteFile(item_file);
                            await models.user_uploaded_files.destroy({where: {id: item.user_uploaded_files_id}});
                        }))
                        await models.orders_to_user_uploaded_files.destroy({where:{order_id:id, type: 'pdf_dia'}});
                    }
                }
                let files = await models.orders_to_user_uploaded_files.findAll({where:{order_id:id},raw:true});
                console.log(req.body);
                console.log(req.files);
                if(files && files.length === 1) {
                    let old_item_files = await models.order_images_to_user_uploaded_files.findAll({where: {order_id: id}});
                    if(old_item_files && old_item_files.length) {
                        await Promise.all(old_item_files.map(async item => {
                            let itemFile = await models.user_uploaded_files.findOne({where: {id: item.user_uploaded_files_id}, raw: true});
                            if(itemFile) s3Util.deleteFile(itemFile);
                        }))
                        await models.order_images_to_user_uploaded_files.destroy({where: {order_id: id}});
                    }
                    let user_images = [];
                    if(req.files && req.files.length) {
                        for (let item of req.files) {
                            console.log(item)
                            if(req.query.type == '' || !req.query.type) req.query.type = null;
                            let name = item.key.split('/');
                            name = name[name.length-1];
                            let resultImage = await models.user_uploaded_files.create({
                                type: req.query.type,
                                level: config.LVL_PERMISSIONS_IMAGE.private,
                                user_id: req.userid,
                                size: item && item.size ? item.size : null,
                                filename: name,
                                file_type: item.mimetype,
                            })
                            if(resultImage) {
                                await models.order_images_to_user_uploaded_files.create({order_id: id, user_uploaded_files_id: resultImage.id, additional_file_id: req.body.files_ids[0]});
                                req.body.files_ids.shift();
                                user_images.push(resultImage.toJSON());
                            }
                        }
                        // await Promise.all(req.files.map(async item => {
                        //     console.log(item)
                        //     if(req.query.type == '' || !req.query.type) req.query.type = null;
                        //     let name = item.key.split('/');
                        //     name = name[name.length-1];
                        //     let resultImage = await models.user_uploaded_files.create({
                        //         type: req.query.type,
                        //         level: config.LVL_PERMISSIONS_IMAGE.private,
                        //         user_id: req.userid,
                        //         size: item && item.size ? item.size : null,
                        //         filename: name,
                        //         file_type: item.mimetype,
                        //     })
                        //     if(resultImage) {
                        //         await models.order_images_to_user_uploaded_files.create({order_id: id, user_uploaded_files_id: resultImage.id, additional_file_id: req.body.files_ids[0]});
                        //         req.body.files_ids.shift();
                        //         user_images.push(resultImage.toJSON());
                        //     }
                        // }))
                    }
                    let file = await models.user_uploaded_files.findOne({where:{id: files[0].user_uploaded_files_id},raw:true})
                    result = await DIA.getSignHashDeepLink(file, id, user_images, req.lang);
                    result.device = req.device.type;
                    // let string = await QRCode.toDataURL('http://www.google.com');
                    await models.orders_to_user_uploaded_files.update({hash_file: result.fileHash}, {where:{order_id:id}});
                    await models.orders.update({request_id: result.request_id}, {where:{id:id}});
                }
            }
            log.info(`End /signDia data: ${result}`);
            res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    uploadDia: async (req,res) =>{
        log.info(`Start /uploadDia data: ${JSON.stringify(req.body)}`);
        try {
            let result = await DIA.uploadDia();
            log.info(`End /uploadDia data: ${result}`);
            res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    downloadOrderFiles: async (req,res) =>{
        log.info(`Start /downloadOrderFiles data: ${JSON.stringify(req.params)}`);
        try {
            const zip = new JSZip();
            let order = await bookingService.getBookingByFilter({id:req.params.order_id});
            if(order) {
                await Promise.all(order.order_files.map(async item => {
                    console.log(item);
                    zip.file(item.filename, await s3Util.getFileBuffer(item));
                }));

                res.set('Content-Type','application/zip');
                if(req.lang == config.LANGUAGES[0]) {
                    res.attachment(`ЗАЯВА_${order.id}.zip`);
                } else res.attachment(`ORDER_${order.id}.zip`);
                return zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(res)
                    .on('finish', function () {
                        console.log("sample.zip written.");
                    });
            }
        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    downloadPrivateImage: async (req, res) => {
        log.info(`Start /downloadPrivateImage data: ${JSON.stringify(req.params)}`);
        try {
            let user_image = await models.user_uploaded_files.findOne({where:{id: req.params.id},raw:true});


            if(user_image && user_image.level)
            {
                const options = {
                    Bucket: config.AWS_BUCKET_NAME,
                    Key : `${user_image.user_id}/${user_image.level}/${user_image.filename}`,
                };
                const fileStream = s3.getObject(options).createReadStream();
                res.set('Content-Type',user_image.file_type);
                res.attachment(user_image.filename);
                fileStream.pipe(res);
            }
            else
            {
                const file = new fs.ReadStream('./public/img/404.png');
                file.pipe(res);

            }


            // if(user_image) {
            //     let user_image_buffer = await s3Util.getFileBuffer(user_image);
            //     res.set('Content-Type',user_image.file_type);
            //     res.attachment(user_image.filename);
            //     return res.send(user_image_buffer);
            // }
        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    DiaCallBack: async (req, res) => {
        console.log(`Start /DiaCallBack data: ${JSON.stringify(req.body)}`);
        try {

            if(req.body.encodeData) {
                // await models.configs.update({value: req.body.encodeData},{where: {type: 'dia_test'}});
                let order = await models.orders.findOne({
                    where: {request_id: req.headers['x-document-request-trace-id'] },
                    include: [
                        {model: models.user_uploaded_files, as:'order_files', through: { attributes: ['hash_file'] }},
                    ]
                });
                if(!order) {
                    console.log(`End /DiaCallBack No order Found`);
                    return res.status(400).json({ "success": false });
                }

                let allProcess = async function () {

                    order = order.toJSON();
                    let signedData = JSON.parse(Buffer.from(req.body.encodeData, 'base64').toString('ascii'));

                    let verifyHash = await axios({
                        method: 'post',
                        url: 'http://localhost:3050/',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        data: { hash: order.order_files[0].orders_to_user_uploaded_files.hash_file , signature: signedData.signedItems[0].signature }
                    });
                    verifyHash = verifyHash.data;

                    const formData = new FormData();
                    let p7s_file = Buffer.from(signedData.signedItems[0].signature, 'base64');

                    // fs.createWriteStream('documents/Signature.p7s').write(buffer);
                    // const p7s_file = await fs.readFileSync('documents/Signature.p7s');
                    formData.append('order_id', order.id);
                    formData.append('document', p7s_file, 'documents/Signature.p7s');
                    formData.append('user_id', order.user_id);
                    let signedDataResponse = await axios.post(`${config.FRONT_URL}/upload/uploadFileServiceDocument?client_id=${order.user_id}`, formData,{
                        headers: {
                            ...formData.getHeaders(),
                        },
                    });
                    if(signedDataResponse.data && signedDataResponse.data.id){
                        await models.orders_to_user_uploaded_files.create({
                            order_id:order.id,
                            user_uploaded_files_id:signedDataResponse.data.id,
                        })
                    } else {
                        console.log(`End /DiaCallBack File not created`);
                        return res.status(400).json({ "success": false });
                    }
                    // if(fs.existsSync('documents/Signature.p7s')) fs.unlinkSync('documents/Signature.p7s');

                    let countriesArr = JSON.parse(fs.readFileSync('utils/countries.json', 'utf8'));

                    let country_code = verifyHash.ownerInfo.subject.split(';C=')[1];
                    let country_data = countriesArr.find(item => item.code === country_code);

                    let PDFHtml = await templateUtil.getTemplate({
                        fileName: `${order.id}-PDF`,
                        signatureName: signedDataResponse.data.filename,
                        signatureSize: signedDataResponse.data.size,
                        documentName: order.order_files[1].filename,
                        documentSize: order.order_files[1].size,
                        dateNow: new Date().toISOString(),
                        issuerCN: verifyHash.ownerInfo.issuerCN,
                        serial: verifyHash.ownerInfo.serial,
                        subjDRFOCode: verifyHash.ownerInfo.subjDRFOCode,
                        signerName: verifyHash.ownerInfo.subjDRFOCode,
                        subjCN: verifyHash.ownerInfo.subjCN,
                        subjFullName: verifyHash.ownerInfo.subjFullName,
                        signTimeStamp: verifyHash.timeInfo.signTimeStamp,
                        country: country_data.name_ua
                    },'email-template/protocol');

                    PDFHtml = await html_to_pdf.generatePdf({ content: PDFHtml }, { format: 'A4' });
                    const PDFFormData = new FormData();
                    PDFFormData.append('order_id', order.id);
                    PDFFormData.append('document', PDFHtml, 'documents/Protocol.pdf');
                    PDFFormData.append('user_id', order.user_id);
                    let PDFDataResponse = await axios.post(`${config.FRONT_URL}/upload/uploadFileServiceDocument?client_id=${order.user_id}`, PDFFormData,{
                        headers: {
                            ...PDFFormData.getHeaders(),
                        },
                    });
                    if(PDFDataResponse.data && PDFDataResponse.data.id){
                        await models.orders_to_user_uploaded_files.create({
                            order_id:order.id,
                            user_uploaded_files_id:PDFDataResponse.data.id,
                        })
                    } else {
                        console.log(`End /DiaCallBack File not created`);
                        return res.status(400).json({ "success": false });
                    }
                    let user = await userService.getUser({id:order.user_id}, ['id', 'first_name', 'last_name', 'email', 'phone']);
                    let mailObjToClient = {
                        to: user.email,
                        subject: config.TEXTS[config.LANGUAGES[0]].sign_dia_success,
                        data: {
                            info: {
                                subject: config.TEXTS[config.LANGUAGES[0]].sign_dia_success,
                                name: user.first_name,
                                first_name: user.first_name,
                                lang: config.LANGUAGES[0]
                            },
                            lang: config.LANGUAGES[0]
                        },
                        attachments:[
                            {
                                path: config.FRONT_URL + '/downloadOrderFiles/' + order.id,
                                filename: `Замовлення_${order.id}.zip`
                            }
                        ]
                    };
                    emailUtil.sendMail(mailObjToClient, "form-to-client");
                    bookingService.editBooking({status:19},order.id);
                }
                allProcess();
                return res.status(200).json({ "success": true });
            }

            console.log(`End /DiaCallBack`);



            const lang = req.lang;
            const languages = config.LANGUAGES
            const id = req.user ? req.user.id : null;
            let slugs = {}
            if(languages && languages.length){
                languages.forEach((item,i)=>{
                    if(item && item == 'uk'){
                        slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/` : `/${languages[i]}/404`
                    } else slugs[languages[i]] = `${config.LANGUAGES[i]}/404`
                })
            }
            let user;
            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            if(id){
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', 'role']);
                user = user ? user.toJSON() : user;
            }
            return res.render('client/thank-you-diya', {
                langs: req.langs,
                lang: lang,
                slugs,
                metaData: req.body.metaData,
                layout: 'client/layout.hbs',
                user,
                first_name: user ? user.first_name : null,
                last_name: user ? user.last_name : null,
                header_footer: header_footer ? header_footer: null,
                menu: menu ? menu: null,
            });

            // return res.status(200).json({ "success": true });
        } catch (error) {
            log.error(`${error}`);
            return res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },

    SignCallBack: async (req, res) => {
        console.log(`Start /SignCallBack data: ${JSON.stringify(req.body)}`);
        try {

            console.log(`End /SignCallBack`);
            res.status(200).json({ "success": true });

        } catch (error) {
            log.error(`${error}`);
            res.status(200).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    getUserContract: async (req, res) => {
        log.info(`Start /getUserContract data: ${JSON.stringify(req.params)}`);
        try {
            let id = req.params.id;
            let user = await userService.getOutUserInfo({id: id}, false, true);
            if(user && user.user_contract){
                log.info(`End /getUserContract data: ${ { "success": true } }`);
                let file = await s3Util.getFileBuffer(user.user_contract);
                res.set('Content-Type', user.user_contract.file_type);
                res.attachment(user.user_contract.filename);
                return res.send(file);
            }
            log.info(`End /getUserContract data: ${ { "success": false } }`);
            return res.status(200).json({ "success": false });
        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    checkHelloSign: async (req, res) => {
        log.info(`Start /checkHelloSign data: ${JSON.stringify(req.query)}`);
        try {
            const lang = req.lang;
            let user_id = req.params.user_id;
            let user = await userService.getUser({id: user_id});
            if(!user.user_sign || !user.admin_sign) {
                let user_sign, admin_sign;
                let helloSignInfo = await helloSignUtil.signatureInfo(user.signature_request_id);
                if (helloSignInfo && helloSignInfo.signature_request && helloSignInfo.signature_request.signatures && helloSignInfo.signature_request.signatures.length) {
                    if (helloSignInfo.signature_request.signatures[0].status_code === 'signed') admin_sign = true;
                    if (helloSignInfo.signature_request.signatures[1].status_code === 'signed') user_sign = true;
                    if(!user.admin_sign && admin_sign) {
                        let signature_request_id = user.signature_request_id;
                        let contract_id = user.contract_id;
                        let contract = await models.user_uploaded_files.findOne({where: {id: contract_id}});
                        setTimeout((async () => {
                            let helloSignFile = await helloSignUtil.getHelloSignFile(signature_request_id);
                            let file = await fs.createWriteStream('documents/' + contract.filename);
                            await https.get(helloSignFile.file_url, async function(response) {
                                response.pipe(file);
                                setTimeout((async () => {
                                    helloSignFile = fs.readFileSync('documents/' + contract.filename);
                                    await s3Util.updateFile(contract, helloSignFile);
                                    fs.unlinkSync('documents/' + contract.filename);
                                    await userService.updateUser({id: user_id}, {hello_sign_file_response: true});
                                }), 5000);
                            });
                        }),60000);
                        // let helloSignFile = await helloSignUtil.getHelloSignFile(user.signature_request_id);
                        // let contract = await models.user_uploaded_files.findOne({where: {id: user.contract_id}});
                        // let file = await fs.createWriteStream('documents/' + contract.filename);
                        // await https.get(helloSignFile.file_url, async function(response) {
                        //     response.pipe(file);
                        //     setTimeout((async () => {
                        //         helloSignFile = fs.readFileSync('documents/' + contract.filename);
                        //         await s3Util.updateFile(contract, helloSignFile);
                        //         fs.unlinkSync('documents/' + contract.filename);
                        //     }), 5000);
                        // });
                        await notificationService.createNotification(config.NOTIFICATION_TYPES.HELLO_SIGN_WAITING, user.id);
                        let mailObjToClient = {
                            to: user.email,
                            subject: config.TEXTS[config.LANGUAGES[0]].hello_sign_notification_title,
                            data: {
                                info: {
                                    subject: config.TEXTS[config.LANGUAGES[0]].hello_sign_notification_title,
                                    name: user.first_name,
                                    lang: config.LANGUAGES[0]
                                },
                                lang: config.LANGUAGES[0]
                            },
                            attachments:[
                                {
                                    path: config.FRONT_URL + '/getUserContract/' + user.id,
                                    filename: contract.filename
                                }
                            ]
                        };
                        emailUtil.sendMail(mailObjToClient, "form-to-client");
                    }
                    if(!user.user_sign && user_sign) {
                        let signature_request_id = user.signature_request_id;
                        let contract_id = user.contract_id;
                        setTimeout((async () => {
                            let helloSignFile = await helloSignUtil.getHelloSignFile(signature_request_id);
                            let contract = await models.user_uploaded_files.findOne({where: {id: contract_id}});
                            let file = await fs.createWriteStream('documents/' + contract.filename);
                            await https.get(helloSignFile.file_url, async function(response) {
                                response.pipe(file);
                                setTimeout((async () => {
                                    helloSignFile = fs.readFileSync('documents/' + contract.filename);
                                    await s3Util.updateFile(contract, helloSignFile);
                                    fs.unlinkSync('documents/' + contract.filename);
                                    await userService.updateUser({id: user_id}, {hello_sign_file_response: true});
                                }), 5000);
                            });
                        }),60000);
                        await notificationService.createNotification(config.NOTIFICATION_TYPES.HELLO_SIGN_SUCCESS, user.id);
                    }
                    if((!user.user_sign && user_sign) || (!user.admin_sign && admin_sign)) {
                        await user.update({admin_sign, user_sign, hello_sign_file_response: false});
                    } else await user.update({admin_sign, user_sign});
                }
            }
            let notificationsCount;
            const id = req.user ? req.user.userid : null;
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', "role"]);
                user = user ? user.toJSON() : user;
                user = { ...user };
                notificationsCount = await notificationService.countUserNotifications(id, lang);
            } else user = null;
            let menu = await menuService.getMenu(lang);
            let header_footer = await menuService.getHeaderFooter(lang);

            let slugs = {}
            const languages = config.LANGUAGES;
            for(let i = 0; i < languages.length; i++){
                if(languages[i] == "uk"){
                    slugs.uk = `/callbackHelloSign/${user_id}` + '?';
                    for (const [key, value] of Object.entries(req.query)) {
                        slugs.uk += `${key}=${value}&`;
                    }
                    slugs.uk =  slugs.uk.slice(0, -1);
                } else {
                    slugs[languages[i]] = `/callbackHelloSign/${user_id}` + '?';
                    for (const [key, value] of Object.entries(req.query)) {
                        slugs[languages[i]] += `${key}=${value}&`;
                    }
                    slugs[languages[i]] =  slugs[languages[i]].slice(0, -1);
                }
            }

            let browserPageName;
            switch (lang) {
                case 'uk':
                    browserPageName = "Дякуємо"
                    break;
                case 'ru':
                    browserPageName = "Спасибо"
                    break;
                case 'en':
                    browserPageName = "Thank you"
                    break;
                default:
                    break;
            }
            let homePage = {};
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null, lang);
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`, lang });
                homepageLink = homepageLink.toJSON();
                homePage.slug = homepageLink.slug;
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }

            log.info(`End /checkHelloSign data: ${ { "success": true } }`);
            return res.render("client/thank-you-hello-sign", {
                layout: "client/layout.hbs",
                menu,
                slugs,
                header_footer: header_footer ? header_footer : null,
                notificationsCount: notificationsCount ? notificationsCount: null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                config: config ? config : null,
                lang: lang ? lang : null,
                user,
                homePage,
                browserPageName
            });
        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: 400
            });
        }
    },


    checkHelloSignOrder: async (req, res) => {
        log.info(`Start /checkHelloSignOrder data: ${JSON.stringify(req.query)}`);
        try {
            const lang = req.lang;
            let user_id = req.params.user_id;
            let order_id = req.params.order_id;
            let order = await bookingService.getBookingByFilter({id:order_id});
            let user = await userService.getUser({id: order.user_id});
            if(!order.user_sign || !order.admin_sign) {
                let user_sign, admin_sign;
                let helloSignInfo = await helloSignUtil.signatureInfo(order.signature_request_id);
                if (helloSignInfo && helloSignInfo.signature_request && helloSignInfo.signature_request.signatures && helloSignInfo.signature_request.signatures.length) {
                    if (helloSignInfo.signature_request.signatures[0].status_code === 'signed') user_sign = true;
                    if (helloSignInfo.signature_request.signatures[1].status_code === 'signed') admin_sign = true;
                    if(!order.admin_sign && admin_sign) {
                        let signature_request_id = order.signature_request_id;
                        let contract_id = order.order_files[1].id;
                        let contract = await models.user_uploaded_files.findOne({where: {id: contract_id}});
                        setTimeout((async () => {
                            let helloSignFile = await helloSignUtil.getHelloSignFile(signature_request_id);
                            let file = await fs.createWriteStream('documents/' + contract.filename);
                            await https.get(helloSignFile.file_url, async function(response) {
                                response.pipe(file);
                                setTimeout((async () => {
                                    helloSignFile = fs.readFileSync('documents/' + contract.filename);
                                    await s3Util.updateFile(contract, helloSignFile);
                                    fs.unlinkSync('documents/' + contract.filename);
                                    await models.orders.update({hello_sign_file_response: true}, {where: {id: order_id}});
                                    await notificationService.createNotification(config.NOTIFICATION_TYPES.HELLO_SIGN_ORDER_WAITING, user.id);
                                    let mailObjToClient = {
                                        to: user.email,
                                        subject: config.TEXTS[config.LANGUAGES[0]].hello_sign_notification_order_title,
                                        data: {
                                            info: {
                                                subject: config.TEXTS[config.LANGUAGES[0]].hello_sign_notification_order_title,
                                                name: user.first_name,
                                                lang: config.LANGUAGES[0]
                                            },
                                            lang: config.LANGUAGES[0]
                                        },
                                        attachments:[
                                            {
                                                path: config.FRONT_URL + '/downloadOrderFiles/' + order.id,
                                                filename: `order_${order.id}.zip`
                                            }
                                        ]
                                    };
                                    emailUtil.sendMail(mailObjToClient, "form-to-client");
                                }), 5000);
                            });
                        }),60000);
                    }
                    if(!order.user_sign && user_sign) {
                        let signature_request_id = order.signature_request_id;
                        let contract_id = order.order_files[1].id;
                        setTimeout((async () => {
                            let helloSignFile = await helloSignUtil.getHelloSignFile(signature_request_id);
                            let contract = await models.user_uploaded_files.findOne({where: {id: contract_id}});
                            let file = await fs.createWriteStream('documents/' + contract.filename);
                            await https.get(helloSignFile.file_url, async function(response) {
                                response.pipe(file);
                                setTimeout((async () => {
                                    helloSignFile = fs.readFileSync('documents/' + contract.filename);
                                    await s3Util.updateFile(contract, helloSignFile);
                                    fs.unlinkSync('documents/' + contract.filename);
                                    await models.orders.update({hello_sign_file_response: true}, {where: {id: order_id}});
                                    await notificationService.createNotification(config.NOTIFICATION_TYPES.HELLO_SIGN_ORDER_SUCCESS, user.id);
                                    let mailObjToClient = {
                                        to: user.email,
                                        subject: config.TEXTS[config.LANGUAGES[0]].hello_sign_notification_order_title,
                                        data: {
                                            info: {
                                                subject: config.TEXTS[config.LANGUAGES[0]].hello_sign_notification_order_title,
                                                name: user.first_name,
                                                lang: config.LANGUAGES[0]
                                            },
                                            lang: config.LANGUAGES[0]
                                        },
                                        attachments:[
                                            {
                                                path: config.FRONT_URL + '/downloadOrderFiles/' + order.id,
                                                filename: `order_${order.id}.zip`
                                            }
                                        ]
                                    };
                                    emailUtil.sendMail(mailObjToClient, "form-to-client");
                                }), 5000);
                            });
                        }),60000);
                        await models.orders.update({status: 29}, {where: {id: order.id}});
                        await notificationService.createNotification(config.NOTIFICATION_TYPES.ORDER, user.id, null, order.id);
                    }
                    if((!order.user_sign && user_sign) || (!order.admin_sign && admin_sign)) {
                        await models.orders.update({admin_sign, user_sign, hello_sign_file_response: false}, {where: {id: order.id}});
                    } else await models.orders.update({admin_sign, user_sign}, {where: {id: order.id}});
                }
            }
            let notificationsCount;
            const id = req.user ? req.user.userid : null;
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', "role"]);
                user = user ? user.toJSON() : user;
                user = { ...user };
                notificationsCount = await notificationService.countUserNotifications(id, lang);
            } else user = null;
            let menu = await menuService.getMenu(lang);
            let header_footer = await menuService.getHeaderFooter(lang);

            let slugs = {}
            const languages = config.LANGUAGES;
            for(let i = 0; i < languages.length; i++){
                if(languages[i] == "uk"){
                    slugs.uk = `/callbackHelloSign/${user_id}` + '?';
                    for (const [key, value] of Object.entries(req.query)) {
                        slugs.uk += `${key}=${value}&`;
                    }
                    slugs.uk =  slugs.uk.slice(0, -1);
                } else {
                    slugs[languages[i]] = `/callbackHelloSign/${user_id}` + '?';
                    for (const [key, value] of Object.entries(req.query)) {
                        slugs[languages[i]] += `${key}=${value}&`;
                    }
                    slugs[languages[i]] =  slugs[languages[i]].slice(0, -1);
                }
            }

            let browserPageName;
            switch (lang) {
                case 'uk':
                    browserPageName = "Дякуємо"
                    break;
                case 'ru':
                    browserPageName = "Спасибо"
                    break;
                case 'en':
                    browserPageName = "Thank you"
                    break;
                default:
                    break;
            }
            let homePage = {};
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null, lang);
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`, lang });
                homepageLink = homepageLink.toJSON();
                homePage.slug = homepageLink.slug;
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }

            log.info(`End /checkHelloSignOrder data: ${ { "success": true } }`);
            return res.render("client/thank-you-hello-sign", {
                layout: "client/layout.hbs",
                menu,
                slugs,
                header_footer: header_footer ? header_footer : null,
                notificationsCount: notificationsCount ? notificationsCount: null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                config: config ? config : null,
                lang: lang ? lang : null,
                user,
                homePage,
                browserPageName
            });
        } catch (error) {
            console.log(error);
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: 400
            });
        }
    },

    payOrder: async (req, res) => {
        log.info(`Start payOrder DATA: ${req.params}`);
        const lang = req.lang;
        let order = await models.orders.findOne({where: {id: req.params.order_id}});
        if(order && order.status === 13 || order.pay_type && order.pay_type == 1 && order.service_type && order.service_type == 1 && order.pay_status && order.pay_status == 1) {
            let pay_types = await models.configs.findOne({where:{type: 'pay_types',lang:lang}});
            pay_types = JSON.parse(pay_types.value);
            let public_key = pay_types[1].liqpay_public_key;
            let private_key = pay_types[1].liqpay_private_key;
            const LiqPay = require('../utils/liqpay-util');
            const liqpay = new LiqPay(public_key, private_key);
            const result = liqpay.cnb_object({
                'action': 'pay',
                'amount': order.total_price,
                'currency': 'UAH',
                'description': `Order ${order.id} payment`,
                'order_id': uuid.v1(),
                'version': '3',
                'result_url': lang == "uk" ? `${config.FRONT_URL}/payment/thank_you/${order.id}/${order.user_id}/1/${order.service_id}` : `${config.FRONT_URL}/${lang}/payment/thank_you/${order.id}/${order.user_id}/1/${order.service_id}`,
                'server_url': `${config.FRONT_URL}/payment/liqPayCallBack?order_id=${order.id}`
            });
            return res.status(200).json({ link: `https://www.liqpay.ua/api/3/checkout?data=${result.data}&signature=${result.signature}` })
        }
        log.info(`End payOrder`);
        return res.status(200).json({ success: false });
    },

    // signDia: async (req,res) =>{
    //     log.info(`Start /signDia data: ${JSON.stringify(req.body)}`);
    //     try {
    //         let { order_id } = req.body;
    //         let order = await models.orders.findOne({where: {id: order_id}, include: {model: models.user_uploaded_files, as: 'user_uploaded_files', through: {attributes:[]}}});
    //         let result = await DIA.getDeepLink(order.user_uploaded_files[0]);
    //         log.info(`End /signDia data: ${result}`);
    //         res.status(200).json(result);
    //
    //     } catch (error) {
    //         log.error(`${error}`);
    //         res.status(200).json({
    //             message: error.message,
    //             errCode: 400
    //         });
    //     }
    // },
    checkHelloSignFile: async (req, res) => {
        log.info(`Start checkHelloSignFile DATA: ${req.params}`);
        const id = req.user.userid;
        let user = await userService.getUser({ id: id });
        if(user && user.hello_sign_file_response) {
            log.info(`End checkHelloSignFile`);
            return res.status(200).json({ success: true, id: id });
        } else {
            log.info(`End checkHelloSignFile`);
            return res.status(200).json({ success: false });
        }
    },
    checkHelloSignOrderFile: async (req, res) => {
        log.info(`Start checkHelloSignOrderFile DATA: ${req.params}`);
        let order = await bookingService.getBookingByFilter({id:req.params.order_id});
        if(order && order.hello_sign_file_response) {
            log.info(`End checkHelloSignOrderFile`);
            return res.status(200).json({ success: true, id: req.params.order_id });
        } else {
            log.info(`End checkHelloSignOrderFile`);
            return res.status(200).json({ success: false });
        }
    },
    getAdditionalService:async(req,res)=>{
        const id = req.user.userid;
        const lang = req.lang;
        let {service_id} = req.body
        try {
            let result = await userService.getAdditionalService({service_id:service_id})

            if(result && result.length){
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
                for(let item of result){
                    if(item.service_country_pricing && item.service_country_pricing.length && ipCountry && ipCountry.country){
                        for(let country_price of item.service_country_pricing){
                            if(country_price.ip == ipCountry.country){
                                item.price = country_price.price
                            }
                        }
                    }
                }
            }
            const html = await templateUtil.getTemplate({
                result,
                lang
            },'cabinet-pozov/additional-popup-ajax')
            log.info(`End getAdditionalService data:${JSON.stringify(html)}`)
            return res.json({
                html: html,
            })

        }catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: 400
            });
        }
    },
    getClientOrderAdditional:async(req,res)=>{
        let additional_id = req.params.additional_id
        let order_id = req.params.order_id
        const lang = req.lang;
        let slugs = {}
        const languages = config.LANGUAGES
        try {
            for(let i = 0; i < languages.length; i++){
                if(languages[i] == "uk"){
                    slugs.uk = `/cabinet/createAdditionalOrder/${additional_id}`
                } else slugs[languages[i]] = `/${languages[i]}/cabinet/createAdditionalOrder/${additional_id}`
            }
            const id = req.user.userid;
            if (!id) return res.json('No id');
            log.info(`Start get /history-orders `)
            let user;
            if (id){
                user = await userService.getUser({ id: id });
                user = user.toJSON();
            }
            let additional = await userService.getAdditionalService({id:additional_id},true,true);
            let order = await ordersService.getOrdersByFilter({ id: order_id },null);
            let court = await userService.getCourtByOrder({id:order.court_id},null,true);
            const ip = requestIp.getClientIp(req);

            let ipCountry = await axios({
                method: 'get',
                url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            })
            if(ipCountry)ipCountry = ipCountry.data
            if(additional && additional.service_country_pricing && additional.service_country_pricing.length && ipCountry && ipCountry.country){
                for(let country_price of additional.service_country_pricing){
                    if(country_price.ip == ipCountry.country){
                        additional.price = country_price.price
                    }
                }
            }
            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);

            let browserPageName;
            switch (lang) {
                case 'uk':
                    browserPageName = "Кабінет"
                    break;
                case 'ru':
                    browserPageName = "Кабинет"
                    break;
                case 'en':
                    browserPageName = "Cabinet"
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
            let privat_card = await models.configs.findOne({where:{type:'card_privat_to_order',lang:lang},raw:true})
            if(privat_card)privat_card = privat_card.value
            let notificationsCount = await notificationService.countUserNotifications(id, lang);
            log.info(`End get /history-orders Result: ${JSON.stringify(additional)}`)
            res.render('cabinet-pozov/cabinet-create-additional-order', {
                layout: "client/layout.hbs",
                user,
                slugs,
                homePage,
                browserPageName,
                additional,
                order_id:order.id,
                court_id:court.id,
                lang: lang,
                privat_card,
                config: config ? config : null,
                consultation_form: await pagesService.getFormByPage(4,lang),
                notificationsCount: notificationsCount ? notificationsCount: null,
                // favorite: favorite ? favorite : null,
                header_footer: header_footer ? header_footer : null,
                menu: menu ? menu : null,
                isCabinet: true,
                menu_panel: 'history_orders',
            });
        }catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: 400
            });
        }

    }
};
