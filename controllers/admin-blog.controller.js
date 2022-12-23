const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");


const postService = require('../services/post.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { slugify } = require('transliteration');
slugify.config({ lowercase: true, separator: '-' });
const extraUtil = require('../utils/extra-util');
const linksService = require('../services/links.service');
const metaDataService = require('../services/meta-data.service');
const adminHistoryService = require('../services/admin-changes-history.service');
const adminPreviewService = require('../services/admin.preview.service');
const log = require('../utils/logger');
module.exports = {

    saveNews: async(req, res) => {
        log.info(`Start saveNews data:${JSON.stringify(req.body)}`)
        let { id, title, image, body, slug, status, description, published_at, banner_image, banner_image_mobile, meta_data } = req.body;
        const languages = config.LANGUAGES;
        let transaction
        try {
            transaction = await sequelize.transaction();
            let result
            if (!id) {
                status = status ? status : config.GLOBAL_STATUSES.WAITING;
                let originPost;
                for (let lang of languages) {
                    let currentSlug;
                    if (!slug) {
                            // transliterate
                            currentSlug = slugify(title);
                            let checkSlag = await linksService.getLinkByFilter({slug: currentSlug,lang}, transaction);
                            let localSlug = currentSlug
                            let i = 1
                            while(checkSlag){
                                localSlug = currentSlug
                                localSlug = localSlug + "-" + i
                                checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang}, transaction);
                                i++
                            }
                            currentSlug = localSlug
                    } else {
                        let checkSlag = await linksService.getLinkByFilter({slug,lang}, transaction);
                        let localSlug = slug
                            let i = 1
                            while(checkSlag){
                                localSlug = slug
                                localSlug = localSlug + "-" + i
                                checkSlag = await linksService.getLinkByFilter({slug: localSlug,lang}, transaction);
                                i++
                            }
                            slug = localSlug
                            currentSlug = slug
                    }
                    let postData = {
                        lang: lang,
                        origin_id: originPost && originPost.id ? originPost.id : 0,
                        title,
                        published_at: published_at ? published_at : new Date().toISOString(),
                        description: description ? description : null,
                        image_id: image && image.id ? image.id : null,
                        banner_id: banner_image && banner_image.id ? banner_image.id : null,
                        image_mobile_id: banner_image_mobile && banner_image_mobile.id ? banner_image_mobile.id : null,
                        status,
                        created_user_id: req.userid
                    };

                    let post_body = extraUtil.convertPostBodyForDBFormat(body);
                    if (post_body && post_body.length) postData.posts_contents = post_body;


                    let post = await postService.createPost(postData, transaction);

                    let link = await linksService.createLink({ slug: currentSlug, original_link: `/getPost/${post.id}`, type: 'post',lang }, transaction);
                    if (link) post.slug = link.slug;
                    let metaData;
                    if (meta_data) {
                        metaData = { url: `/getPost/${post.id}` };
                        if(meta_data.meta_title){
                            metaData.meta_title = meta_data.meta_title;
                        } else  metaData.meta_title = title
                        if(meta_data.meta_desc) {
                            metaData.meta_desc = meta_data.meta_desc;
                        } else metaData.meta_desc = null
                        if(meta_data.meta_keys) metaData.meta_keys = meta_data.meta_keys;
                        if(meta_data.meta_canonical) metaData.meta_canonical = meta_data.meta_canonical;
                    }
                    if (metaData) post.meta_data = await metaDataService.createMetaData(metaData, transaction);
                    await adminHistoryService.adminCreateHistory({ item_id: post.id, user_id: req.userid, type: 'post' }, transaction);

                    if (!originPost) originPost = post;

                }
                result = originPost;
            } else if (status == config.GLOBAL_STATUSES.DUPLICATE_POST) {
                const lang = req.body.lang ? req.body.lang : languages[0];
                let originPost;
                let duplicatePost;
                let link;
                for (let lang of languages) {
                    const filter = {
                        [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                    };
                    let post = await postService.getOriginPostFormat(filter, transaction);
                    if (post && post.id) {
                        link = await linksService.getLinkByFilter({ original_link: `/getPost/${post.id}`,lang }, transaction)
                        link = link && link.slug ? link : link.slug = 'post';


                        let newSlag = link.slug + '-' + Date.now();
                        duplicatePost = extraUtil.removeFields(post.toJSON(), ['id', 'post_id', 'created_at', 'updated_at']);
                        duplicatePost.status = config.GLOBAL_STATUSES.WAITING;
                        duplicatePost.lang = lang;
                        duplicatePost.origin_id = originPost && originPost.id ? originPost.id : 0;

                        duplicatePost = await postService.createPost(duplicatePost, transaction);
                        await linksService.createLink({ slug: newSlag, original_link: `/getPost/${duplicatePost.id}`, type: 'post',lang }, transaction);
                        let metaData = await postService.getMetaDataBySlugOrUrl(link.original_link, transaction);
                        if (metaData) {
                            metaData = extraUtil.removeFields(metaData.toJSON(), ["id", "url"]);
                            metaData.url = `/getPost/${duplicatePost.id}`;
                            duplicatePost.meta_data = await metaDataService.createMetaData(metaData, transaction);
                        }
                        if (!originPost) originPost = duplicatePost;
                    }
                }

                link = await linksService.getLinkByFilter({ original_link: `/getPost/${originPost.id}`,lang }, transaction);
                if (link) originPost.slug = link.slug;
                originPost.meta_data = await postService.getMetaDataBySlugOrUrl(`/getPost/${originPost.id}`, transaction);
                await adminHistoryService.adminCreateHistory({ item_id: originPost.id, user_id: req.userid, type: 'post' }, transaction);
                originPost.history = await adminHistoryService.adminFindAllHistory({
                    type: 'post',
                    item_id: originPost.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                }, transaction);

                result = originPost;

            } else {
                const lang = req.body.lang ? req.body.lang : languages[0];
                const filter = {
                    [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
                };

                let post = await postService.getNews(filter, transaction);
                if (!post) {
                    return res.status(400).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                    });

                }
                let link = await linksService.getLinkByFilter({ original_link: `/getPost/${post.id}`,lang }, transaction);

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
                let checkSlag = await linksService.getAllLinks({slug,lang}, transaction);
                if(checkSlag) checkSlag = checkSlag.map(item => item.toJSON())
                if ((checkSlag && checkSlag.length > 1) || (checkSlag && checkSlag.length && checkSlag[0].slug !== link.slug)) {
                    await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_LINK_ALREADY_EXIST.code).json({
                        message: errors.BAD_REQUEST_LINK_ALREADY_EXIST.message,
                        errCode: errors.BAD_REQUEST_LINK_ALREADY_EXIST.code
                    });
                }

            }

                let metaData = {};
                if (meta_data) {
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
                }
                if (link.slug !== slug) {
                    await linksService.updateLink({ slug: slug }, link.slug, transaction);
                }

                let [findedMetaData, isCreated] = await metaDataService.findOrCreateMetaData({ where: { url: `/getPost/${post.id}` }, defaults: (metaData.url ? metaData : {...metaData, url: `/getPost/${post.id}` }) }, transaction);
                if (findedMetaData && !isCreated) {
                    await findedMetaData.update(metaData, { transaction });
                }


                const bodyData = extraUtil.convertPostBodyForDBFormat(body, post.id);

                let postData = {};
                let postDataOtherLang = {};
                if(title) postData.title = title;
                if(status) {
                    postData.status = status;
                    postDataOtherLang.status = status;
                }
                if(description) postData.description = description;
                if(published_at) {
                    postData.published_at = published_at;
                    postDataOtherLang.published_at = published_at;
                }
                if(image && image.id){
                    postData.image_id = image.id;
                    postDataOtherLang.image_id = image.id;
                }else if(image == null){
                    postData.image_id = image;
                    postDataOtherLang.image_id = image;
                }
                if(banner_image && banner_image.id){
                    postData.banner_id = banner_image.id;
                    postDataOtherLang.banner_id = banner_image.id;
                }else if(banner_image == null){
                    postData.banner_id = banner_image;
                    postDataOtherLang.banner_id = banner_image;
                }
                if(banner_image_mobile && banner_image_mobile.id){
                    postData.image_mobile_id = banner_image_mobile.id;
                    postDataOtherLang.image_mobile_id = banner_image_mobile.id;
                }else if(banner_image_mobile == null){
                    postData.image_mobile_id = banner_image_mobile;
                    postDataOtherLang.image_mobile_id = banner_image_mobile;
                }
                

                post = await postService.updatePost(post.id, postData, bodyData, transaction);
                link = await linksService.getLinkByFilter({ original_link: `/getPost/${post.id}`,lang }, transaction);
                if (link) post.slug = link.slug;
                post.meta_data = await postService.getMetaDataBySlugOrUrl(`/getPost/${post.id}`, transaction);
                await adminHistoryService.adminCreateHistory({ item_id: post.id, user_id: req.userid, type: 'post' }, transaction);
                post.history = await adminHistoryService.adminFindAllHistory({
                    type: 'post',
                    item_id: post.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                }, transaction);

                const otherLangFilter = {
                    [Op.or]: [{ id: id }, { origin_id: id }]
                };
                await postService.updatePostById(otherLangFilter, postDataOtherLang, transaction);

                result = post;
            }
            log.info(`End saveNews data:${JSON.stringify(result)}`)
            await transaction.commit();
            return res.status(200).json(result)
        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    createNewsPreview: async(req, res) => {
        log.info(`Start createNewsPreview data:${JSON.stringify(req.body)}`)
        let { id, title, image, body, slug, status, description, published_at, banner_image, banner_image_mobile, meta_data } = req.body;
        const languages = config.LANGUAGES;
        const transaction = await sequelize.transaction();
        try {
            if (req.body && Object.keys(req.body).length === 1 && id) {
                const getOriginPost = await postService.getNews({ id: id });
                title = getOriginPost.title;
                image = getOriginPost.image;
                body = getOriginPost.body;
                description = getOriginPost.description;
                published_at = getOriginPost.published_at;
                banner_image = getOriginPost.banner_image;
                banner_image_mobile = getOriginPost.banner_image_mobile;
                meta_data = getOriginPost.meta_data;
            }

            status = config.GLOBAL_STATUSES.ACTIVE;
            let originPost;
            await adminPreviewService.deletePreviewNews();
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


                let postData = {
                    preview: true,
                    lang: lang,
                    origin_id: originPost && originPost.id ? originPost.id : 0,
                    title,
                    published_at: published_at ? published_at : new Date().toISOString(),
                    description,
                    image_id: image && image.id ? image.id : null,
                    banner_id: banner_image && banner_image.id ? banner_image.id : null,
                    image_mobile_id: banner_image_mobile && banner_image_mobile.id ? banner_image_mobile.id : null,
                    status,
                    created_user_id: req.userid
                };
                let post_body = extraUtil.convertPostBodyForDBFormat(body);
                if (post_body && post_body.length) postData.posts_contents = post_body;


                let post = await postService.createPost(postData, transaction);

                let link = await linksService.createLink({
                    slug: currentSlug,
                    original_link: `/getPost/${post.id}`,
                    type: 'post',
                    lang
                }, transaction);
                if (link) post.slug = link.slug;
                let metaData;
                if (meta_data && (meta_data.meta_title || meta_data.meta_desc || meta_data.meta_keys || meta_data.meta_canonical)) {
                    metaData = {
                        url: `/getPost/${post.id}`,
                        meta_title: meta_data.meta_title,
                        meta_desc: meta_data.meta_desc,
                        meta_keys: meta_data.meta_keys,
                        meta_canonical: meta_data.meta_canonical
                    }
                }
                if (metaData) post.meta_data = await metaDataService.createMetaData(metaData, transaction);
                await adminHistoryService.adminCreateHistory({
                    item_id: post.id,
                    user_id: req.userid,
                    type: 'post'
                }, transaction);

                if (!originPost) originPost = post;


            }
            await transaction.commit();
            let result = {
                url: '/' + originPost.slug
            }
            log.info(`End createNewsPreview data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    getAllNews: async(req, res) => {
        log.info(`Start getAllNews data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;

        try {

            let numberOfWaitionNews = await postService.countPostByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.WAITING, preview: { [Op.eq]: null }});
            let numberOfActiveNews = await postService.countPostByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.ACTIVE, preview: { [Op.eq]: null }});
            let numberOfDeletedNews = await postService.countPostByParam({ origin_id: 0, status: config.GLOBAL_STATUSES.DELETED, preview: { [Op.eq]: null }});
            let numberOfAllNews = await postService.countPostByParam({
                origin_id: 0,
                status: {
                    [Op.ne]: config.GLOBAL_STATUSES.DELETED
                },
                preview: { [Op.eq]: null }
            });
            let statusCount = {
                all: numberOfAllNews,
                1: numberOfDeletedNews,
                2: numberOfActiveNews,
                4: numberOfWaitionNews,
            };

            let filter;
            let lang
            if(req.body.lang){
                lang = req.body.lang
            } else lang = 'uk'
            let filterwhere = { lang: lang };
            let result;
            if (req.body && req.body.status && req.body.status === 'all') {
                filterwhere = {
                    lang: lang ,
                    status: {
                        [Op.ne]: config.GLOBAL_STATUSES.DELETED
                    },preview: { [Op.eq]: null }
                };
            }
            filter = await postService.makePostFilter(req.body, filterwhere);
            result = await postService.adminGetAllNews(filter, page, perPage, ['id', 'lang', 'title', 'published_at', 'description', 'status', 'created_at', 'updated_at', 'image_id']);

            result.statusCount = statusCount;
            log.info(`End getAllNews data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    getNewsById: async(req, res) => {
        log.info(`Start getNewsById data:${JSON.stringify(req.body)}`)

        const languages = config.LANGUAGES;
        const id = req.params.id;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const filter = {
            [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
        };

        try {
            let post = await postService.getNews(filter, null);
            if (post) {
                let link = await linksService.getLinkByFilter({ original_link: `/getPost/${post.id}`,lang });
                post.slug = link.slug;
                post.meta_data = await postService.getMetaDataByslugOrUrl(`/getPost/${post.id}`, null);
                post.history = await adminHistoryService.adminFindAllHistory({
                    type: 'post',
                    item_id: post.id,
                    created_at: {
                        [Op.gte]: new Date(Date.now() - config.TIME_CONST).toISOString()
                    }
                });
            }
            log.info(`End getNewsById data:${JSON.stringify(post)}`)
            return res.status(200).json(post);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    deleteNewsByIds: async(req, res) => {
        log.info(`Start deleteNewsByIds data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;
        const languages = config.LANGUAGES;
        const transaction = await sequelize.transaction();
        try {
            let result = [];
            if (ids && ids.length) {

                for (let id of ids) {
                    let post = await postService.getNews({ id }, null);
                    if (!post) {
                        result.push({ id: id, deleted: false, error: `No found news with id:${id}` })
                    } else {
                        if (post && post.status == config.GLOBAL_STATUSES.DELETED) {
                            const otherLangsForPost = await postService.getAllNews({ origin_id: id }, null);
                            const otherLangsForPostIds = otherLangsForPost.map(i => i.id);
                            const otherLangsForPostOriginalLinks = otherLangsForPost.map((i, index) => {
                             return   `/getPost/${i.id}`
                            });
                            const postIdsFilter = {
                                [Op.in]: [post.id, ...otherLangsForPostIds]
                            };
                            const postOriginalLinksFilter = {
                                [Op.in]: [`/getPost/${post.id}`, ...otherLangsForPostOriginalLinks]
                            };
                            await postService.deletePostById(postIdsFilter, transaction);
                            await linksService.removeLink({ original_link: postOriginalLinksFilter }, transaction);
                            await metaDataService.deleteMetaData({ url: postOriginalLinksFilter }, transaction);
                            result.push({ id: id, deleted: true, error: false });
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'post' }, transaction);

                        } else {
                            post = await postService.updatePostById(id, {
                                    status: config.GLOBAL_STATUSES.DELETED
                                },
                                transaction);
                            await postService.updatePostById({ origin_id: id }, {
                                    status: config.GLOBAL_STATUSES.DELETED,
                                },
                                transaction);
                            result.push(post);
                            await adminHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'post' }, transaction);
                        }
                    }
                }
                await transaction.commit();
            }
            log.info(`End deleteNewsByIds data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },




}
