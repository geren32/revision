const express = require('express');
const router = express.Router();
let slugController = require('../controllers/slug-controller');
let pagesController = require('../controllers/pages-controller');
slugController = new slugController();
pagesController = new pagesController();
const { models } = require('../sequelize-orm');
const log = require('../utils/logger');
const config = require('../configs/config')

router.get('/:slug(*)', async function (req, res, next) {
    try {
        let url = req.params.slug;
        let lang = config.LANGUAGES[0];
        let slug;
        let link;
        req.lang = lang;
        if (url && url.indexOf("uploads") > -1 || url && url.indexOf("img") > -1 ||url && url.indexOf("favicon.ico") > -1) {
            next()

        } else {

            const match = url.match(/^(en[\/\?]|ru[\/\?])(.*)/i);
            if (match) {
                lang =  match[1] ? match[1].replace('/','') : config.LANGUAGES[0];
                slug = match[2] || '/';
                link = await models.links.findOne({ where: { slug, lang }, raw: true });
                if(link && link.original_link){
                    req.url = link.original_link;
                }else{
                    req.url = `/${slug}` || '/';
                }

            }else if(url){
                slug = url;
                link = await models.links.findOne({ where: { slug, lang }, raw: true });
                if(link && link.original_link){
                    req.url = link.original_link;
                }
            }
            req.lang = lang;
            next();

        }
    } catch (error) {
        log.error(`${error}`)
    }
})

router.post('/:slug(*)', async function (req, res, next) {
    try {
        let url = req.params.slug;
        let lang = config.LANGUAGES[0];
        let slug;
        let link;

        if (url && url.indexOf("uploads") > -1) {
            next()

        } else {

            const match = url.match(/^(en[\/\?]|ru[\/\?])(.*)/i);
            if (match) {
                lang =  match[1] ? match[1].replace('/','') : config.LANGUAGES[0];
                slug = match[2] || '/';
                link = await models.links.findOne({ where: { slug, lang }, raw: true });
                if(link && link.original_link){
                    req.url = link.original_link;
                }else{
                    req.url = `/${slug}` || '/';
                }

            }else if(url){
                slug = url;
                link = await models.links.findOne({ where: { slug, lang }, raw: true });
                if(link && link.original_link){
                    req.url = link.original_link;
                }
            }

            req.lang = lang;
            next();

        }
    } catch (error) {
        log.error(`${error}`)
    }
})



module.exports = router;
