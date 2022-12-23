const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const config = require('../configs/config');
const extraUtil = require('../utils/extra-util');
const linksService = require('../services/links.service');
const log = require('../utils/logger');

async function getNews(filter, trans) {
    log.info(`Start getNews service data:${JSON.stringify(filter)}`)
    let transaction = trans ? trans : null;
    try {
        // let filter = params;
        // if (typeof params !== 'object') {
        //     filter = { id: params }
        // }

        // const include = withInclude ? {
        //     include:[
        //         {model: models.uploaded_files, as: "image"},
        //         {model: models.uploaded_files, as: "banner_image"},
        //         {model: models.uploaded_files, as: "banner_image_mobile"},
        //         { model: models.posts_body, as: "body",
        //             include: [
        //                 { model: models.uploaded_files, as: "gallery_content" , through:{attributes:[]} }
        //             ] },
        //     ]} : {};

        // let result = await models.posts.findOne( { where: filter, ...include, transaction});
        // if(withInclude) result = extraUtil.outputFormatGalleryContentForPosts(result);

        // if(result && result.image_id) {
        //     result.image = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang } ] } });
        // }
        // if(result && result.banner_image_id) {
        //     result.banner_image = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: result.banner_image_id, lang: result.lang }, { origin_id: result.banner_image_id, lang: result.lang } ] } });
        // }
        // if(result && result.banner_image_mobile_id) {
        //     result.banner_image_mobile = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: result.banner_image_mobile_id, lang: result.lang }, { origin_id: result.banner_image_mobile_id, lang: result.lang } ] } });
        // }
        // //result.meta_data = await this.getMetaDataByslugOrUrl(result.slug, transaction);

        // return result;
        let post = await models.posts.findOne({
            where: filter,
            include: [
                { model: models.uploaded_files, as: "image" },
                { model: models.uploaded_files, as: "banner_image" },
                { model: models.uploaded_files, as: "banner_image_mobile" },
            ],
            transaction
        });

        post = post ? post.toJSON() : post;

        if (post && post.id) {
            // if(page.banner_image_id) {
            //     page.banner_image = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: page.banner_image_id, lang: page.lang }, { origin_id: page.banner_image_id, lang: page.lang } ] } });
            // }
            // if(page.banner_image_mobile_id) {
            //     page.banner_image_mobile = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: page.banner_image_mobile_id, lang: page.lang }, { origin_id: page.banner_image_mobile_id, lang: page.lang } ] } });
            // }

            let posts_contents = await models.posts_content.findAll({
                where: { post_id: post.id },
                // order: [["sequence_number", "ASC"]],
                include: [

                    { model: models.uploaded_files, as: 'block_image' },

                ],
                transaction
            });
           
            if (posts_contents && posts_contents.length) posts_contents = posts_contents.map(i => i.toJSON());
            post.body = await extraUtil.convertPostBodyForFrontendFormat(posts_contents);
            //page.meta_data = await postService.getMetaDataByslugOrUrl(page.slug, transaction);

            // if(page.marker_ids && Array.isArray(page.marker_ids) && page.marker_ids.length) {
            //     page.marker = await models.pages_content.findAll({
            //         where: { id: {[Op.in]: page.marker_ids } },
            //         attributes: ["id", "title", "text", "lat", "lng", "email", "phone", "map_background_image_id", "map_image_id", "map_image_active_id"],
            //         transaction
            //     });
            // }
            // if(page.marker && page.marker.length) {
            //     page.marker = page.marker.map(i => i.toJSON());
            //     for (let [index, marker] of page.marker.entries()) {
            //         if(marker.map_background_image_id) {
            //             page.marker[index].map_background_image = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: marker.map_background_image_id, lang: page.lang }, { origin_id: marker.map_background_image_id, lang: page.lang } ] } });
            //         }
            //         if(marker.map_image_id) {
            //             page.marker[index].map_image = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: marker.map_image_id, lang: page.lang }, { origin_id: marker.map_image_id, lang: page.lang } ] } });
            //         }
            //         if(marker.map_image_active_id) {
            //             page.marker[index].map_image_active = await models.uploaded_files.findOne({where: {file_type: 'image', [Op.or]:[ { id: marker.map_image_active_id, lang: page.lang }, { origin_id: marker.map_image_active_id, lang: page.lang } ] } });
            //         }
            //     }

            // }
        }
        log.info(`End getNews service data:${JSON.stringify(post)}`)
        return post;

    } catch (err) {
        log.error(err)
        if (transaction) await transaction.rollback();
        err.code = 400;
        throw err;
    }

}



module.exports = {

    createPost: async(post, trans) => {
        log.info(`Start createPost service data:${JSON.stringify(post)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.posts.create(post, {
                include: [
                    // {
                    //     model: models.posts_body, as: "body", include:[
                    //         {model: models.posts_body_to_uploaded_images, as: "posts_body_images" }
                    //     ]
                    // }
                    { model: models.posts_content }
                ],
                transaction
            });
            // await models.post_to_category.create({post_id: result.id, category_id: 1}, {transaction});

            result = await getNews({ id: result.id }, transaction);

            if (!trans) await transaction.commit();
            log.info(`End createPost service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getMetaDataBySlugOrUrl: async(url, trans) => {
        log.info(`Start getMetaDataBySlugOrUrl service data:${JSON.stringify(url)}`)
        const transaction = trans ? trans : await sequelize.transaction();
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItSlug = await models.links.findOne({ where: { slug: slug }, transaction });

                if (isItSlug && isItSlug.original_link) {
                    metaData = await models.meta_data.findOne({ where: { url: isItSlug.original_link }, transaction });
                }
            }

            if (!trans) await transaction.commit();
            log.info(`End getMetaDataBySlugOrUrl service data:${JSON.stringify(metaData)}`)
            return metaData;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updatePost: async(postId, postData, bodyData, trans) => {
        log.info(`Start updatePost service data:${JSON.stringify(postId, postData, bodyData, trans)}`)
        postData.updated_at = Math.floor(new Date().getTime() / 1000);

        let transaction = null;
        let result = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            // let postBodyIds = await models.posts_body.findAll({where: {post_id: postId}, attributes:['id'], transaction });
            // postBodyIds = postBodyIds.map(i => {return i.id});
            //delete old posts_body and posts_body_to_uploaded_images
            // await models.posts_body.destroy({where: {id: {[Op.in]: postBodyIds} }, transaction});
            // await models.posts_body_to_uploaded_images.destroy({where: {posts_body_id: {[Op.in]: postBodyIds} }, transaction});
            //create new posts_body and posts_body_to_uploaded_images

            //if (bodyData && bodyData.length) {
                //delete old pages_content
                await models.posts_content.destroy({ where: { post_id: postId }, transaction });
                //create new pages_content
                await models.posts_content.bulkCreate(bodyData, { transaction });
            //}
            //update page
            await models.posts.update(postData, { where: { id: postId }, transaction });
            // await models.posts_body.bulkCreate(bodyData, { include:[ {model: models.posts_body_to_uploaded_images, as: "posts_body_images" } ], transaction });

            result = await getNews(postId, transaction);

            if (!trans) await transaction.commit();
            log.info(`End updatePost service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getMetaDataByslugOrUrl: async(url, trans) => {
        log.info(`Start getMetaDataByslugOrUrl data:${JSON.stringify(url, trans)}`)
        const transaction = trans ? trans : await sequelize.transaction();
        try {
            let metaData = await models.meta_data.findOne({ where: { url: url }, transaction });
            if (!metaData) {
                let slug = url.charAt(0) === '/' && url.length > 1 ? url.slice(1) : url;
                let isItslug = await models.links.findOne({ where: { slug: slug }, transaction });

                if (isItslug && isItslug.link) {
                    metaData = await models.meta_data.findOne({ where: { url: isItslug.link }, transaction });
                }
            }

            if (!trans) await transaction.commit();
            log.info(`End getMetaDataByslugOrUrl data:${JSON.stringify(metaData)}`)
            return metaData;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countPostByParam: async(whereObj) => {
        log.info(`Start countPostByParam data:${JSON.stringify(whereObj)}`)
        let result = await models.posts.count({
            where: whereObj
        });
        log.info(`End countPostByParam data:${JSON.stringify(result)}`)
        return result ? result : 0;
    },
    getOriginPostFormat: async(filter, trans) => {
        log.info(`Start getOriginPostFormat service data:${JSON.stringify(filter, trans)}`)
        let transaction = trans ? trans : null;
        try {

            let post = await models.posts.findOne({
                where: filter,
                transaction,
                include: [
                    { model: models.posts_content }
                ]
            });

            // page.meta_data = await postService.getMetaDataBySlagOrUrl(page.slag, transaction);
            log.info(`End getOriginPostFormat service data:${JSON.stringify(post)}`)
            return post;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getNews: getNews,

    getAllNews: async(whereObj) => {
        log.info(`Start getAllNews data:${JSON.stringify(whereObj)}`)
        let result = await models.posts.findAll({
            where: whereObj
        });
        log.info(`End getAllNews data:${JSON.stringify(result)}`)
        return result;
    },

    adminGetAllNews: async(filter, page, perPage, attributes) => {
        log.info(`Start adminGetAllNews data:${JSON.stringify(filter, page, perPage, attributes)}`)
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.posts.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include: [
                    { model: models.uploaded_files, as: "image" },
                    { model: models.uploaded_files, as: "banner_image" },
                    { model: models.uploaded_files, as: "banner_image_mobile" },
                ]
            });
            if (result && result.rows && result.rows.length){
                let allPosts = []
                result.rows = result.rows.map((item) => item.toJSON())

                for (let i of result.rows) {
                    let link = await linksService.getLinkByFilter({ original_link: `/getPost/${i.id}` });
                    i.slug = link && link.slug ? link.slug : '';
                    let lang_change = await models.posts.findAll({
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
                                type: "post"
                            }
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    i.change = change
                    allPosts.push(i)
                }
                result.rows = allPosts
            }
            log.info(`End adminGetAllNews data:${JSON.stringify(result)}`)
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


    makePostFilter: async(body, whereObj) => {
        log.info(`Start makePostFilter data:${JSON.stringify(body, whereObj)}`)
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
                        [Op.and]: like
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
                [Op.and]: [whereObj, ...arr]
            }
        };
        log.info(`End makePostFilter data:${JSON.stringify(filter)}`)
        return filter;
    },

    deletePostById: async(postId, trans) => {
        log.info(`Start deletePostById data:${JSON.stringify(postId, trans)}`)
        let transaction = null;
        let filter = postId;
            // if (typeof postId !== 'object') {
            //     filter = { id: postId }
            // }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            
            await models.posts_content.destroy({ where: { post_id: filter }, transaction });
            let result = await models.posts.destroy({ where: { id: filter }, transaction });
            if (!trans) await transaction.commit();
            log.info(`End deletePostById data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deletePostToCategory: async(postId, trans) => {
        let transaction = null;
        let filter = postId;
        if (typeof postId !== 'object') {
            filter = { post_id: postId }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.post_to_category.destroy({ where: filter, transaction });
            if (!trans) await transaction.commit();

            return result;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deletePostBodyAndPostsImages: async(postId, trans) => {
        let transaction = null;
        let filter = postId;
        if (typeof postId !== 'object') {
            filter = { post_id: postId }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let postBodyIds = await models.posts_body.findAll({ where: filter, attributes: ['id'], transaction });
            postBodyIds = postBodyIds.map(i => { return i.id });
            //delete posts_body and posts_body_to_uploaded_images
            await models.posts_body.destroy({
                where: {
                    id: {
                        [Op.in]: postBodyIds
                    }
                },
                transaction
            });
            await models.posts_body_to_uploaded_images.destroy({
                where: {
                    posts_body_id: {
                        [Op.in]: postBodyIds
                    }
                },
                transaction
            });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updatePostById: async(params, post, trans) => {
        log.info(`Start updatePostById service data:${JSON.stringify(params, post, trans)}`)
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.posts.update(post, { where: filter, transaction });
            let result = await models.posts.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End updatePostById service data:${JSON.stringify(result)}`)
            return result;

        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    // updateBlogPostById: async (id, post, category_id) =>  {
    //     try {
    //         let result = await models.posts.update(post, {
    //             where: {
    //                 id: id
    //             }
    //           });
    //         await category_id.forEach(function (i) {
    //             models.post_to_category.create({post_id: id, category_id: i});
    //         })
    //         result = await models.posts.findOne({
    //             where: {
    //                 id: id
    //             }
    //           })
    //         return result;
    //     } catch (err) {
    //         err.code = 400;
    //         throw err;
    //     }
    // },
    changePositionPost: async(posts, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of posts) {

                await models.posts.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }


            result = await models.posts.findAll({
                    where: {
                        id: {
                            [Op.in]: ids
                        }
                    },
                    order: [
                        ["position", "ASC"]
                    ],
                    transaction
                })
                // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },
    setPositionPosts: async() => {
        try {
            let result = await models.posts.findAll();

            for (let item of result) {
                await models.posts.update({ position: item.id }, { where: { id: item.id } })

            }
            return true

        } catch (err) {


        }
    },
    changePositionPosts: async(posts, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of posts) {

                await models.posts.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }


            result = await models.posts.findAll({
                    where: {
                        id: {
                            [Op.in]: ids
                        }
                    },
                    order: [
                        ["position", "ASC"]
                    ],
                    transaction
                })
                // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },

}