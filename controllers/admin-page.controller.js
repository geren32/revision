const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");

const pagesService = require('../services/pages.service');
const config = require('../configs/config');
const { slugify } = require('transliteration');
const linksService = require('../services/links.service');
const postService = require('../services/post.service');
const extraUtil = require('../utils/extra-util');
const errors = require('../configs/errors');
const metaDataService = require('../services/meta-data.service');
const categorieService = require('../services/categorie.service');
const adminHistoryService = require('../services/admin-changes-history.service');
const adminPreviewService = require('../services/admin.preview.service');
const log = require('../utils/logger');


module.exports = {

    savePage: async(req, res) => {
        log.info(`Start savePage data:${JSON.stringify(req.body)}`)
        let transaction = await sequelize.transaction();
        try {
            let result
            let { id, title, sections, template, slug,faq,status, button_link, button_text, background_image, background_image_mobile, banner_image, banner_image_mobile, meta_data, type, marker } = req.body;
            const languages = config.LANGUAGES;

            if (!id) {

                status = status ? status : config.GLOBAL_STATUSES.WAITING;
                let originPage;

                if (!type) {

                    return res.status(errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code).json({
                        message: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.message,
                        errCode: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code
                    });
                }


                for (let lang of languages) {
                    let currentSlug;
                    if (!slug) {
                        // transliterate
                        currentSlug = slugify(title);
                        let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, lang }, transaction);
                        let localSlug = currentSlug
                        let i = 1
                        while (checkSlag) {
                            localSlug = currentSlug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({ slug: localSlug, lang }, transaction);
                            i++
                        }
                        currentSlug = localSlug
                    } else {
                        let checkSlag = await linksService.getLinkByFilter({ slug, lang }, transaction);
                        let localSlug = slug
                        let i = 1
                        while (checkSlag) {
                            localSlug = slug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({ slug: localSlug, lang }, transaction);
                            i++
                        }
                        slug = localSlug
                        currentSlug = slug
                    }
                    let pageData = {
                        lang: lang,
                        origin_id: originPage && originPage.id ? originPage.id : 0,
                        title,
                        type: type,
                        banner_image_id: banner_image && banner_image.id ? banner_image.id : null,
                        banner_image_mobile_id: banner_image_mobile && banner_image_mobile.id ? banner_image_mobile.id : null,
                        background_image_id: background_image && background_image.id ? background_image.id : null,
                        background_image_mobile_id: background_image_mobile && background_image_mobile.id ? background_image_mobile.id : null,
                        created_user_id: req.userid,
                        updated_user_id: req.userid,
                        faq: faq ? JSON.stringify(faq) : null,

                        status,
                        template
                    };
                    let pages_sections = extraUtil.convertPageSectionsForDBFormat(sections);
                    if (pages_sections.length) pageData.pages_contents = pages_sections;





                    let page = await pagesService.createPage(pageData, transaction);

                    const url = await extraUtil.generateLinkUrlForPage(type, page.id, template, lang);
                    const linkData = {
                        slug: currentSlug,
                        original_link: await extraUtil.generateLinkUrlForPage(type, page.id, template, lang),
                        type: (type === "dealer") ? 'dealer-page' : 'page',
                        lang
                    };
                    let link = await linksService.createLink(linkData, transaction);
                    if (link) page.slug = link.slug;
                    let metaData;
                    if (meta_data) {
                        metaData = {
                            url: url,
                        }
                    }

                    if(meta_data.meta_title){
                        metaData.meta_title = meta_data.meta_title;
                    } else  metaData.meta_title = title
                    if(meta_data.meta_desc) {
                        metaData.meta_desc = meta_data.meta_desc;
                    } else metaData.meta_desc = null

                    if (meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                    if (meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;

                    if (metaData) page.meta_data = await metaDataService.createMetaData(metaData, transaction);
                    await adminHistoryService.adminCreateHistory({ item_id: page.id, user_id: req.userid, type: 'page' }, transaction);

                    if (!originPage) originPage = page;


                }
                result = originPage

            } else if (status == config.GLOBAL_STATUSES.DUPLICATE_POST) {

                let originPost;
                let duplicatePage;
                for (let lang of languages) {
                    const filter = {
                        [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                    };
                    let page = await pagesService.getOriginPageFormat(filter, transaction);
                    const oldLink = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang),lang }, transaction)

                    if (page && page.id) {
                        let newslug = oldLink.slug + '-' + Date.now();
                        duplicatePage = extraUtil.removeFields(page.toJSON(), ['id', 'page_id', 'created_at', 'updated_at']);
                        duplicatePage.status = config.GLOBAL_STATUSES.WAITING;
                        duplicatePage.updated_user_id = req.userid;
                        duplicatePage.created_user_id = req.userid;
                        duplicatePage.lang = lang;
                        duplicatePage.origin_id = originPost && originPost.id ? originPost.id : 0;

                        duplicatePage = await pagesService.createPage(duplicatePage, transaction);

                        const url = extraUtil.generateLinkUrlForPage(page.type, duplicatePage.id, page.template, lang);
                        const link = await linksService.createLink({
                                slug: newslug,
                                original_link: extraUtil.generateLinkUrlForPage(duplicatePage.type, duplicatePage.id, duplicatePage.template, lang),
                                type: (page.type === 'dealer') ? 'dealer-page' : 'page',
                                lang
                            },
                            transaction);
                        if (link && link.slug) duplicatePage.slug = link.slug;
                        let metaData = await postService.getMetaDataByslugOrUrl(extraUtil.generateLinkUrlForPage(page.type, oldLink.original_link, page.template, lang), transaction);
                        if (metaData) {
                            metaData = extraUtil.removeFields(metaData.toJSON(), ["id", "url"]);
                            metaData.url = url;
                            duplicatePage.meta_data = await metaDataService.createMetaData(metaData, transaction);
                        }

                        if (!originPost) originPost = duplicatePage;
                    }
                }


                result = duplicatePage

            } else {

                if (!title && status && id) {
                    const lang = req.body.lang ? req.body.lang : languages[0];
                    const filter = {
                        [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                    };
                    let page = await pagesService.getOnlyPage(filter, true, transaction);
                    if (!page) {
                        await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                        });
                    }
                    let pageObj = {
                        updated_user_id: req.userid,
                        status: status,
                        updated_at: new Date()
                    };

                    await pagesService.updatePageOnly(pageObj, { id: id }, transaction);

                    await adminHistoryService.adminCreateHistory({ item_id: page.id, user_id: req.userid, type: 'page' }, transaction);

                    await transaction.commit();
                    log.info(`End saveUser updated`)
                    let result = await pagesService.getOnlyPage(filter, true);
                    return res.status(200).json(result);

                }

                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = {
                    [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                };
                const otherLangFilter = {
                    [Op.or]: [{ id: id }, { origin_id: id }]
                };
                let page = await pagesService.getOnlyPage(filter, true, transaction);
                if (!page) {
                    await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });
                }
                let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang),lang }, transaction);
                // const linkslug = link && link.slug ? link.slug : null;
                // let otherLangPages = await pagesService.getAllPages({...otherLangFilter,
                //     id: {
                //         [Op.ne]: page.id
                //     }
                // });

                if (!slug) {
                    // transliterate
                    slug = slugify(title);
                        let checkSlag = await linksService.getLinkByFilter({slug: slug,lang}, transaction);
                        let localSlug = slug
                        let i = 1
                        while(checkSlag){
                            localSlug = slug
                            localSlug = localSlug + "-" + i
                            checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang}, transaction);
                            i++
                        }
                        slug = localSlug


                } else {
                    let checkSlag = await linksService.getAllLinks({ slug, lang }, transaction);
                    if (checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                    if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {

                        return res.status(errors.BAD_REQUEST_LINK_ALREADY_EXIST.code).json({
                            message: errors.BAD_REQUEST_LINK_ALREADY_EXIST.message,
                            errCode: errors.BAD_REQUEST_LINK_ALREADY_EXIST.code
                        });
                    }

                }


                let metaData = {};

                if(meta_data.meta_title){
                    metaData.meta_title = meta_data.meta_title;
                } else  metaData.meta_title = title
                if(meta_data.meta_desc) {
                    metaData.meta_desc = meta_data.meta_desc;
                } else metaData.meta_desc = null
                if (meta_data && meta_data.meta_keys){
                    metaData.meta_keys = meta_data.meta_keys
                } else  metaData.meta_keys = null
                if (meta_data && meta_data.meta_canonical){
                    metaData.meta_canonical = meta_data.meta_canonical
                } else metaData.meta_canonical = null


                if (link && link.slug !== slug) {
                    await linksService.updateLink({ slug: slug }, link.slug, transaction);
                }

                let oldUrl = extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang);

                let [findedMetaData, isCreated] = await metaDataService.findOrCreateMetaData({ where: { url: oldUrl }, defaults: (metaData.url ? metaData : {...metaData, url: oldUrl }) }, transaction);
                if (findedMetaData && !isCreated) {
                    await findedMetaData.update(metaData, { transaction });
                }

                let pageData = {
                    updated_at: new Date().toISOString(),
                };

                if (title) pageData.title = title
                if (template) pageData.template = template
                if (status) pageData.status = status
                if (banner_image && banner_image.id){
                    pageData.banner_image_id = (banner_image.origin_id === 0 ? banner_image.id : banner_image.origin_id)
                }  else pageData.banner_image_id  = null
                if (banner_image_mobile && banner_image_mobile.id){
                    pageData.banner_image_mobile_id = (banner_image_mobile.origin_id === 0 ? banner_image_mobile.id : banner_image_mobile.origin_id)
                } else pageData.banner_image_mobile_id = null
                if (background_image && background_image.id){
                    pageData.background_image_id = (background_image.origin_id === 0 ? background_image.id : background_image.origin_id)
                }  else pageData.background_image_id = null
                if (background_image_mobile && background_image_mobile.id){
                    pageData.background_image_mobile_id = (background_image_mobile.origin_id === 0 ? background_image_mobile.id : background_image_mobile.origin_id)
                } else pageData.background_image_mobile_id = null
                if (req.userid) pageData.updated_user_id = req.userid
                if(faq) pageData.faq = JSON.stringify(faq)

                let sectionsData = extraUtil.convertPageSectionsForDBFormat(sections, page.id);

                page = await pagesService.updatePage(page.id, pageData, sectionsData, transaction,lang);
                link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang),lang }, transaction);
                if (link) page.slug = link.slug;
                page.meta_data = await postService.getMetaDataByslugOrUrl(extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang), transaction);
                await adminHistoryService.adminCreateHistory({ item_id: page.id, user_id: req.userid, type: 'page' }, transaction);
                page.history = await adminHistoryService.adminFindAllHistory({
                    type: 'page',
                    item_id: page.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                }, transaction);

                await pagesService.updatePageOnly({
                    status: status,
                    updated_user_id: req.userid,
                    updated_at: new Date().toISOString(),



                }, otherLangFilter, transaction);



                result = page

            }
            await transaction.commit();
            log.info(`End savePage data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            console.log(error,'634734634634436346345')
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },


    createPagePreview: async(req, res) => {
        log.info(`Start createPagePreview data:${JSON.stringify(req.body)}`)
        let transaction = await sequelize.transaction();
        try {
            let { id, title, sections, template, slug,faq, status, banner_image, banner_image_mobile, background_image, background_image_mobile, meta_data, type, marker, region_activity_id } = req.body;
            const languages = config.LANGUAGES;
            status = config.GLOBAL_STATUSES.ACTIVE;
            let originPage;
            if (!type) {
                return res.status(errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code).json({
                    message: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.message,
                    errCode: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code
                });

            }
            let getOriginPage = null
            if (id) {
                getOriginPage = await pagesService.getPage({ id: id }, null, config.LANGUAGES[0]);
            }


            await adminPreviewService.deletePreviewPage();
            for (let lang of languages) {
                let currentSlug;
                if (!slug) {
                    // transliterate
                    currentSlug = slugify('preview-' + title);
                    let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, lang }, transaction);
                    let localSlug = currentSlug
                    let i = 1
                    while (checkSlag) {
                        localSlug = currentSlug
                        localSlug = localSlug + "-" + i
                        checkSlag = await linksService.getLinkByFilter({ slug: localSlug, lang }, transaction);
                        i++
                    }
                    currentSlug = localSlug
                } else {
                    currentSlug = 'preview-' + slug;
                    let checkSlag = await linksService.getLinkByFilter({ slug: currentSlug, lang }, transaction);
                    let localSlug = currentSlug
                    let i = 1
                    while (checkSlag) {
                        localSlug = currentSlug
                        localSlug = localSlug + "-" + i
                        checkSlag = await linksService.getLinkByFilter({ slug: localSlug, lang }, transaction);
                        i++
                    }
                    currentSlug = localSlug
                }

                let pageData = {
                    preview: true,
                    lang: lang,
                    origin_id: originPage && originPage.id ? originPage.id : 0,
                    title,
                    type: type,
                    banner_image_id: banner_image && banner_image.id ? banner_image.id : null,
                    banner_image_mobile_id: banner_image_mobile && banner_image_mobile.id ? banner_image_mobile.id : null,
                    background_image_id: background_image && background_image.id ? background_image.id : null,
                    background_image_mobile_id: background_image_mobile && background_image_mobile.id ? background_image_mobile.id : null,
                    created_user_id: req.userid,
                    updated_user_id: req.userid,
                    status,
                    template: template,
                    region_activity_id,
                    faq: faq ? JSON.stringify(faq) : null,
                };

                let pages_sections = await extraUtil.convertPageSectionsForDBFormat(sections);

                if (pages_sections.length) pageData.pages_contents = pages_sections;




                let page = await pagesService.createPage(pageData, transaction, lang);
                const url = await extraUtil.generateLinkUrlForPage(type, page.id, template, lang);
                const linkData = {
                    slug: currentSlug,
                    original_link: await extraUtil.generateLinkUrlForPage(type, page.id, template, lang),
                    type: 'page',
                    lang
                };
                let link = await linksService.createLink(linkData, transaction);
                if (link) page.slug = link.slug;
                let metaData;
                if (meta_data) {
                    metaData = {
                        url: url,
                    }
                }
                if (meta_data && meta_data.meta_title){
                    metaData.meta_title = meta_data.meta_title
                }  else  metaData.meta_title = null
                if (meta_data && meta_data.meta_desc){
                    metaData.meta_desc = meta_data.meta_desc
                } else  metaData.meta_desc = null
                if (meta_data && meta_data.meta_keys){
                    metaData.meta_keys = meta_data.meta_keys
                } else  metaData.meta_keys = null
                if (meta_data && meta_data.meta_canonical){
                    metaData.meta_canonical = meta_data.meta_canonical
                } else metaData.meta_canonical = null

                if (metaData) page.meta_data = await metaDataService.createMetaData(metaData, transaction);
                await adminHistoryService.adminCreateHistory({ item_id: page.id, user_id: req.userid, type: 'page' }, transaction);

                if (!originPage) originPage = page;

            }
            await transaction.commit();
            let result = {
                url: '/' + originPage.slug
            }
            log.info(`End createPagePreview data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },

    getAllPages: async(req, res) => {
        log.info(`Start getAllPages data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        const types = req.body.types;
        try {
            if (!types || !types.length) {

                return res.status(errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code).json({
                    message: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.message,
                    errCode: errors.BAD_REQUEST_TYPE_IS_NOT_PRESENT.code
                });
            }

            let numberOfWaitionPages = await pagesService.countPagesByParam({
                origin_id: 0,
                status: config.GLOBAL_STATUSES.WAITING,
                type: {
                    [Op.in]: types
                },
                preview: {
                    [Op.eq]: null
                }
            });
            let numberOfActivePages = await pagesService.countPagesByParam({
                origin_id: 0,
                status: config.GLOBAL_STATUSES.ACTIVE,
                type: {
                    [Op.in]: types
                },
                preview: {
                    [Op.eq]: null
                }
            });
            let numberOfDeletedPages = await pagesService.countPagesByParam({
                origin_id: 0,
                status: config.GLOBAL_STATUSES.DELETED,
                type: {
                    [Op.in]: types
                },
                preview: {
                    [Op.eq]: null
                }
            });
            let numberOfAllPages = await pagesService.countPagesByParam({
                origin_id: 0,
                status: {
                    [Op.ne]: config.GLOBAL_STATUSES.DELETED
                },
                type: {
                    [Op.in]: types
                },
                preview: {
                    [Op.eq]: null
                }
            });
            let statusCount = {
                all: numberOfAllPages,
                1: numberOfDeletedPages,
                2: numberOfActivePages,
                4: numberOfWaitionPages,
            };

            let where;
            let lang
            if(req.body.lang){
                lang = req.body.lang
            } else lang = 'uk'

            if (req.body && req.body.status && req.body.status === 'all') {
                where = {
                    lang: lang,
                    status: {
                        [Op.ne]: config.GLOBAL_STATUSES.DELETED
                    },
                    type: {
                        [Op.in]: types
                    }
                };
            } else {
                where = {
                    lang: lang,
                    type: {
                        [Op.in]: types
                    }
                };
            }
            let filter = await pagesService.makePageFilter(req.body, where);
            let result = await pagesService.adminGetAllPages(filter, page, perPage);
            result.statusCount = statusCount;
            log.info(`End getAllPages data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    getPageById: async(req, res) => {
        log.info(`Start getPageById data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        let id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {
            [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
        };

        try {
            let page = await pagesService.getPage(filter,null,lang);
            if (page && page.template === 'homepage') {
                if (page.sections && page.sections.length && page.sections[0].body && page.sections[0].body.length) {
                    for (let i = 0; i < page.sections[0].body.length; i++) {
                        let contentItem = page.sections[0].body[i];
                        switch (contentItem.type) {
                            case "5":
                                let categories = contentItem.content[0] ? contentItem.content[0].categories : [];
                                if (categories && categories.length) {
                                    categories = await categorieService.getCategoriesForMainPage(categories);
                                    contentItem.content[0].categories = categories;
                                }
                                break;
                            case "6":
                                let brands = contentItem.content[0] ? contentItem.content[0].brands : [];
                                if (brands && brands.length) {
                                    brands = await categorieService.getBrandsForMainPage(brands);
                                    contentItem.content[0].brands = brands;
                                }
                                break;
                            case "8":
                                let news = contentItem.content[0] ? contentItem.content[0].news : [];
                                if (news && news.length) {
                                    news = await categorieService.getNewsForMainPage(news);
                                    contentItem.content[0].news = news;
                                }
                                break;
                            case "16":
                                let promotions = contentItem.content[0] ? contentItem.content[0].promotions : [];
                                if (promotions && promotions.length) {
                                    promotions = await categorieService.getPromotionsForMainPage(promotions);
                                    contentItem.content[0].promotions = promotions;
                                }
                                break;
                        }
                    }
                }
            }

            if (!page) {
                return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            let link = await linksService.getLinkByFilter({ original_link: extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang),lang });
            if (link) page.slug = link.slug;
            page.meta_data = await postService.getMetaDataByslugOrUrl(extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, lang));
            page.history = await adminHistoryService.adminFindAllHistory({
                type: 'page',
                item_id: page.id,
                created_at: {
                    [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                }
            });
            log.info(`End getPageById data:${JSON.stringify(page)}`)
            return res.status(200).json(page);

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    deletePagesByIds: async(req, res) => {
        log.info(`Start deletePagesByIds data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;
        const languages = config.LANGUAGES;
        let transaction = await sequelize.transaction();
        try {
            let result = [];

            if (ids && ids.length) {

                for (let id of ids) {
                    let page = await pagesService.getOnlyPage({ id: id });
                    if (!page || !page.id) {
                        result.push({ id: id, deleted: false, error: `Page not found with id:${id}` })
                    }

                    if (page && page.status == config.GLOBAL_STATUSES.DELETED) {
                        const otherLangsForPage = await pagesService.getAllPages({ origin_id: id });
                        const otherLangsForPageIds = otherLangsForPage.map(i => i.id);
                        const otherLangsForPageOriginalLinks = otherLangsForPage.map((i, index) => extraUtil.generateLinkUrlForPage(i.type, i.id, i.template, languages[index + 1]));
                        const pageIdsFilter = {
                            [Op.in]: [page.id, ...otherLangsForPageIds]
                        };
                        const pageOriginalLinksFilter = {
                            [Op.in]: [extraUtil.generateLinkUrlForPage(page.type, page.id, page.template, languages[0]), ...otherLangsForPageOriginalLinks]
                        };

                        await pagesService.removePage(pageIdsFilter, transaction);
                        await metaDataService.deleteMetaData({ url: pageOriginalLinksFilter }, transaction);
                        await linksService.removeLink({ original_link: pageOriginalLinksFilter }, transaction);
                        result.push({ id: id, deleted: true, error: false });
                        await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'page' }, transaction);

                    } else {
                        await pagesService.updatePageOnly({ status: config.GLOBAL_STATUSES.DELETED }, {
                            [Op.or]: [{ id: page.id }, { origin_id: page.id }]
                        }, transaction);
                        page = await pagesService.getOnlyPage({ id: page.id }, false, transaction);
                        result.push(page);
                        await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'page' }, transaction);
                    }
                }
                await transaction.commit();
            }
            log.info(`End deletePagesByIds data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
}
