const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const extraUtil = require('../utils/extra-util');
const postService = require('../services/post.service');
const linksService = require('../services/links.service');
const log = require('../utils/logger');
const config = require('../configs/config');


async function getPage(filter, trans, lang) {
    log.info(`Start getPage service data:${JSON.stringify(filter)}`)
    let transaction = trans ? trans : null;
    try {

        let page = await models.pages.findOne({
            where: filter,
            include: [
                { model: models.uploaded_files, as: 'banner_image_mobile' },
                { model: models.uploaded_files, as: 'banner_image' },
                { model: models.uploaded_files, as: 'background_image' },
                { model: models.uploaded_files, as: 'background_image_mobile' },
            ],
            transaction
        });
        page = page ? page.toJSON() : page;
        if (page && page.id) {
            if(page.faq)page.faq = JSON.parse(page.faq)
            let pages_contents = await models.pages_content.findAll({
                where: { page_id: page.id },
                order: [
                    ["sequence_number", "ASC"]
                ],
                include: [
                    { model: models.uploaded_files, as: 'image' },
                    { model: models.uploaded_files, as: 'section_icon' },
                    { model: models.uploaded_files, as: 'image_mobile' },
                    { model: models.uploaded_files, as: 'block_image_mobile' },
                    { model: models.uploaded_files, as: 'block_image' },
                    { model: models.uploaded_files, as: 'block_image_hover' },
                    { model: models.uploaded_files, as: 'block_video' },
                    { model: models.uploaded_files, as: 'block_map_background_image' },
                    { model: models.uploaded_files, as: 'block_map_image' }
                ],
                transaction
            });
            if (pages_contents && pages_contents.length) pages_contents = pages_contents.map(i => i.toJSON());
            page.sections = await extraUtil.convertPageSectionsForFrontendFormat(pages_contents, lang);
            page.meta_data = await postService.getMetaDataByslugOrUrl(`/getPage/${page.id}`, transaction);
            // ??? maybe need delete code below ???
            if (page.marker_ids && Array.isArray(page.marker_ids) && page.marker_ids.length) {
                page.marker = await models.pages_content.findAll({
                    where: {
                        id: {
                            [Op.in]: page.marker_ids
                        }
                    },
                    attributes: ["id", "title", "text", "lat", "lng", "email", "phone", "map_background_image_id", "map_image_id", "map_image_active_id"],
                    transaction
                });
            }
            if (page.marker && page.marker.length) {
                page.marker = page.marker.map(i => i.toJSON());
                for (let [index, marker] of page.marker.entries()) {
                    if (marker.map_background_image_id) {
                        page.marker[index].map_background_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: marker.map_background_image_id, lang: page.lang }, { origin_id: marker.map_background_image_id, lang: page.lang }] } });
                    }
                    if (marker.map_image_id) {
                        page.marker[index].map_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: marker.map_image_id, lang: page.lang }, { origin_id: marker.map_image_id, lang: page.lang }] } });
                    }
                    if (marker.map_image_active_id) {
                        page.marker[index].map_image_active = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: marker.map_image_active_id, lang: page.lang }, { origin_id: marker.map_image_active_id, lang: page.lang }] } });
                    }
                }

            }
            // ??? maybe need delete code above ???
        }
        log.info(`End getPage service data:${JSON.stringify(page)}`)
        return page;
    } catch (err) {
        log.error(err)
        if (transaction && !trans) await transaction.rollback();
        err.code = 400;
        throw err;
    }
}

module.exports = {


    /*createPage: async (page) => {
     let result=await models.pages.create(page)
    return result.map(function(item) {
        return item.toJSON();
    })
    },*/
    get404Page:async (lang)=>{
        log.info(`Start get404Page  data:${JSON.stringify(lang)}`)
        try {
            let result = await models.configs.findOne({where:{type:'page_404',lang:lang},raw:true})
            if(result){
                result = result.value ? JSON.parse(result.value):null
            }
            log.info(`End get404Page service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    createPage: async(page, trans,lang) => {
        log.info(`Start createPage service data:${JSON.stringify(page)}`)
        let transaction = trans ? trans : null;
        try {
            let result = await models.pages.create(page, {
                include: [
                    { model: models.pages_content }
                ],
                transaction
            });
            if(result)result = result.toJSON()
            if (result && result.id) result = await getPage({id:result.id}, transaction,lang);
            log.info(`End createPage service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction && !trans) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updatePage: async(pageId, pageData, sectionsData, trans, lang) => {
        log.info(`Start updatePage service data:${JSON.stringify(pageId, pageData, sectionsData)}`)
        pageData.updated_at = Math.floor(new Date().getTime() / 1000);

        let transaction = null;
        let result = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            //delete old pages_content
            await models.pages_content.destroy({ where: { page_id: pageId }, transaction });
            //create new pages_content
            await models.pages_content.bulkCreate(sectionsData, { transaction });
            //update page
            await models.pages.update(pageData, { where: { id: pageId }, transaction });
            result = await getPage(pageId, transaction, lang);

            if (!trans) await transaction.commit();
            log.info(`End updatePage service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    async updatePageOnly(data, id, trans) {
        log.info(`Start updatePageOnly service data:${JSON.stringify(data, id)}`)
        let transaction = null;
        let filter = id;
        if (typeof id !== 'object') {
            filter = { id: id }
        }
        try {

            transaction = trans ? trans : await sequelize.transaction();
            await models.pages.update(data, { where: filter, transaction });
            log.info(`End updatePageOnly service data:${JSON.stringify(true)}`)
            return true

        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    removePage: async(id, trans) => {
        log.info(`Start removePage service data:${JSON.stringify(id)}`)
        let transaction = null;

        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.pages_content.destroy({ where: { page_id: id }, transaction });
            await models.pages.destroy({ where: { id: id }, transaction });

            if (!trans) await transaction.commit();
            log.info(`End removePage service data:${JSON.stringify(true)}`)
            return true;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getPage: getPage,

    createPagesContentRows: async(data, trans) => {
        log.info(`Start createPagesContentRows service data:${JSON.stringify(data)}`)
        let transaction = trans ? trans : await sequelize.transaction();
        try {
            let result = await models.pages_content.bulkCreate(data, { transaction });

            if (!trans) await transaction.commit();
            log.info(`End createPagesContentRows service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getPageByFilter: async(filter) => {
        let page = await models.pages.findOne({
            where: filter,
            raw: true,
        });
        return page
    },

    updatePagesContentRows: async(data, filter, trans) => {
        log.info(`Start updatePagesContentRows service data:${JSON.stringify(data, filter)}`)
        let transaction = trans ? trans : await sequelize.transaction();
        try {
            let result = await models.pages_content.update(data, { where: filter, transaction });

            if (!trans) await transaction.commit();
            log.info(`End updatePagesContentRows service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    async getOriginPageFormat(filter, trans) {
        log.info(`Start getOriginPageFormat service data:${JSON.stringify(filter)}`)
        let transaction = trans ? trans : null;
        try {

            let page = await models.pages.findOne({
                where: filter,
                transaction,
                include: [
                    { model: models.pages_content }
                ]
            });

            //       page.meta_data = await postService.getMetaDataByslugOrUrl(page, transaction);
            log.info(`End getOriginPageFormat service data:${JSON.stringify(page)}`)
            return page;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countPagesByParam: async(filter) => {
        log.info(`Start countPagesByParam service data:${JSON.stringify(filter)}`)
        const result = await models.pages.count({
            where: filter
        });
        log.info(`End countPagesByParam service data:${JSON.stringify(result)}`)
        return result ? result : 0;
    },

    adminGetAllPages: async(filter, page, perPage) => {
        log.info(`Start adminGetAllPages service data:${JSON.stringify(filter, page, perPage)}`)
        try {
            const offset = perPage * (page - 1);
            let result = await models.pages.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: perPage,
                order: filter.sort,
                distinct: true
            });

            result.rows = result.rows.map((item) => item.toJSON())
            if (result && result.rows && result.rows.length) {
                let allPages = []
                for (let i of result.rows) {
                    let link = await extraUtil.generateLinkUrlForPage(i.type, i.id, i.template, config.LANGUAGES[0])
                    let link_slug = await linksService.getLinkByFilter({ original_link: link })
                        //let link = await linksService.getLinkByFilter({ original_link: `/getPage/${i.id}` });
                        //i.slug = link && link.slug ? link.slug : '';
                    i.slug = link_slug && link_slug.slug ? link_slug.slug : '';

                    //i = i.toJSON();
                    let lang_change = await models.pages.findAll({
                        where: {

                            [Op.or]: [
                                { id: i.id },
                                { origin_id: i.id }
                            ]
                        },
                        attributes: ['id', 'origin_id', 'lang']
                    })
                    lang_change = lang_change.map(i => i.toJSON())
                    let change = {}
                    for (let id of lang_change) {
                        id.history = await models.admin_changes_history.findAll({
                            where: {

                                item_id: id.id,
                                type: "page"
                            }
                        })
                        for (const lang of config.LANGUAGES) {
                            if (id.lang === lang) {
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    i.change = change
                    allPages.push(i)
                }
                result.rows = allPages
            }

            log.info(`End adminGetAllPages service data:${JSON.stringify(result)}`)
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },


    makePageFilter: async(body, whereObj) => {
        log.info(`Start makePageFilter service data:${JSON.stringify(body)}`)
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({
                        [Op.like]: `%${item}%`
                    });
                });
                arr.push({
                    title: {
                        [Op.or]: like
                    }
                });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;

            arr.push({ created_at: date });
        }
        if (body.sort && body.sort.key && body.sort.direction) {
                sort = [
                    [body.sort.key, body.sort.direction]
                ];
        } else {
            sort = [
                ['created_at', 'DESC']
            ];
        }


        let filter = {
            sort,
            where: {
                preview: {
                    [Op.eq]: null
                },
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makePageFilter service data:${JSON.stringify(filter)}`)
        return filter;
    },

    async getOnlyPage(filter, json, trans) {
        log.info(`Start getOnlyPage service data:${JSON.stringify(filter, json)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let page = await models.pages.findOne({ where: filter, transaction });
            if (!trans) await transaction.commit();
            log.info(`End getOnlyPage service data:${JSON.stringify(page)}`)
            return (page && json) ? page.toJSON() : page;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    async getAllPages(filter) {
        log.info(`Start getAllPages service data:${JSON.stringify(filter)}`)
        try {
            let pages = await models.pages.findAll({ where: filter });
            log.info(`End getAllPages service data:${JSON.stringify(pages)}`)
            return pages;

        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    getBlogPageByslug: async(slug) => {
        log.info(`Start getBlogPageByslug service data:${JSON.stringify(slug)}`)
        try {
            let result = await models.pages.findOne({
                where: { slug: slug, status: config.GLOBAL_STATUSES.ACTIVE }
            })
            if (result) result = result.toJSON()
            log.info(`End getBlogPageByslug service data:${JSON.stringify(result)}`)
            return result
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

    async createBlogPage(data) {
        let result = await models.pages.create(data);

        return result.map(function(item) {
            return item.toJSON();
        })
    },

    async getBlogPageAll(filter) {
        try {
            let result = await models.pages.findAll({
                where: filter
            });

            return result.map(i => {
                return i.toJSON();
            })
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    async getMarkersForDealer(ids) {
        try {
            let result = await models.pages_content.findAll({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                },
                attributes: ["id", "title", "text", "lat", "lng", "email", "phone"],
                include: [
                    { model: models.uploaded_files, as: 'block_map_background_image' },
                    { model: models.uploaded_files, as: 'block_map_image' },
                    { model: models.uploaded_files, as: 'block_map_image_active' }
                ]
            });

            return result.map(i => {
                return i.toJSON();
            })
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    async getBlogPages(filter, perPage, page) {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;

            let result = await models.pages.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort

            });
            result = result.map(function(item) {
                return item.toJSON();
            })

            return result.count > 0 && result.rows.length ? {
                pages: result.rows,
                count: result.count
            } : { pages: [], count: 0 };
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    async deleteBlogPage(id, transaction) {
        try {
            let result = await models.pages.destroy({
                where: { id: id },
                transaction
            })

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }

    },
    // makePageFilter: async function (body, whereObj) {
    //     let arr = [];
    //     let sort;
    //     if (body.search) {
    //         if (body.search.name) {
    //             let searchField = body.search.name.trim().split(" ");
    //             if (searchField && searchField.length) {
    //                 let like = [];
    //                 searchField.forEach((item) => {
    //                     like.push({[Op.like]: `%${item}%`});
    //                 });
    //                 arr.push({title: {[Op.or]: like}});
    //             }
    //         }
    //     }
    //
    //     if (body.filter) {
    //         if (body.filter.types && body.filter.types.length) {
    //             let types = [];
    //             body.filter.types.forEach((item) => {
    //                 types.push({type: item});
    //             });
    //             arr.push({[Op.or]: types});
    //         }
    //         if (body.filter.status && body.filter.status.length) {
    //             let statuses = [];
    //             body.filter.status.forEach((item) => {
    //                 statuses.push({status: item});
    //             });
    //             arr.push({[Op.or]: statuses});
    //         }
    //     }
    //     if (body.sort) {
    //         if (body.sort.created_at) {
    //             sort = [['created_at', body.sort.created_at]];
    //         }
    //     } else {
    //         sort = [['created_at', 'DESC']];
    //     }
    //
    //     let filter = {sort, where: {[Op.and]: [whereObj, ...arr]}};
    //
    //     return filter;
    // }
    getServiceByPage:async (filter)=>{
        try {
            let result = await models.service.findOne({
                where: filter,
                include:[
                    {
                        model:models.uploaded_files,
                        as:"image_prev"
                    }
                ]
            })
            if(result){
                result = result.toJSON()
                result.image = result.image_prev
            }
            return result
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getFormByPage:async (type,lang)=>{
        try {
            let result = await models.forms.findOne({
                where: {type:type,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},
                include: [{
                    model: models.uploaded_files,
                    as: 'popup_icon'
                }]
            })
            return result ? result.toJSON() : null;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getReviewByPage:async (filter)=>{
        try {
            let result = await models.reviews.findOne({
                where: filter,
                include:[
                    {
                        model:models.uploaded_files,
                        as:"icon"
                    },
                    {
                        model:models.uploaded_files,
                        as:"user_image"
                    }
                ]
            })

            return result ? result.toJSON() : null;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getFaqByPage:async (filter)=>{
        try {
            let result = await models.faq.findOne({
                where: filter,
                include:[
                    {
                        model:models.faqs_content,
                        as:"first_comment"
                    }
                ]
            })
            return result ? result.toJSON() : null;
        }catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getIconByPage:async (filter)=>{
        try {
            let result = await models.uploaded_files.findOne({
                where: filter,
            })

            return result ? result.toJSON() : null;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getCategoryByPage:async (filter)=>{
        try {
            let result = await models.service_category.findOne({
                where: filter,
                include:[
                    {
                        model:models.uploaded_files,
                        as:"image"
                    }
                ]
            })
            return result ? result.toJSON() : null;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    }
}
