const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const sequelize = require('../sequelize-orm');

const config = require('../configs/config')
const log = require('../utils/logger');
const moment = require('moment');
module.exports = {

    createProductTestimonial: async (testimonial, trans) => {

        let transaction = null;
        log.info(`Start function createProductTestimonial Params: ${JSON.stringify(testimonial)}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.product_testimonials.create(testimonial, {
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End function createProductTestimonial  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countProductTestimonialByParam: async (whereObj) => {
        log.info(`Start function countProductTestimonialByParam Params: ${JSON.stringify(whereObj)}`);
        try {
            let result = await models.product_testimonials.count({
                where: whereObj,
                include: [{
                    model: models.product,
                    required: true
                }]
            });
            log.info(`End function countProductTestimonialByParam  Result: ${JSON.stringify(result)}`);
            return result ? result : 0;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    getProductTestimonialByFilter: async (filter, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getProductTestimonialByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.product_testimonials.findOne({
                where: filter,
                transaction
            });
            log.info(`End function getProductTestimonialByFilter Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    getAllProductTestimonialsByFilter: async (filter, page = 1, perPage = 3, isMoreRequest, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getAllProductTestimonialsByFilter Params: ${JSON.stringify(filter)}`);
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_testimonials.findAndCountAll({
                where: filter,
                offset: offset,
                limit: limit,
                distinct: true,
                order: [['created_at', 'DESC']],
                transaction
            });
            
            let isShowMore = false;
            if (result && result.rows && result.rows.length){
                result.rows = result.rows.map(item => {
                    item = item.toJSON();
                    if(item.published_at) item.published_at = moment(new Date(item.published_at)).format("MM.DD.YYYY")
                    return item;
                });
                if((isMoreRequest && result.count > page*3) || (!isMoreRequest && result.count > 3)){
                    isShowMore = true
                }
            }

            log.info(`End function getAllProductTestimonialsByFilter Result: ${JSON.stringify(result)}`);
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count,
                isShowMore
            } : { data: [], count: 0, isShowMore };

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    getAllProductTestimonialsAnswersByFilter: async (testimonials, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getAllProductTestimonialsAnswersByFilter`);
        try {
            let result = [];
            if(testimonials && testimonials.length){
                let testimonialsIds = testimonials.map(item => item.id);
                let answers = await models.product_testimonials.findAll({
                    where: {
                        parent_id: testimonialsIds,
                        status: config.GLOBAL_STATUSES.ACTIVE,
                    },
                    raw: true,
                    order: [['created_at', 'DESC']],
                    transaction
                });
                if(answers && answers.length){
                    answers = answers.map(item => {
                        if(item.published_at) item.published_at = moment(new Date(item.published_at)).format("MM.DD.YYYY")
                        return item;
                    });
                    for (let testimonial of testimonials) {
                        testimonial.answers = answers.filter(item => item.parent_id == testimonial.id)
                    }
                }
                result = testimonials;
            }

            log.info(`End function getAllProductTestimonialsAnswersByFilter`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },



    adminGetAllProductTestimonials: async (filter, page, perPage, attributes,sort) => {
        log.info(`Start function adminGetAllProductTestimonials Params: ${JSON.stringify({filter: filter, page: page, perPage: perPage, attributes: attributes})}`);
        try {


            if(!sort){
                sort = [['created_at', 'DESC']]
            } else if(sort && sort.direction && sort.key =='product_name'){
                sort = [[{model: models.product},"name", sort.direction]]
            } else if(sort && sort.direction && sort.key !='product_name'){
                sort = [[sort.key, sort.direction]];
            } else  sort = [['created_at', 'DESC']]

            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_testimonials.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: sort,
                attributes: attributes,
                distinct: true,
                include: [{
                    model: models.product,
                    where: filter.product,
                    attributes: ['id','name','sku','image_id','type'],
                    include:[{
                        model: models.uploaded_files,
                        as: "image"
                    }]
                }]
            });

            if (result && result.rows && result.rows.length) {
                result.rows = await Promise.all(result.rows.map(async (row) => {
                    row = row.toJSON();
                    if(row.parent_id != 0){
                        let parent_text = await models.product_testimonials.findOne({
                            where: { id: row.parent_id, status: config.GLOBAL_STATUSES.ACTIVE }
                        });
                        row.parent_text = parent_text && parent_text.text ? parent_text.text : null;
                        row.parent_published_at = parent_text && parent_text.published_at ? parent_text.published_at : null;
                        row.parent_name = parent_text && parent_text.name ? parent_text.name : null;
                        row.parent_email = parent_text && parent_text.email ? parent_text.email : null;
                    }
                    return row;
                }));

            }
            log.info(`End function adminGetAllProductTestimonials  Result: ${JSON.stringify({data: result.rows,count: result.count})}`);
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },


    makeProductTestimonialFilter: async (body, whereObj) => {
        let arr = [];
        let product = {};
        let sort;
        log.info(`Start function makeProductTestimonialFilter Params: ${JSON.stringify({body:body, whereObj: whereObj})}`);
        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                product = { name: { [Op.or]: like } };
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }

        // if (body.dateFrom || body.dateTo) {
        //     let date = {};
        //     if (body.dateFrom) date[Op.gte] = body.dateFrom;
        //     if (body.dateTo) date[Op.lte] = body.dateTo;

        //     arr.push({ created_at: date });
        // }

        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] }, product };
        log.info(`End function makeProductTestimonialFilter  Result: ${JSON.stringify(filter)}`);
        return filter;
    },

    updateProductTestimonialById: async (params, testimonial, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function updateProductTestimonialById Params: ${JSON.stringify({params: params, testimonial: testimonial})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.product_testimonials.update(testimonial, { where: filter, transaction });
            let result = await models.product_testimonials.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();

            log.info(`End function updateProductTestimonialById  Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },

    deleteProductTestimonialById: async (id, trans) => {
        let transaction = null;
        log.info(`Start function deleteProductTestimonialById Params: ${JSON.stringify(id)}`);
        try {
            const transaction = trans ? trans : await sequelize.transaction();
            await models.product_testimonials.destroy({
                where: { id },
                transaction
            });
            await models.product_testimonials.destroy({
                where: { parent_id: id },
                transaction
            });
            if (!trans) await transaction.commit();
            log.info(`End function  Result: true`);
            return true;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getRatingArr: (testimonials) => {
        let sumRating = 0;
        let countRating = 0;
        log.info(`Start function getRatingArr Params: ${JSON.stringify(testimonials)}`);
        for (const testimonial of testimonials) {
            if (testimonial.parent_id === 0 && testimonial.rating) {
                sumRating += testimonial.rating
                    ++countRating;
            }
        }
        let rating = [];
        if (sumRating && countRating) {
            let avarageRating = Math.round(sumRating / countRating)
            for (let i = 1; i < 6; i++) {
                if (i <= avarageRating) {
                    rating.push(true)
                } else {
                    rating.push(false)
                }
            }
        } else {
            rating = [false, false, false, false, false]
        }
        log.info(`End function getRatingArr  Result: ${JSON.stringify(rating)}`);
        return rating
    },



}
