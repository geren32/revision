const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const sequelize = require('../sequelize-orm');

module.exports = {

    createTestimonial: async (testimonial, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            let result = await models.testimonials.create(testimonial, {
                transaction
            });

            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    countTestimonialByParam: async (whereObj) => {
        try {
            let result = await models.testimonials.count({
                where: whereObj
            });
            return result ? result : 0;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getTestimonialByFilter: async (filter, trans) => {
        let transaction = trans ? trans : null;
        try {
            let result = await models.testimonials.findOne({
                where: filter,
                include: [
                    { model: models.uploaded_files, as: "image" },
                ],
                raw: true,
                transaction
            });
            return result;

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },



    adminGetAllTestimonials: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.testimonials.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                // raw:true,
                include: [
                    { model: models.uploaded_files, as: "image" }
                ]
            });
           if(result && result.rows.length){
               result.rows= result.rows.map(item=>item.toJSON())
           }
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },


    makeTestimonialFilter: async (body, whereObj) => {
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({ name: { [Op.or]: like } });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        
        // if (body.dateFrom || body.dateTo) {
        //     let date = {};
        //     if (body.dateFrom) date[Op.gte] = body.dateFrom;
        //     if (body.dateTo) date[Op.lte] = body.dateTo;

        //     arr.push({ createdAt: date });
        // }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        return filter;
    },

    updateTestimonialById: async (params, testimonial, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.testimonials.update(testimonial, { where: filter, transaction });
            let result = await models.testimonials.findOne({
                where: filter,
                transaction
            });

            if (!trans) await transaction.commit();

            return result;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },
    
}
