const config = require('../configs/config');
const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const sequelize = require('../sequelize-orm');
const log = require('../utils/logger');
module.exports = {
     createMark: async (mark, trans) => { 
        let transaction = null;
        log.info(`Start function createMark Params: ${JSON.stringify(mark)}`);
        try {

            let res = await models.mark.findOne({
                where: { lang: mark.lang },
                attributes: ["id", "position"],
                order: [
                    ["position", "DESC"]
                ]
            })
            mark.position = res && res.position ? res.position + 1 : 1;

            transaction = trans ? trans : await sequelize.transaction();
            let result = await models.mark.create(mark, { transaction });
            if (!trans) await transaction.commit();
            log.info(`End function createMark   Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
     getMarks: async (ids) => {
        let where = {}
        if (ids) {
            where.id = ids;
        }
        log.info(`Start function getMarks Params: ${JSON.stringify(ids)}`);
        try {

            let result = await models.mark.findAll({
                where: where,
                include: [{model: models.country_manufacturer, as: "country", attributes: ['title']}]
            })
            log.info(`End function getMarks Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
     getMarkByFilter: async(filter, trans) => {
        let transaction = trans ? trans : null;
        log.info(`Start function getMarkByFilter Params: ${JSON.stringify(filter)}`);
        try {
            let result = await models.mark.findOne({
                where: filter,
                include: [{
                    model: models.uploaded_files,
                    as:"mark_image"
                }],
                transaction
            })
            log.info(`End function getMarkByFilter  Result: ${JSON.stringify(result)}`);
            return result;
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },
    deleteMarkById: async (id, transaction) => {
        log.info(`Start function deleteMarkById Params: ${JSON.stringify({id:id})}`);
        try {
            await models.mark.destroy({ where: { origin_id: id }, transaction });
            let result = await models.mark.destroy({ where: { id }, transaction })
            log.info(`End function deleteMarkById  Result: ${JSON.stringify(result)}`);
            return result;
            
        } catch (err) {
            log.error(`${err}`);
            err.code = 400;
            throw err;
        }
    },

    updateMarkById: async (params, mark, trans) => {
        let transaction = null;
        let filter = params;
        if (typeof filter !== 'object') {
            filter = { id: params }
        }
        log.info(`Start function updateMarkById Params: ${JSON.stringify({params: params, mark:mark})}`);
        try {
            transaction = trans ? trans : await sequelize.transaction();
            await models.mark.update(mark, { where: filter, transaction });
            let result = await models.mark.findOne({
                where: filter,
                include: [{
                    model: models.uploaded_files,
                    as:"mark_image"
                }],
                transaction
            });

            if (!trans) await transaction.commit();
            log.info(`End function updateMarkById  Result: ${JSON.stringify(result)}`);
            return result;

        } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }

    },
    countMarksByParam: async (filter) => {
        log.info(`Start function countMarksByParam Params: ${JSON.stringify(filter)}`);
        const result = await models.mark.count({
            where: filter
        });
        log.info(`End function countMarksByParam Result: ${JSON.stringify(result)}`);
        return result ? result : 0;
    },
    makeMarksFilter: async (body, whereObj) => {
        let arr = [];
        let sort;
        log.info(`Start function Params: ${JSON.stringify({body: body, whereObj: whereObj})}`);
        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({ title: { [Op.or]: like } });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.sort) {
            if (body.sort.position) {
                sort = [['position', body.sort.position]];
            }
        } else {
            sort = [['position', 'ASC']];
        }
        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        log.info(`End function makeMarksFilter Result: ${JSON.stringify(filter)}`);
        return filter;
    },

    adminGetAllMark: async (filter, page, perPage, attributes) => {
        try {
            log.info(`Start function adminGetAllMark Params: ${JSON.stringify({filter: filter, page: page, perPage: perPage, attributes: attributes})}`);
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.mark.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include: [
                    {
                        model:models.uploaded_files,
                        as:"mark_image"
                    }
                ],
            });
            if (result && result.rows && result.rows.length){
                let allMarks =[]
                for(let item of result.rows){
                    item = item.toJSON();
                    let lang_change = await models.mark.findAll({
                        where:{ [Op.or]:[ {id:item.id}, {origin_id:item.id} ] },
                        attributes:['id','origin_id','lang'],
                        raw: true
                    })
                    let change ={}
                    for(let id of lang_change){
                        id.history = await models.admin_changes_history.findAll({
                            where:{
                                item_id:id.id ,type:"mark"
                            },
                            raw: true
                        })
                        for (const lang of config.LANGUAGES) {
                            if(id.lang === lang){
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    item.change = change
                    allMarks.push(item)
                }
                result.rows = allMarks
            }
            log.info(`End function  adminGetAllMark  Result: ${JSON.stringify(result)}`);
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

    changePosition: async( id, position, is_last, trans ) => {
        log.info(`Start product mark service changePosition`)
        let transaction = null;
         try {
            transaction = trans ? trans : await sequelize.transaction();
            if(is_last) position++;
            await models.mark.increment({position: 1}, { where: { position: { [Op.gte]:position } }, transaction });
            await models.mark.update({ position: position }, { where: { [Op.or]: [{ id: id }, { origin_id: id }] }, transaction });
            
            if (!trans) await transaction.commit();
            log.info(`End product mark service changePosition`)
            return true
         } catch (err) {
            log.error(`${err}`);
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
         }
 
    },


}
