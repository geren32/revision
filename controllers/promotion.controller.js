const pagesService = require('../services/pages.service');
const config = require('../configs/config');
const menuService = require('../services/menu.service');
const templateUtil = require('../utils/template-util');
const userService = require('../services/user.service');
const promotionsService = require('../services/promotions.service');
const log = require('../utils/logger');
const { Op } = require("sequelize");
const linksService = require('../services/links.service');
const productService = require('../services/product.service');
const paginationUtil = require('../utils/pagination-util')
const extraUtil = require('../utils/extra-util')

module.exports = {

    getAllPromotions: async (req, res) => {
        try {
            let viewedProducts = req.viewedProducts;
            let favProducts = req.favProducts;
            let favProductsIds = favProducts;
            let favorite = favProducts && favProducts.length ? favProducts.length : 0;
            let cart = req.cart;

            const pageId = req.url && req.url.includes('/promotions/') ? req.url.split('/promotions/').pop() : null;
            let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
            if(req.query.current_page) page = parseInt(req.query.current_page)
            let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 6;

            let promotions;
            let body = req.body;
            let renderPage;
            let countPages;
            let minPage, maxPage;
            let lastElem = true;
            let isPaginationShow = true;
            let paginationData
            const lang = req.lang;
            body.lang = lang;
            let slugs = {};
            const languages = config.LANGUAGES;

            let pageBody = await pagesService.getPage({ 
                [Op.or]: [{ id: pageId, lang: lang }, { origin_id: pageId, lang: lang }],
                status: config.GLOBAL_STATUSES.ACTIVE
            }, null, lang);
            
            if (!pageBody || pageBody.template !== 'promotions') {
                renderPage = './404';
            } else {
                renderPage = 'client/promotions';
                let original_id = pageBody && pageBody.origin_id ? pageBody.origin_id : pageBody.id;
                let otherLangsForPage = await pagesService.getAllPages({ origin_id: original_id });
                let otherLangsForPageOriginalLinks = otherLangsForPage.map((i,index) => extraUtil.generateLinkUrlForPage(i.type, i.id, i.template,languages[index+1]));
                let pageOriginalLinksFilter = {
                    [Op.in]: [extraUtil.generateLinkUrlForPage(pageBody.type, original_id, pageBody.template, languages[0]), ...otherLangsForPageOriginalLinks]
                };
                let links = await linksService.getAllLinks({ original_link: pageOriginalLinksFilter });
                if(links && links.length){
                    links.forEach((item,i)=>{
                        slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
                    }) 
                }
                promotions = await promotionsService.getAllPromorions(body, perPage, page);
                paginationData = await paginationUtil.pagination(countPages,promotions.count,perPage,page,minPage,maxPage,lastElem,isPaginationShow)
            }

            let header_footer = await menuService.getHeaderFooter(lang);
            const id = req.user ? req.user.userid : null;
            let user;
            if (id) {
                user = await userService.getUser(id, ['email', 'first_name','last_name','role']);
                user = user ? user.toJSON() : user;
                favProductsIds = await productService.getAllFavoritesProductIds(id);
                favorite = favProductsIds && favProductsIds.length ? favProductsIds.length : 0;
                
            }
            let menu = await menuService.getMenu(lang);

            let homePage = {}
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                homepageLink = homepageLink.toJSON()
                homePage.slug = homepageLink.slug
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }

            res.render(renderPage, {
                langs: req.langs,
                lang: lang,
                metaData: req.body.metaData,
                layout: 'client/layout.hbs',
                page_title: pageBody && pageBody.title ? pageBody.title : null,
                promotions: promotions,
                countPages: paginationData.countPages,
                isPaginationShow: paginationData.isPaginationShow,
                pagination :  paginationData.pagination,
                header_footer: header_footer ? header_footer: null,
                user,
                cart,
                favorite: favorite ? favorite : null,
                isPromotion: true,
                homePage,
                menu,
                lastElem: paginationData.pagination.lastElem,
                page,
                first_name: user ? user.first_name : null,
                last_name: user ? user.last_name : null,
                slugs,
            });
        } catch (error) {
            log.error(`${error}`);
            res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    getAllPromotionsAjax: async (req, res) => {
        const pageId = req.url && req.url.includes('/promotions/') ? req.url.split('/promotions/').pop() : null;
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 6;
        let promotions;
        let body = req.body;
        let renderPage;
        let countPages;
        let minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        let paginationData
        const lang = req.lang;
        body.lang = lang;

        let pageBody = await pagesService.getPage({ id: pageId, status: config.GLOBAL_STATUSES.ACTIVE },null,lang);
        if (pageBody && pageBody.lang !== lang) {
            let filter = pageBody.origin_id === 0 ? { [Op.or]: [{ id: pageBody.id, lang: lang }, { origin_id: pageBody.id, lang: lang }] } : { [Op.or]: [{ id: pageBody.origin_id, lang: lang }, { origin_id: pageBody.origin_id, lang: lang }] };
            pageBody = await pagesService.getPage({ ...filter, status: config.GLOBAL_STATUSES.ACTIVE },null,lang);
        }
        if (!pageBody || pageBody.template !== 'promotions') {
            renderPage = './404';
        } else {
            renderPage = 'client/promotions-ajax';


            promotions = await promotionsService.getAllPromorions(body, perPage, page);
            
            //set pagination settings
            paginationData = await paginationUtil.pagination(countPages,promotions.count,perPage,page,minPage,maxPage,lastElem,isPaginationShow)

        }

        let pagination = '';
        if (isPaginationShow) {
            pagination = await templateUtil.getTemplate({
                countPages: paginationData.countPages,
                isPaginationShow: paginationData.isPaginationShow,
                pagination :  paginationData.pagination,
            }, 'partials/pagination');
        }

        const show_more =  await templateUtil.getTemplate({
            page,
            perPage,
            lang:lang,
            lastElem: paginationData.pagination.lastElem,
            countPages: paginationData.countPages,
        }, 'partials/show_more');


        const html = await templateUtil.getTemplate({ promotions , lang: lang}, renderPage);

        res.json({
            html: html,
            pagination: pagination,
            show_more:show_more,
        })
    },

    getPromotion: async (req, res) => {
        try {
            let viewedProducts = req.viewedProducts;
            let favProducts = req.favProducts;
            let favProductsIds = favProducts;
            let favorite = favProducts && favProducts.length ? favProducts.length : 0;
            let cart = req.cart;
            const languages = config.LANGUAGES;
            let slugs = {};

            const promotionId = req.url && req.url.includes('/getPromotion/') ? req.url.split('/getPromotion/').pop() : null;
            let renderPage = 'client/promotion-detail';
            let promotion;
            // let adminRole = req.user && req.user.userType ? req.user.userType : null;
            const lang = req.lang;

            promotion = await promotionsService.getPromotion({ 
                [Op.or]: [{ id: promotionId, lang: lang }, { origin_id: promotionId, lang: lang }], 
                status: [config.GLOBAL_STATUSES.ACTIVE] 
            });
            
            if (!promotion) {
                res.status(403);
                renderPage = './404';
            }

            let header_footer = await menuService.getHeaderFooter(lang);
            const id = req.user ? req.user.userid : null;
            let user;
            if (id) {
                user = await userService.getUser(id, ['email', 'first_name','last_name','role']);
                user = user ? user.toJSON() : user;
                favProductsIds = await productService.getAllFavoritesProductIds(id);
                favorite = favProductsIds && favProductsIds.length ? favProductsIds.length : 0;
            }

            let original_id = promotion && promotion.origin_id ? promotion.origin_id : promotion.id;
            let otherLangsIds = await promotionsService.getAllPromotions({ origin_id: original_id });
            let otherLangsOriginalLinks = otherLangsIds.map((i,index) => `/getPromotion/${i.id}`);
            let originalLinksFilter = {
                [Op.in]: [`/getPromotion/${original_id}`, ...otherLangsOriginalLinks]
            };
            let links = await linksService.getAllLinks({ original_link: originalLinksFilter });
            if(links && links.length){
                links.forEach((item,i)=>{
                    slugs[languages[i]] = languages[i] === config.LANGUAGES[0] ? `/${item.slug}` : `/${languages[i]}/${item.slug}`
                }) 
            }

            
            // let renderHeader = req.user ? 'client/layout-after-login.hbs' : 'client/layout.hbs';
            let promotionPage = await pagesService.getPage({ lang, template: "promotions" },null,lang)
            if(promotionPage){
                const link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(promotionPage.type, promotionPage.id, promotionPage.template, lang),lang});
                if(link) promotionPage.link = link.toJSON();
            } 
            let homepage = await pagesService.getPage({ lang, template: "homepage" },null,lang)
            if(homepage){ 
                const link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(homepage.type, homepage.id, homepage.template, lang),lang })
                if(link) homepage.link = link.toJSON();
            } 
            let menu = await menuService.getMenu(lang);
           
            let homePage = {}
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                homepageLink = homepageLink.toJSON()
                homePage.slug = homepageLink.slug
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }

            res.render(renderPage, {
                langs: req.langs,
                lang: lang,
                metaData: req.body.metaData,
                layout: 'client/layout.hbs',
                promotion,
                promotionPage,
                homepage,
                header_footer: header_footer ? header_footer : null,
                user,
                cart: cart,
                favorite: favorite ? favorite : null,
                menu,
                lightTheme: true,
                first_name: user ? user.first_name : null,
                last_name: user ? user.last_name : null,
                slugs,
                homePage
            });
            return

        } catch (e) {
            log.error(e);
            res.status(400).json({
                message: e.message,
                errCode: '400'
            });
        }
    },
}
