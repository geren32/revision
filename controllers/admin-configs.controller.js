const { Op } = require("sequelize");
const path = require("path");
const log = require("../utils/logger");
const menuService = require('../services/menu.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { models } = require('../sequelize-orm');
const emailUtil = require('../utils/mail-util');
const fs = require('fs');
const appUtils = require('../utils/app-util');
const options = appUtils.getArgs();
const builder = require('xmlbuilder');
const moment = require('moment');
const extraUtil = require('../utils/extra-util');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
module.exports = {

    getDashboard: async(req, res) => {
        log.info(`Start get Dashboard data:${JSON.stringify(req.body)}`)
        try {
            let result = {};
            result.users = await models.user.count();
            // result.products = await models.product.count({ where: { 'lang': 'uk' } });
            result.orders = await models.orders.count();
            result.services = await models.service.count({ where: { 'lang': 'uk' } });
            result.news = await models.posts.count({ where: { 'lang': 'uk' } });

            log.info(`Eng get Dashboard data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },



    sendHelpMessage: async(req, res) => {
        log.info(`Start sendHelpMessage data:${JSON.stringify(req.body)}`)
        try {
            const lang = req.lang;
            let { message } = req.body;
            if (!message) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
            }
            let result;
            let mailObj = {
                to: config.REDSTONE_MAIL,
                subject: config.MAIL_TO_REDSTONE_SUBJECT,
                data: {
                    message: message,
                    lang: lang
                }
            };
            let email = await emailUtil.sendMail(mailObj, 'help-message');
            result = !!email;
            log.info(`End sendHelpMessage data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    saveShopConfigs: async(req, res) => {
        log.info(`Start saveShopConfigs data:${JSON.stringify(req.body)}`)
        try {
            let {
                lang,
                self_pickup,
                delivery_emails,
                register_emails,
                delivery_types,
                pages_settings,
                popups_settings,
                pay_types,
                dealer_discount,
                designer_discount,
                hide_testimonials
            } = req.body;

            if (dealer_discount > 99 || designer_discount > 99) {
                return res.status(400).json({
                    message: 'error',
                    errCode: '400'
                });
            }
            if (dealer_discount < 0 || designer_discount < 0) {
                return res.status(400).json({
                    message: 'error',
                    errCode: '400'
                });
            }

            let regexp = /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/


            if (register_emails) {
                let emailsToCheck = register_emails.replace(/[, ]+/g, " ").trim().replace(/[ ]+/g, ",");
                emailsToCheck = emailsToCheck.trim().split(",");


                for (let email of emailsToCheck) {
                    email = email.trim()
                    if (!regexp.test(email)) {
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                    if (!config.REGEX_EMAIL.test(email)) {
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                }
            }
            if (delivery_emails) {
                let emailsToCheck = delivery_emails.replace(/[, ]+/g, " ").trim().replace(/[ ]+/g, ",");
                emailsToCheck = emailsToCheck.trim().split(",");
                for (let email of emailsToCheck) {
                    email = email.trim()
                    if (!regexp.test(email)) {
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                    if (!config.REGEX_EMAIL.test(email)) {
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                }
            }
            let configs = await menuService.updateConfigs({
                lang,
                self_pickup,
                delivery_emails,
                register_emails,
                delivery_types,
                pages_settings,
                popups_settings,
                pay_types,
                dealer_discount,
                designer_discount,
                hide_testimonials
            }, req.userid);
            log.info(`End saveShopConfigs data:${JSON.stringify(req.body)}`)
            return res.status(200).json(configs);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getShopConfigs: async(req, res) => {
        log.info(`Start getShopConfigs data:${JSON.stringify(req.body)}`)
        try {
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            let result = await menuService.getConfigs(lang);
            log.info(`End getShopConfigs data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getMapConfigs: async(req, res) => {
        log.info(`Start getMapConfigs data:${JSON.stringify(req.body)}`)
        try {
            let result = await menuService.getMapConfigs(req.query.lang);
            log.info(`End getMapConfigs data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    saveMapConfigs: async(req, res) => {
        log.info(`Start  saveMapConfigs data:${JSON.stringify(req.body)}`)
        try {
            let { google_maps,page_404,np_key,cookie_popup,liqpay,orders_mail_to_client,card_privat,pre_orders_emails, lang } = req.body;
            if (!google_maps) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
            }

            let configs = await menuService.updateMapConfigs({ map_key: google_maps,page_404, np_key, cookie_popup, liqpay, orders_mail_to_client , card_privat,pre_orders_emails,lang }, req.userid);
            log.info(`End  saveMapConfigs data:${JSON.stringify(configs)}`)
            return res.status(200).json(configs);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    siteIndexing: async(req, res) => {
        log.info(`Start  siteIndexing data:${JSON.stringify(req.body)}`)
        let value = req.params.value;
        const frontUrl = options['front-url'];
        try {
            if (value == 0) {
                fs.writeFileSync(path.join(process.cwd(), 'public', 'robots.txt'), 'User-agent: *' + "\n" + 'Disallow: /');
                log.info(`End  siteIndexing data:${JSON.stringify(false)}`)
                return res.status(200).json({ indexing: false });
            } else if (value == 1) {
                fs.writeFileSync(path.join(process.cwd(), 'public', 'robots.txt'), 'User-agent: *' + "\n" + 'Allow: *' + "\n" + "\n" + `Sitemap: ${frontUrl}/sitemap.xml`);
                log.info(`End  siteIndexing data:${JSON.stringify(true)}`)
                return res.status(200).json({ indexing: true });
            }
            return res.status(errors.BAD_REQUEST_VALUE_OF_INDEXING.code).json({
                message: errors.BAD_REQUEST_VALUE_OF_INDEXING.message,
                errCode: errors.BAD_REQUEST_VALUE_OF_INDEXING.code
            });
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    statusOfIndexing: async(req, res) => {
        log.info(`Start  statusOfIndexing data:${JSON.stringify(req.body)}`)
        try {
            let robotsFile = fs.readFileSync(path.join(process.cwd(), 'public', 'robots.txt'));
            let result = !(robotsFile.toString() == 'User-agent: *\nDisallow: /');
            log.info(`End statusOfIndexing data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    statusTestimonialsValidation: async(req, res) => {
        log.info(`Start statusTestimonialsValidation data:${JSON.stringify(req.body)}`)
        try {
            let checkProductReviewsConfig = await models.configs.findOne({
                where: { type: 'check_product_reviews' },
                raw: true
            })
            let result = checkProductReviewsConfig && checkProductReviewsConfig.value ? JSON.parse(checkProductReviewsConfig.value) : checkProductReviewsConfig;
            result = result ? !!result.status : false;
            log.info(`End statusTestimonialsValidation data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    changeTestimonialsValidation: async(req, res) => {
        log.info(`Start changeTestimonialsValidation data:${JSON.stringify(req.body)}`)
        let value = req.params.value;
        try {
            value = Number(value);
            await models.configs.update({
                value: JSON.stringify({ status: value })
            }, { where: { type: 'check_product_reviews' } });
            log.info(`End changeTestimonialsValidation data:${JSON.stringify(!!value)}`)
            return res.status(200).json({ status: !!value });
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    generateSitemap: async(req, res) => {
        const lang = req.lang
        log.info(`Start generateSitemap data:${JSON.stringify(req.body)}`)
        try {
            const frontUrl = options['front-url'];

            let doc = builder.create('urlset', {
                    version: '1.0',
                    encoding: 'UTF-8'
                })
                .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

            let pages = await models.pages.findAll({ where: { status: config.GLOBAL_STATUSES.ACTIVE }, attributes: ['id', 'status', 'type', 'template', 'updated_at'] });
            let posts = await models.posts.findAll({ where: { status: config.GLOBAL_STATUSES.ACTIVE }, attributes: ['id', 'status', 'updated_at'] });
            let products = await models.product.findAll({ where: { status: config.GLOBAL_STATUSES.ACTIVE }, attributes: ['id', 'status', 'updated_at'] });
            let categorys = await models.product.findAll({ where: { status: config.GLOBAL_STATUSES.ACTIVE }, attributes: ['id', 'status', 'updated_at'] });
            for(let lang of config.LANGUAGES){
                if (pages && pages.length) {
                    for (let page of pages) {
                        if (page.id && page.type && page.template) {
                            const link = await models.links.findOne({ where: { original_link: extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang),lang } })
                            let slug;
                            if (link && link.slug) {
                                slug = link.slug;
                            } else continue;
                            page.date = page.updated_at ? moment(new Date(page.updated_at)).format("YYYY-MM-DD") : null;
                            let url = doc.ele('url');
                            if(slug == '/'){
                                if(lang == config.LANGUAGES[0]){
                                    url.ele('loc', `${frontUrl}` + slug);
                                } else url.ele('loc', `${frontUrl}/${lang}` + slug);
                            } else {
                                if(lang == config.LANGUAGES[0]){
                                    url.ele('loc', `${frontUrl}/` + slug);
                                } else url.ele('loc', `${frontUrl}/${lang}/` + slug);
                            }


                            url.ele('lastmod', page.date);
                            url.ele('changefreq', `daily`);
                        }
                    }
                }
                if (posts && posts.length) {
                    for (let post of posts) {
                        if (post.id) {
                            const link = await models.links.findOne({ where: { original_link: `/getPost/${post.id}`,lang } })
                            let slug;
                            if (link && link.slug) {
                                slug = link.slug;
                            } else continue;
                            post.date = post.updated_at ? moment(post.updated_at).format("YYYY-MM-DD") : null;
                            let url = doc.ele('url');
                            if(lang == config.LANGUAGES[0]){
                                    url.ele('loc', `${frontUrl}/` + slug);
                            } else url.ele('loc', `${frontUrl}/${lang}/` + slug);


                            url.ele('lastmod', post.date);
                            url.ele('changefreq', `daily`);
                        }
                    }
                }
                if (products && products.length) {
                    for (let page of products) {
                        if (page.id) {
                            const link = await models.links.findOne({ where: { original_link: extraUtil.generateLinkUrlForPage('product', page.id, 'product', lang),lang } })
                            let slug;
                            if (link && link.slug) {
                                slug = link.slug;
                            } else continue;
                            page.date = page.updated_at ? moment(new Date(page.updated_at)).format("YYYY-MM-DD") : null;
                            let url = doc.ele('url');
                            if(lang == config.LANGUAGES[0]){
                                url.ele('loc', `${frontUrl}/` + slug);
                            } else url.ele('loc', `${frontUrl}/${lang}/` + slug);

                            url.ele('lastmod', page.date);
                            url.ele('changefreq', `daily`);
                        }
                    }
                }
                if (categorys && categorys.length) {
                    for (let page of categorys) {
                        if (page.id) {
                            const link = await models.links.findOne({ where: { original_link: extraUtil.generateLinkUrlForPage('catalog', page.id, 'catalog', lang),lang } })
                            let slug;
                            if (link && link.slug) {
                                slug = link.slug;
                            } else continue;
                            page.date = page.updated_at ? moment(new Date(page.updated_at)).format("YYYY-MM-DD") : null;
                            let url = doc.ele('url');

                            if(lang == config.LANGUAGES[0]){
                                url.ele('loc', `${frontUrl}/` + slug);
                            } else url.ele('loc', `${frontUrl}/${lang}/` + slug);

                            url.ele('lastmod', page.date);
                            url.ele('changefreq', `daily`);
                        }
                    }
                }
            }


            doc = doc.end({ pretty: true });
            fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), doc);
            log.info(`End generateSitemap data:${JSON.stringify(true)}`)
            return res.status(200).json(true);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },

    generateFeedFile: async(req, res) => {
        log.info(`Start generateFeedFile data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        try {
            const frontUrl = options['front-url'];

            for (let lang of languages) {

                let doc = builder.create('rss', {
                        version: '1.0'
                    })
                    .att('xmlns:g', 'http://base.google.com/ns/1.0')
                    .att('version', '2.0');

                let channel = doc.ele('channel');
                channel.ele('title', 'Test Store');
                channel.ele('link', frontUrl);
                channel.ele('description', 'An example item from the feed');

                let products = await models.product.findAll({
                    where: {
                        [Op.and]: [
                            { status: config.GLOBAL_STATUSES.ACTIVE },
                            { lang: lang }
                        ]
                    },
                    include: [
                        { model: models.uploaded_files, as: 'image' }
                    ]
                });


                if (products && products.length) {
                    for (let product of products) {
                        if (product.id) {
                            let link = await models.links.findOne({ where: { original_link: `/getProduct/${product.id}` } });
                            if (!link) link = await models.links.findOne({ where: { original_link: `/getProduct/${product.origin_id}` } })
                            let slug;
                            if (link && link.slug) {
                                slug = link.slug;
                            } else continue;

                            let item = doc.ele('item');
                            item.ele('g:id', product.id);
                            if (product.name) item.ele('g:title', product.name);
                            if (product.description) item.ele('g:description', product.description);
                            if (slug) item.ele('g:link', `${frontUrl}/${slug}`);
                            if (product.image && product.image.filename) item.ele('g:image_link', `${frontUrl}/uploads/${product.image.type ? product.image.type : ''}/${product.image.filename}`);
                            if (product.price) item.ele('g:price', `${product.price/100} UAH`);

                        }
                    }
                }


                doc = doc.end({ pretty: true });
                fs.writeFileSync(path.join(process.cwd(), 'public', `${lang}_feed.xml`), doc);
            }
            log.info(`End generateFeedFile data:${JSON.stringify(true)}`)
            return res.status(200).json(true);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    }
}
