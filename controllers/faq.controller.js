const service = require('../services/blog.service');
const postService = require('../services/post.service');
const paginationUtil = require('../utils/pagination-util')
const pagesService = require('../services/pages.service');
const notificationService = require("../services/notification-service");
const { models } = require('../sequelize-orm');
const userService = require('../services/user.service');
const { Op } = require("sequelize");
const config = require('../configs/config');
const templateUtil = require('../utils/template-util');
const menuService = require('../services/menu.service');
const moment = require('moment');
const _ = require('lodash');
const clientService = require('../services/client.service');
const linksService = require('../services/links.service');
const log = require('../utils/logger');
const extraUtil = require('../utils/extra-util');
const faqService = require('../services/faq.service');
module.exports = {


    getFaq: async(req, res) => {
        log.info(`Start getPost data:${JSON.stringify(req.body)}`)
        try {

            const faqId = req.url && req.url.includes('/getFaq/') ? req.url.split('/getFaq/').pop() : null;
            let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
            if(req.query.current_page) page = parseInt(req.query.current_page)
            let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 9;

            let countPages;
            let minPage, maxPage;
            let lastElem = true;
            let isPaginationShow = true;
            let paginationData
            let body = req.body;
            let renderPage = 'client/faq-detail';
            let faq;
            let slugs = {};
            // let adminRole = req.user && req.user.role ? req.user.role : null;
            const lang = req.lang;
            const languages = config.LANGUAGES;
            body.lang = lang;
            faq = await faqService.getFaq({
                [Op.or]: [ { id: faqId, lang: lang }, { origin_id: faqId, lang: lang } ],
                status: config.GLOBAL_STATUSES.ACTIVE
            });

            if (!faq) {
                res.status(403);
                renderPage = './404';
            }

            let faqPage = await pagesService.getPage({ template: "faq", lang },null,lang)
            if(faqPage){
                let faqLink = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(faqPage.type, faqPage.id, faqPage.template, lang) })
                faqLink = faqLink ? faqLink.toJSON() : faqLink;
                faqPage.slug = faqLink.slug
            }
            let homePage = await pagesService.getPage({ template: "homepage", lang },null,lang)
            if(homePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(homePage.type, homePage.id, homePage.template, lang) })
                homepageLink = homepageLink ? homepageLink.toJSON() : homepageLink;
                // homePage.slug = homepageLink.slug
            }

            let original_id = faq && faq.origin_id ? faq.origin_id : faq.id;
            let otherLangsIds = await faqService.getAllFaqs({ origin_id: original_id });
            let otherLangsOriginalLinks = otherLangsIds.map((i,index) => `/getFaq/${i.id}`);
            let originalLinksFilter = {
                [Op.in]: [`/getFaq/${original_id}`, ...otherLangsOriginalLinks]
            };
            let links = await linksService.getAllLinks({ original_link: originalLinksFilter });
            if(links && links.length){
                links.forEach((item,i)=>{
                    slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? item.slug : `/${languages[i]}/${item.slug}`
                })
            }
            let faqs = await service.getAllFaqs(lang,faqPage.faq);
            let question_types = await models.configs.findOne({ where: { type: 'question_types'}, raw: true });

            question_types = JSON.parse(question_types.value);
            const id = req.user ? req.user.userid : null;

            let user, notificationsCount;
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone']);
                notificationsCount = await notificationService.countUserNotifications(id, lang);
                user = user ? user.toJSON() : user;

                user = {...user };
            }
            let header_footer =  await menuService.getHeaderFooter(req.lang);
            let menu = await menuService.getMenu(req.lang);
            let cart = req.cart
            let isUser
            let isCabinet
            if(req.userid){
                isUser = true
                if(req.userType == 1){
                    isCabinet = true
                }
            }
            log.info(`End getFaq`)

            return res.render(renderPage, {
                first_name: user ? user.first_name : null,
                last_name: user ? user.last_name : null,
                langs: req.langs,
                lang: lang,
                metaData: req.body.metaData,
                layout: 'client/layout.hbs',
                lightTheme: true,
                faq,
                cart,
                faqPage: faqPage,
                homePage: homePage,
                user,
                faqs,
                question_types,
                consultation_form: await pagesService.getFormByPage(4,lang),
                notificationsCount: notificationsCount ? notificationsCount: null,
                slugs,
                header_footer: header_footer ? header_footer : null,
                menu: menu ? menu : null,
                isUser,
                isCabinet,
                user_name : req.user_name ? req.user_name : null,
                work_status : req.work_status ? req.work_status : null,
            });


        } catch (e) {
            log.error(e)
            res.status(400).json({
                message: e.message,
                errCode: '400'
            });
        }
    },
    getAllFaqs: async(req, res) => {
        log.info(`Start getAllFaqs data:${JSON.stringify(req.body)}`)
        let pageId = req.url && req.url.includes('/faq/') ? req.url.split('/faq/').pop() : null;
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        if(req.query.current_page) page = parseInt(req.query.current_page)
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 9;
        let faqs;
        let body = req.body;
        let renderPage;
        let countPages;
        let minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        let paginationData
        const languages = config.LANGUAGES;
        const lang = req.lang;
        body.lang = lang;
        let slugs = {};
        let question_types;
        let form = await pagesService.getFormByPage(3,lang)

        let pageBody = await pagesService.getPage({
            [Op.or]: [{ id: pageId, lang: lang }, { origin_id: pageId, lang: lang }],
            status: config.GLOBAL_STATUSES.ACTIVE
        },null,lang);

        if (!pageBody || pageBody.template !== 'faq') {
            renderPage = './404';
        } else {
            renderPage = 'client/faq';
            let original_id = pageBody && pageBody.origin_id ? pageBody.origin_id : pageBody.id;
            let otherLangsForPage = await pagesService.getAllPages({ origin_id: original_id });
            let otherLangsForPageOriginalLinks = otherLangsForPage.map((i,index) => extraUtil.generateLinkUrlForPage(i.type, i.id, i.template,languages[index+1]));
            let pageOriginalLinksFilter = {
                [Op.in]: [extraUtil.generateLinkUrlForPage(pageBody.type, original_id, pageBody.template, languages[0]), ...otherLangsForPageOriginalLinks]
            };
            let links = await linksService.getAllLinks({ original_link: pageOriginalLinksFilter });
            // if(links && links.length){
            //     links.forEach((item,i)=>{
            //         slugs[languages[i]] = item.slug
            //     })
            // }
            if(links && links.length){
                links.forEach((item,i)=>{
                    slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? item.slug : `/${languages[i]}/${item.slug}`
                })
            }
            faqs = await faqService.getAllFaqs(lang,pageBody.faq);
        }
        const id = req.user ? req.user.userid : null;
        let user, notificationsCount;

        if (id) {
            notificationsCount = await notificationService.countUserNotifications(id, lang);
            user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone', 'role']);
            user = user ? user.toJSON() : user;
        }
        let cart = req.cart ;
        let header_footer =  await menuService.getHeaderFooter(req.lang);
        let menu = await menuService.getMenu(req.lang);

        let isUser
        let isCabinet
        if(req.userid){
            isUser = true
            if(req.userType == 1){
                isCabinet = true
            }
        }
        log.info(`End getAllFaqs`)
        res.render(renderPage, {
            // langs: req.langs,
            lang: lang,
            metaData: req.body.metaData,
            layout: 'client/layout.hbs',
            page: pageBody  ? pageBody : null,
            faqs: faqs,
            faqs_types: config.FAQ_TYPES,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            cart,
            user,
            slugs,
            isFaq: true,
            isUser,
            isCabinet,
            form,
            notificationsCount: notificationsCount ? notificationsCount: null,
            consultation_form: await pagesService.getFormByPage(4,lang),
            user_name : req.user_name ? req.user_name : null,
            work_status : req.work_status ? req.work_status : null,

        });

    },
    getAllFaqsAjax: async(req, res) => {
        log.info(`Start getAllFaqsAjax data:${JSON.stringify(req.body)}`)

        try{
            const pageId = req.url && req.url.includes('/faq/') ? req.url.split('/faq/').pop() : null;
            let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
            let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 9;
            let faqs;

            let body = req.body;
            let renderPage;

            const lang = req.lang;
            body.lang = lang;

            let pageBody = await pagesService.getPage({
                [Op.or]: [{ id: pageId, lang: lang }, { origin_id: pageId, lang: lang }],
                status: config.GLOBAL_STATUSES.ACTIVE
            },null,lang);
            // let pageBody = await pagesService.getPage({ id: pageId, status: config.GLOBAL_STATUSES.ACTIVE },null,lang);

            if (pageBody && pageBody.lang !== lang) {
                let filter = pageBody.origin_id === 0 ? {
                    [Op.or]: [{ id: pageBody.id, lang: lang }, { origin_id: pageBody.id, lang: lang }]
                } : {
                    [Op.or]: [{ id: pageBody.origin_id, lang: lang }, { origin_id: pageBody.origin_id, lang: lang }]
                };

                pageBody = await pagesService.getPage({...filter, status: config.GLOBAL_STATUSES.ACTIVE },null,lang);
            }

            if (!pageBody || pageBody.template !== 'faq') {
                renderPage = './404';
            } else {
                renderPage = 'client/faq-ajax';
                let filterwhere = { lang: lang };
                let filter = await faqService.makeFaqFilter(req.body, filterwhere);
                faqs = await service.getAllFaqs(filter, perPage, page);


            }
            const id = req.user ? req.user.userid : null;
            let user;
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone']);

                user = user ? user.toJSON() : user;
                user.points_date = moment().subtract(1, 'days').format('DD/MM/YYYY');
                user = {...user };
            }



            const html = await templateUtil.getTemplate({
                faqs: faqs,
                lang: lang
            }, renderPage);


            log.info(`End getAllFaqsAjax data:${JSON.stringify(html)}`)
            res.json({
                html: html,

            })
        }
        catch(err){
            err.code =400;
            throw err;
        }


    },

}
