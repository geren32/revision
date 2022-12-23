const _ = require('lodash');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const { models, transaction } = require('../sequelize-orm');
const log = require('../utils/logger');
const config = require('../configs/config')
function calcDate(date1, date2) {
    let diff = Math.floor(date1.getTime() - date2.getTime());
    let day = 1000 * 60 * 60 * 24;
    let days = Math.abs(diff / day);
    return days
}

const groupByMonth = function(data) {
    let withDate = _.each(data, function(elem) {
        let date = new Date(elem.created_at);
        elem.cat = date.getMonth()
        elem.year = date.getFullYear()
    });
    let monthName = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    let groupedResult = _.groupBy(withDate, 'cat')
    let month = []
    for (let i = 1; i < 13; i++) {
        if (groupedResult[i]) {
            month.push({
                text: monthName[i] + ` ${groupedResult[i][0].year}`,
                quantity: groupedResult[i].length,
                amount: _.sumBy(groupedResult[i], "total_price")
            })
        }
    }
    let totalQuantity = _.sumBy(month, "quantity")
    let totalAmount = _.sumBy(month, "amount")
    return { totalQuantity, totalAmount, points: month }
};
const groupByDay = function(data) {
    let withDate = _.each(data, function(elem) {
        let date = new Date(elem.created_at);
        elem.cat = date.getDate()
        elem.month = date.getMonth()
    });
    let monthName = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    let groupedResult = _.groupBy(withDate, 'cat')
    let day = []
    for (let i = 1; i < 32; i++) {
        if (groupedResult[i]) {
            day.push({
                text: i + ' ' + monthName[groupedResult[i][0].month],
                quantity: groupedResult[i].length,
                amount: _.sumBy(groupedResult[i], "total_price")
            })
        }
    }
    let totalQuantity = _.sumBy(day, "quantity")
    let totalAmount = _.sumBy(day, "amount")
    return { totalQuantity, totalAmount, points: day }
};
module.exports = {

    getAllAnalytics: async(data) => {
        log.info(`Start getAllAnalytics service data:${JSON.stringify(data)}`)
        let where = [{ status: config.BOOKING_STATUSES[4].value }];

        //if (data.dateFrom || data.dateTo) {
        // let created_at = {};
        // if (data.dateFrom) created_at[Op.gte] = data.dateFrom;
        // if (data.dateTo) {
        //     if (data.dateFrom == data.dateFrom) {
        //         created_at[Op.lte] = data.dateTo;
        //     } else {
        //         created_at[Op.lte] = data.dateTo;
        //     }
        // }
        // where.push({ created_at: created_at });

        if (data.dateFrom || data.dateTo) {
            let created_at = {};

            if (data.dateFrom) created_at[Op.gte] = data.dateFrom
            if (data.dateTo) {
                if (data.dateFrom == data.dateFrom) {
                    created_at[Op.lte] = new Date(data.dateTo).setDate(new Date(data.dateTo).getDate() + 1)
                } else {
                    created_at[Op.lte] = data.dateTo
                }
            }

            where.push({ created_at: created_at });
        }
        // }
        let result = await models.orders.findAndCountAll({
            where: where,
        })
        let diffDateDay = calcDate(new Date(data.dateFrom), new Date(data.dateTo))

        let rows = result.rows.map(row => {

            return row.toJSON()
        });
        let result_time = []
        if (diffDateDay > 31) {
            result_time = groupByMonth(rows)
        } else {
            result_time = groupByDay(rows)
        }
        log.info(`End getAllAnalytics service data:${JSON.stringify(result_time)}`)
        return result_time
    },


    getAllUserAnalytics: async(settings, page, perPage, currency) => {
        log.info(`Start getAllUserAnalytics service data:${JSON.stringify(settings)}`)
        try {
            let where = [];
            let where_info = [];
            let where_orders = [{ status: config.BOOKING_STATUSES[4].value }];
            if (settings.search) {
                let searchField = settings.search.trim().split(" ");
                if (searchField && searchField.length) {
                    let like = [];
                    searchField.forEach((item) => {
                        like.push({
                            [Op.like]: `%${item}%`
                        });
                    });
                    where_info.push({
                        [Op.or]: [{
                                id: {
                                    [Op.or]: like
                                }
                            },
                            {
                                'first_name': {
                                    [Op.or]: like
                                }
                            },
                            {
                                'last_name': {
                                    [Op.or]: like
                                }
                            }
                        ]
                    });
                }
            }
            let offset = 0
            if (settings.status === 'all') {
                where.push({
                        status: {
                            [Op.ne]: config.BOOKING_STATUSES[1].value
                        }
                    })
                    // where.push({ status: settings.status});
            }
            else if (settings.status) {
                where.push({ status: settings.status });
            }else{
                where.push({ status: config.GLOBAL_STATUSES.ACTIVE });

            }
            // if (settings.dateFrom || settings.dateTo) {
            //     let created_at = {};
            //     if (settings.dateFrom) created_at[Op.gte] = settings.dateFrom;
            //     if (settings.dateTo) {
            //         if (settings.dateFrom == settings.dateFrom) {
            //             created_at[Op.lte] = settings.dateTo;
            //         } else {
            //             created_at[Op.lte] = settings.dateTo;
            //         }
            //     }
            //     where_orders.push({ created_at: created_at });
            // }
            if (page && perPage) {
                offset = perPage * (page - 1);
            }
            const { count } = await models.user.findAndCountAll({
                where: where,
                // include: [{
                //     model: models.orders,
                //     required: true,
                //     where: where_orders,
                //     attributes: [],
                // }, ],
            });
            const result = await models.user.findAndCountAll({
                // offset: offset,
                // limit: perPage,
                // subQuery: false,
                where: where,
                // group: ['id'],
                // order: [
                //     [sequelize.col('orders.created_at'), 'DESC']
                // ],
                // attributes: [
                //     [sequelize.fn('sum', sequelize.col('orders.total_price')), 'amount'],
                //     [sequelize.fn('COUNT', sequelize.col('orders.id')), 'quantity'],
                //     'created_at',
                //     'last_name',
                //     'first_name',
                //     'email',
                //     'phone',
                // ],
                // include: [{
                //     model: models.orders,
                //     required: true,
                //     as: "orders",
                //     where: where_orders,
                //     order: [
                //         ['orders.id', 'desc']
                //     ],
                //     attributes: [
                //         'id',
                //         'created_at',
                //         'total_price'
                //     ]
                // }]
            });
            result.rows.map(row => {
                row.toJSON()
                return row
            });
            result.count = count
            if (result && result && result.length) {
                result.rows = result.map(row => {
                    row.toJSON()
                    return row
                });
            }
            log.info(`End getAllUserAnalytics service data:${JSON.stringify(result)}`)
            return result;
        } catch (err) {
            log.error(err)
            err.code = 400;
            throw err;
        }
    }

}
