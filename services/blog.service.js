const { models } = require('../sequelize-orm');
const Sequelize = require('sequelize');
const { Op } = Sequelize;
const config = require('../configs/config');
module.exports = {

    getAllPosts: async (data, perPage, page) => {
        let offset = perPage * (page - 1);
        const languages = config.LANGUAGES;
        try {

            let result = await models.posts.findAndCountAll({
                where: {status: config.GLOBAL_STATUSES.ACTIVE, lang: data.lang, preview: {[Op.eq]: null}},
                limit: perPage,
                offset: offset,
                order: [["published_at", "DESC"]],
                distinct: true,
                include:[
                    {model: models.posts_content},
                    {model: models.uploaded_files, as: "image"}
                ]
            });

            if (result && result.rows && result.rows.length) {
                let originalLinks = [];
                result.rows = result.rows.map(item => {
                    item = item.toJSON();
                    if(item.id) originalLinks.push(`/getPost/${item.id}`);
                    return item;
                });
                if(originalLinks && originalLinks.length){
                    let links = await models.links.findAll({
                        where: { 
                            original_link: originalLinks, 
                            lang: data.lang
                        },
                        raw: true 
                    });
                    if(links && links.length){
                        for (let news of result.rows) {
                            let link = links.find(item => item.original_link == `/getPost/${news.id}`);
                            if(link && link.slug) news.slug = data.lang === config.LANGUAGES[0] ? `${link.slug}` : `${data.lang}/${link.slug}`;
                        }
                    }

                }
            }


            return result.count > 0 && result.rows.length ? {
                posts: result.rows,
                count: result.count
            } : {posts: [], count: 0};
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getAllFaqs:async (lang)=>{

    },
    getBlogCategory: async (id) => {
        try {
            let result = await models.post_category.findOne({
                where: {id: id}
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getAllBlogCategory: async () => {
        try {
            let result = await models.post_category.findAll({
                where: {status: config.GLOBAL_STATUSES.ACTIVE},
                order: [['position', 'ASC']],
                include: [
                    {
                        model: models.posts,
                        as: "posts",
                        attributes: [],
                        required: true,
                        through: {attributes: []},
                        where: {status: config.GLOBAL_STATUSES.ACTIVE}
                    }
                ]

            });


            return result;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    createBlogCategory: async (data) => {
        try {
            let result = await models.post_category.create(data);
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    updateBlogCategory: async (data, id) => {
        try {
            let result = await models.post_category.update(data, {where: {id: id}});
            result = await models.post_category.findOne({
                where: {id: id}
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    deleteBlogCategory: async (id) => {
        try {
            await models.post_category.destroy({
                where: {category_id: id}
            })
            let result = await models.post_category.destroy({
                where: {id: id}
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }

    },
    updateStatusBlogCategoryId: async (data, id) => {
        try {
            await models.post_category.update(data, {where: {id: id}});
            let result = models.post_category.findOne({
                where: {id: id}
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    adminGetAllBlogCategory: async (data, perPage, page) => {
        try {
            let where = []
            let order = []
            let sort = data.sort;
            const offset = perPage * (page - 1);
            const limit = perPage;

            if (data.search) {
                let searchField = data.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({[Op.like]: `%${item}%`});
                    });
                    where.push({[Op.or]: [{title: {[Op.or]: like}}]});
                }
            }
            if (data.filter) {
                if (data.filter.date.createdFrom || data.filter.date.createdTo) {
                    let date = {};
                    if (data.filter.date.createdFrom) date[Op.gte] = data.filter.date.createdFrom;
                    if (data.filter.date.createdTo) date[Op.lte] = data.filter.date.createdTo;

                    where.push({created_at: date});
                }

                if (data.filter.status || data.filter.status == config.GLOBAL_STATUSES.DELETED) {
                    where.push({status: data.filter.status});
                }
            }
            if (sort && sort.status) {
                order.push(['status', sort.status])
            }
            if (sort && sort.title) {
                order.push(['title', sort.title])
            }
            let result = await models.post_category.update.findAndCountAll({
                where: where,
                offset: offset,
                limit: limit,
                order: order

            });

            return (result.count > 0 && result.rows.length) ? {
                category: result.rows,
                count: result.count
            } : {category: [], count: 0};

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    createBlogPost: async (data, category_id) =>  {
        try {
            let result = await models.posts.create(data);
            await category_id.forEach(function (i) {
                models.post_to_category.create({post_id: result.id, category_id: i});
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    updateStatusBlogPostId: async (data, id) => {
        try {
            await models.posts.update(data, {where: {id: id}});
            let result = models.posts.findOne({
                where: {id: id}
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    deleteBlogPostId: async (id, transaction) => {
        try {
            await models.posts.destroy({
                where: {id: id},
                transaction
            })
            let result = await models.post_to_category.destroy({
                where: {post_id: id},
                transaction
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }

    },
    getBlogPostById: async (id, status) => {
        try {
            let result = await models.posts.findOne({
                where: {id: id, status: status},
                include: {
                    model: models.post_category,
                    as: "post_category",
                    attributes: ['title', 'id'],
                    through: {attributes: []}
                }
            })
            if(result) result = result.toJSON();
            return result
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getBlogPostBySlug: async (slug, status) => {
        try {
            let result = await models.posts.findOne({
                where: {slug: slug, status: status},
                include: {
                    model: models.post_category,
                    as: "post_category",
                    attributes: ['title', 'id'],
                    through: {attributes: []}
                }
            })
            if(result) result = result.toJSON()
            return result
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getBlogPost: async (filter) => {
        try {
            let result = await models.posts.findAll({
                where: {
                    [Op.and]: [
                        { status: config.GLOBAL_STATUSES.ACTIVE },
                        filter
                    ]
                },
                include: {
                    model: models.post_category,
                    as: "post_category",
                    attributes: ['title', 'id'],
                    through: {attributes: []}
                }
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getPostByCategory: async (data, perPage, page) => {
        let offset = perPage * (page - 1);
        let where = [];
        // data.title = 'Грейт'
        where.push({status: config.GLOBAL_STATUSES.ACTIVE});
        if(data.title) {
                let searchField = data.title.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({[Op.like]: `%${item}%`});
                    });
                    where.push({[Op.or]: [{title: {[Op.or]: like}}]});
                }
        }
        try {

            let result = await models.posts.findAndCountAll({
                // where: where,
                where: {status: config.GLOBAL_STATUSES.ACTIVE, lang: data.lang},
                limit: perPage,
                offset: offset,
                // order: [["position", "asc"]],
                order: [["created_at", "DESC"]],
                include: [
                    {
                        model: models.post_category,
                        as: "posts_to_category",
                        attributes: [],
                        required: true,
                        through: {attributes: []},
                        where: {id: data.id}
                    },
                    {model: models.uploaded_files, as: "image"},
                    {model: models.uploaded_files, as: "banner_image"},
                    {model: models.uploaded_files, as: "banner_image_mobile"}

                ]
            })

             let rows = result.rows.map((item) => item.toJSON())
             result= { count: result.count, rows }
            return result.count > 0 && result.rows.length ? {
                posts: result.rows,
                count: result.count
            } : {posts: [], count: 0};
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    updateBlogPostId: async (data, category, id) => {
        try {
            await models.posts.update(data, {where: {id: id}});
            await models.post_to_category.destroy({where: {post_id: id}})
            await category.forEach(function (i) {
                models.post_to_category.create({post_id: id, category_id: i});
            })
            let result = await models.posts.findOne({
                where: {id: id}
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
}
