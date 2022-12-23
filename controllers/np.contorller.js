const log = require('../utils/logger');
const config = require("../configs/config");
const npUtil = require("../utils/np-Util");
const templateUtil = require("../utils/template-util");
const  np = new npUtil(config.NP_PRIVATE_KEY)


module.exports = {
    getAllCities: async (req, res) => {
        log.info(`Start  post /getAllCities ${JSON.stringify(req.body)} `);

        let name = req.body.name

        let response = await np.getCity(name)

        const html = await templateUtil.getTemplate({
            data: response.data,
        }, 'client/np-cities-ajax');
        log.info(`End post /getCityAddress `);

        res.json({
            html: html,
        })

    },
    getSections:async (req,res)=>{
        log.info(`Start  post /getSections ${JSON.stringify(req.body)} `);

        let city = req.body.city

        let response = await np.getWarehousesAddress(city)
        const html = await templateUtil.getTemplate({
            data: response.data,
        }, 'client/np-section-ajax');
        log.info(`End post /getSections `);

        res.json({
            html: html,
        })
    }
}
