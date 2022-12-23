const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const adminChangesHistoryService = require('./admin-changes-history.service');
const log = require('../utils/logger');


module.exports = {
    getAllFormsSimply: async(filter) => {
        log.info(`Start   getAllFormsSimply data:${JSON.stringify(filter)}`)
        try {
            let result = await models.forms.findAll({
                where: filter,
                include: [{
                    model: models.uploaded_files,
                    as: 'popup_icon'
                }]
            });

            result = result.map((item) => item.toJSON())
            log.info(`End   getAllFormsSimply data:${JSON.stringify(result)}`)
            return result
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    createFormComment: async(comment) => {
        log.info(`Start  createFormComment data:${JSON.stringify(comment)}`)
        try {
            let result = await models.form_comments.create(comment);
            log.info(`End  createFormComment data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getPageLink:async (link)=>{
        log.info(`Start  getPageLink data:${JSON.stringify(link)}`)
        try {
            let result
            link = link.split("/")
            link = link[1]
            link = await models.links.findOne({where:{slug:link},raw:true})
            if(link && link.type == "page"){
                link = link.original_link.split('/')
                let id = link && link.length && typeof Number(link[2]) == 'number' ? Number(link[2]):Number(link[1])
                let page = await models.pages.findOne({where:{id:id},raw:true})
                result = page.title
            }else if(link && link.type == 'service'){
                link = link.original_link.split('/')
                let service = await models.service.findOne({where:{id:Number(link[3])},raw:true})
                result = service.title
            }
            log.info(`End  getPageLink data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getFormComments: async(settings, page, perPage) => {
        log.info(`Start  getFormComments data:${JSON.stringify(settings, page, perPage)}`)
        try {
            let where = [];
            let offset = 0
            if (settings.search) {
                let searchField = settings.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({
                            [Op.like]: `%${item}%`
                        });
                    });
                    where.push({
                        [Op.or]: [
                            {
                                phone:{
                                    [Op.or]: like
                                }
                            },
                            {
                                email: {
                                    [Op.or]: like
                                }
                            },
                            {
                                name: {
                                    [Op.or]: like
                                }
                            }
                        ]
                    });
                }
            }
            if (settings.dateFrom || settings.dateTo) {
                let created_at = {};
                if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom
                if (settings.dateTo) {
                    if (settings.dateFrom == settings.dateFrom) {
                        created_at[Op.lte] = new Date(settings.dateTo).setDate(new Date(settings.dateTo).getDate() + 1)
                    } else {
                        created_at[Op.lte] = settings.dateTo
                    }
                }
                // if (settings.dateFrom) created_at[Op.gte] = new Date(settings.dateFrom).getTime()/1000;
                // // if (settings.dateTo) created_at[Op.lte] = new Date(settings.dateTo).getTime()/1000;
                // if (settings.dateTo) {
                //     if (settings.dateFrom == settings.dateFrom) {
                //         created_at[Op.lte] = (new Date(settings.dateTo).getTime()/1000) + 86400;
                //     } else {
                //         created_at[Op.lte] = new Date(settings.dateTo).getTime()/1000;
                //     }
                // }
                where.push({ created_at: created_at });
            }
            if (settings.form_id) {
                where.push({
                    [Op.or]: [{ form_id: settings.form_id }]
                });
            }
            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            let result = await models.form_comments.findAndCountAll({
                where: where,
                offset: offset,
                order: [
                    ["created_at", "DESC"]
                ],
                limit: perPage,
                raw:true
            })
            if(result && result.rows && result.rows.length){
                for(let item of result.rows){
                    let images = await models.form_comments_to_uploaded_files.findAll({where:{form_comment_id:item.id},raw:true})
                    if(images && images.length){
                        images = images.map(i=>i.uploaded_files_id)
                        item.images = await models.user_uploaded_files.findAll({where:{id:{[Op.in]:images}},raw:true})
                    }
                    if(item.form_id){
                        item.form_title = await models.forms.findOne({where:{id:item.form_id},raw:true})
                        if(item.form_title)item.form_title = item.form_title.title
                    }
                }
            }
            log.info(`End getFormComments data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getFormCommentById: async(id) => {
        log.info(`Start  getFormCommentById data:${JSON.stringify(id)}`)
        try {
            let result = await models.form_comments.findOne({
                where: { id: id }
            })
            log.info(`End  getFormCommentById data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    deleteFormComment: async(id) => {
        log.info(`Start deleteFormComment data:${JSON.stringify(id)}`)
        try {
            let result = await models.form_comments.destroy({
                where: { id: id }
            })
            log.info(`End deleteFormComment data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    updateForm: async(filter, data, trans) => {
        log.info(`Start updateForm data:${JSON.stringify(filter, data)}`)
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.forms.update(data, { where: filter, transaction });
            /* let result = await models.forms.findOne({
                 where: {id: id},
                 transaction
             });
             result = result.toJSON();*/
            result.history = await adminChangesHistoryService.adminFindAllHistory({ type: 'forms' }, transaction);

            if (!trans) await transaction.commit();
            log.info(`End updateForm data:${JSON.stringify(result)}`)
            return result
        } catch (err) {
            log.error(err)
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    getFormById: async(id, trans) => {
        log.info(`Start getFormById data:${JSON.stringify(id)}`)
        let transaction = trans ? trans : null;
        try {
            let filter = id;
            if (typeof filter !== 'object') {
                filter = { id: id };
            }
            let result = await models.forms.findOne({
                where: filter,
                transaction,
                include: [{
                    model: models.uploaded_files,
                    as: 'popup_icon'
                }]
            });

            result = result.toJSON()

            result.comments = await models.form_comments.findAll({where:
                    {
                        form_id:result.id
                    },
                raw:true
            })

            result.history = await adminChangesHistoryService.adminFindAllHistory({ type: 'forms' }, transaction);
            log.info(`End getFormById data:${JSON.stringify(result)}`)
            return result
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    countForms: async(whereObj) => {
        log.info(`countForms data:${JSON.stringify(whereObj)}`)
        try {
            return await models.forms.count({ where: whereObj });
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },
    getAllForms: async(settings, page, perPage) => {
        log.info(`Start getAllForms data:${JSON.stringify(settings, page, perPage)}`)
        let lang
        if(settings.lang){
            lang = settings.lang
        } else lang = 'uk'
        try {
            let where = [{ lang: lang }];
            let offset = 0;
            if (settings.search) {
                let searchField = settings.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({
                            [Op.like]: `%${item}%`
                        });
                    });
                    where.push({
                        [Op.or]: [{
                            title: {
                                [Op.or]: like
                            }
                        }, ]
                    });
                }
            }
            if (settings.status && settings.status !== 'all') {
                where.push({ status: settings.status });
            }
            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            log.info(`End getAllForms data:${JSON.stringify(where, offset, perPage)}`)
            return await models.forms.findAndCountAll({ where: where, offset: offset, limit: perPage });
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    },

}
