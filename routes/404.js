const express = require('express');
const linksService = require('../services/links.service');
const router = express.Router();
const menuService = require('../services/menu.service');
const pagesService = require('../services/pages.service');
const extraUtil = require('../utils/extra-util');
const config = require('../configs/config')
const {Op} = require('sequelize')
const { models } = require("../sequelize-orm");
const userService = require("../services/user.service");


router
    .get('/:slug(*)', async function (req, res, next) {
        let slug = req.params.slug;
        if (slug && (slug.indexOf("uploads") > -1 || slug.indexOf("img") > -1 || slug.indexOf("favicon.ico") > -1)) {
            return next();
        }
        const lang = req.lang;
        const languages = config.LANGUAGES
        const id = req.user ? req.user.id : null;
        // let page = await pagesService.getPage({ lang:lang, template: 'homepage' },null,lang)
        // const original_id = page && page.origin_id ? page.origin_id : page.id
        // const otherLangsForPage = await pagesService.getAllPages({ origin_id: original_id });
        // const otherLangsForPageOriginalLinks = otherLangsForPage.map((i,index) => extraUtil.generateLinkUrlForPage(i.type, i.id, i.template,languages[index+1]));
        // const pageOriginalLinksFilter = {
        //     [Op.in]: [extraUtil.generateLinkUrlForPage(page.type, original_id, page.template, languages[0]), ...otherLangsForPageOriginalLinks]
        // };
        let page_404 = await pagesService.get404Page(lang)
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
        res.render('./404', {
            langs: req.langs,
            lang: lang,
            slugs,
            metaData: req.body.metaData,
            layout: 'client/layout.hbs',
            first_name: user ? user.first_name : null,
            last_name: user ? user.last_name : null,
            header_footer: header_footer ? header_footer: null,
            menu: menu ? menu: null,
            page_404,
        });
    })


module.exports = router;
