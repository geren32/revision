const { models } = require('../sequelize-orm');
const userService = require('../services/user.service');
const productService = require('../services/product.service');
const { Op } = require("sequelize");
const config = require('../configs/config');
const templateUtil = require('../utils/template-util');
const menuService = require('../services/menu.service');
const linksService = require('../services/links.service');
const _ = require('lodash');
const log = require('../utils/logger');
const paginationUtil = require('../utils/pagination-util')
const product_discount_calc = require('../utils/product_discount_calc');
const pagesService = require('../services/pages.service');
const notificationService = require("../services/notification-service");

let paginator = function(items, page, per_page) {
    page = page || 1;
    per_page = per_page || 10;
    let offset = (page - 1) * per_page;
    let paginatedItems = items.slice(offset).slice(0, per_page);

    // let total_pages = Math.ceil(items.length / per_page);
    // return {
    //     page: page,
    //     per_page: per_page,
    //     pre_page: page - 1 ? page - 1 : null,
    //     next_page: (total_pages > page) ? page + 1 : null,
    //     total: items.length,
    //     total_pages: total_pages,
    //     data: paginatedItems
    // };
    return {
        count: items.length,
        rows: paginatedItems
    };
}

function searchFields(field) {
    let like = [];
    like.push({
        [Op.like]: `%${field}%`
    });
    return like

}

async function productsSearch(field, count, page,lang) {
    let like = searchFields(field);
    // let offset = count * (page - 1);
    let where = [{ status: config.GLOBAL_STATUSES.ACTIVE,lang:lang },{
        [Op.or]: [{
            title: {
                [Op.or]: like
            }
        }]
    }];
    let result = await models.service.findAll({
        where: where,

        // limit: count,
        // offset: offset,

        // distinct: true,
        attributes: ['id','title','created_at'],
        // include: [{
        //     model: models.uploaded_files,
        //     as: "image"
        // }, ]
    })

    let news = await models.posts.findAll({
        where: where,
        attributes: ['id','title','created_at']
    });

    if (result && result.length) {
        let productsSlug = [];
        result = result.map(el => {
            el = el.toJSON();
            productsSlug.push(`/shop/getService/${el.id}`);
            return el;
        });
        productsSlug = await models.links.findAll({
            where: { original_link: productsSlug },
            raw: true
        })
        for (let item of result) {
            let prodSlug = productsSlug.find(el => el.original_link == `/shop/getService/${item.id}`);
            if(prodSlug && prodSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${prodSlug.slug}` : `${lang}/${prodSlug.slug}`;
        }
    }
    if (news && news.length) {
        let newsSlug = [];
        news = news.map(el => {
            el = el.toJSON();
            newsSlug.push(`/getPost/${el.id}`);
            return el;
        });
        newsSlug = await models.links.findAll({
            where: { original_link: newsSlug },
            raw: true
        })
        for (let item of news) {
            let prodSlug = newsSlug.find(el => el.original_link == `/getPost/${item.id}`);
            if(prodSlug && prodSlug.slug) item.slug = lang === config.LANGUAGES[0] ? `${prodSlug.slug}` : `${lang}/${prodSlug.slug}`;
        }
    }
    result.push(...news);
    result.sort(function(a,b){
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return new Date(b.created_at) - new Date(a.created_at);
    });
    return paginator(result,page,count);
}


module.exports = {
    searchItems: async(req, res) => {
        log.info(`Start searchItems data:${JSON.stringify(req.body)}`)
        const lang = req.lang;
        const languages = config.LANGUAGES
        try {
            let { search } = req.body;
            let result = [];
            let products = await productsSearch(search, 5, 1,lang);
            for (let i = 0; i < products.rows.length; i++) {
                if (products.rows[i].image) {
                    products.rows[i].image = `/uploads/products/100X120/${products.rows[i].image.filename}`
                } else {
                    products.rows[i].image = `/img/placeholder.png`
                }
                result.push(products.rows[i]);
            }

            log.info(`End searchItems data:${JSON.stringify(result)}`)
            res.json(result);
        } catch (e) {
            log.error(e)
            res.status(400).json({
                message: e.message,
                errCode: '400'
            });
        }
    },
    searchItemsFull: async(req, res) => {
        log.info(`Start searchItemsFull data:${JSON.stringify(req.body)}`);
        const lang = req.lang;
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        if(req.query.current_page) page = parseInt(req.query.current_page);
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        if(req.query.per_page) perPage = parseInt(req.query.per_page);
        try {
            req.body.search = req.query.search;
            req.body.lang = lang;
            const id = req.user ? req.user.userid : null;
            let user, notificationsCount;
            if (id) {
                user = await userService.getUser(id, ['id', 'first_name', 'last_name', 'email', 'phone','role']);
                notificationsCount = await notificationService.countUserNotifications(id, lang);
                user = user ? user.toJSON() : user;
                user = {...user };
            }

            let products = await productsSearch(req.body.search, perPage, page, lang);

            let countPages;
            let minPage, maxPage;
            let lastElem = true;
            let isPaginationShow = true;
            let paginationData;
            let slugs = {};
            const languages = config.LANGUAGES;
            for(let i = 0; i < languages.length; i++){
                if(languages[i] == "uk"){
                    slugs.uk = `/search?search=${req.query.search}`
                } else slugs[languages[i]] = `/${languages[i]}/search?search=${req.query.search}`

            }

            paginationData = await paginationUtil.pagination(countPages,products.count,perPage,page,minPage,maxPage,lastElem,isPaginationShow);

            let header_footer = await menuService.getHeaderFooter(lang);
            let menu = await menuService.getMenu(lang);
            const renderHeader =  'client/layout.hbs';

            let browserPageName
            switch (lang) {
                case 'uk':
                    browserPageName = "Пошук"
                    break;
                case 'ru':
                    browserPageName = "Поиск"
                    break;
                case 'en':
                    browserPageName = "Search"
                    break;
                default:
                    break;
            }

            let homePage = {};
            let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
            if(getHomePage){
                let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                homepageLink = homepageLink.toJSON()
                homePage.slug = homepageLink.slug
                if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
            }

            log.info(`End searchItemsFull`)
            res.render('client/search', {
                metaData: req.body.metaData,
                layout: renderHeader,
                lang: lang,
                browserPageName,
                homePage,
                search: req.body.search,
                menu,
                consultation_form: await pagesService.getFormByPage(4,lang),
                slugs,
                lastElem: paginationData.pagination.lastElem,
                page,
                notificationsCount: notificationsCount ? notificationsCount: null,
                products_count: products.count,
                products: products,
                header_footer: header_footer ? header_footer : null,
                countPages: paginationData.countPages,
                isPaginationShow: paginationData.isPaginationShow,
                pagination : paginationData.pagination,
                user,
                pagination_js: true,
                search_js: true,
            });
        } catch (e) {
            log.error(e)
            res.status(400).json({
                message: e.message,
                errCode: '400'
            });
        }
    },
    searchItemsAjax: async(req, res) => {
        log.info(`Start searchItemsFullAjax data:${JSON.stringify(req.body)}`)
        const lang = req.lang;
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        let countPages, minPage, maxPage;
        let lastElem = true;
        let isPaginationShow = true;
        try {
            req.body.search = req.query.search;
            req.body.lang = lang;

            let products = await productsSearch(req.body.search, perPage, page, lang);
            let paginationData = await paginationUtil.pagination(countPages,products.count,perPage,page,minPage,maxPage,lastElem,isPaginationShow)

            const pagination = await templateUtil.getTemplate({
                countPages: paginationData.countPages,
                isPaginationShow: paginationData.isPaginationShow,
                pagination :  paginationData.pagination,
            }, 'partials/pagination');

            const html = await templateUtil.getTemplate({
                products: products,
                lang: lang,
                search : req.body.search
            }, 'client/search-ajax');
            log.info(`End searchItemsFullAjax data:${JSON.stringify({html,pagination,count: products.count,isPaginationShow})}`);
            res.json({
                html: html,
                pagination: pagination,
                products_count: products.count,
                isPaginationShow: isPaginationShow
            })

        } catch (e) {
            log.error(e)
            res.status(400).json({
                message: e.message,
                errCode: '400'
            });
        }
    },
}
