const analyticsService = require('../services/admin.analytics.service');
const { models, transaction } = require('../sequelize-orm');
const log = require('../utils/logger');




module.exports = {

    getSalesAnalytics: async(req, res) => {
        try {
            log.info(`Start getSalesAnalytics data:${JSON.stringify(req.body)}`)
            let bookings = await analyticsService.getAllAnalytics(req.body);
            log.info(`End getSalesAnalytics data:${JSON.stringify(bookings)}`)
            return res.status(200).json(bookings);

        } catch (error) {
            log.error(error)
        return   res.status(400).json({
                message: error.message,
                errCode: '400'
            });
            
        }

    },
    getUsersAnalytics: async(req, res) => {
        log.info(`Start getUsersAnalytics data:${JSON.stringify(req.body)}`)
        let id = req.params.id;
        let { comment } = req.body;
        try {

            let page = req.body.current_page ? parseInt(req.body.current_page) : 0;
            
            let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 0;
            // let { value } = await models.configs.findOne({ where: { type: 'currency' }, raw: true });
            // let currencyValue = parseFloat(value);
            let bookings = await analyticsService.getAllUserAnalytics(req.body, page, perPage);
            log.info(`End getUsersAnalytics data:${JSON.stringify(bookings)}`)
            return res.status(200).json({ count: bookings.count, data: bookings.rows });
        
        } catch (error) {
            log.error(error)
          return res.status(400).json({
                message: error.message,
                errCode: ''
            });
           
        }
    },


}