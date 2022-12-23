const { models } = require('../sequelize-orm');
const Sequelize = require('sequelize');
const { Op } = Sequelize;
const log = require('../utils/logger');

module.exports = {

    networks_with_stores: async(lang) => {
        log.info(`Start networks_with_stores data:${JSON.stringify(lang)}`)
        let result = await models.stores.findAll({
            where: { lang: lang },
            include: [{ model: models.city }, { model: models.uploaded_files, as: 'icon' },{ model: models.uploaded_files, as: 'icon_hover' }]
        });
        if (result) {
            result = result.map((item) => item.toJSON())
            for (let i = 0; i < result.length; i++) {
                let images_result
                if(result[i].images){
                    let images = JSON.parse(result[i].images)
                    images_result = await models.uploaded_files.findAll({
                        where: {
                            id: {
                                [Op.in]: images
                            }
                        }
                    })
                }
                
                if (images_result && images_result.length) {
                    images_result = images_result.map((item) => item.toJSON())

                    let arr = []
                    images_result.forEach((item) => arr.push({ "block_image": item }))
                    result[i].images = arr
                }
            }
        }
        log.info(`End networks_with_stores data:${JSON.stringify(result)}`)
        return result
    },
    get_cities_with_stores: async(lang) => {
        log.info(`Start get_cities_with_stores data:${JSON.stringify(lang)}`)
        let result = await models.city.findAll({
            where: { lang: lang },
            include: [{
                model: models.stores,
                distinct: true,
                include: [
                    { model: models.uploaded_files, as: 'icon' },
                    { model: models.uploaded_files, as: 'icon_hover' }
                ]
            }]
        });

        if (result) {
            result = result.map((item) => item.toJSON())
            for (let i = 0; i < result.length; i++) {
                for (let k = 0; k < result[i].length; k++) {
                    let images_result
                    if(result[k].images){
                        let images = JSON.parse(result[k].images)
                        images_result = await models.uploaded_files.findAll({
                            where: {
                                id: {
                                    [Op.in]: images
                                }
                            }
                        })
                    }
                    
                    if (images_result && images_result.length) {
                        images_result = images_result.map((item) => item.toJSON())

                        let arr = []
                        images_result.forEach((item) => arr.push({ "block_image": item }))
                        result[k].images = arr
                    }
                }
            }
        }


        log.info(`End get_cities_with_stores data:${JSON.stringify(result)}`)
        return result
    },

    changeDataRequest: async(userData) => {

        const user = await dealerService.getClientDetail(userData.user_id);
        const dealer = await dealerService.getDealerUser(user.client.dealer_id);

        let changeRequest = {
            user_id: user.id,
            first_name_before: user.first_name,
            first_name_after: userData.first_name && userData.first_name !== user.first_name ? userData.first_name : null,
            last_name_before: user.last_name,
            last_name_after: userData.last_name && userData.last_name !== user.last_name ? userData.last_name : null,
            phone_before: user.phone,
            phone_after: userData.phone && userData.phone !== user.phone ? userData.phone : null,
            email_before: user.email,
            email_after: userData.email && userData.email !== user.email ? userData.email : null,



            dealer_before: user.client.dealer_id,
            dealer_after: userData.dealer && userData.dealer !== user.client.dealer_id ? userData.dealer : null,

            comment: userData.comment,
            client_company_before: user.client.company_name,
            status: 0


        };


        let request = await models.change_data_request.create(changeRequest);

        return request;
    },

    getUnreadRejections: async(user_id) => {
        const unreadRejections = await models.change_data_request.findAll({
            where: {
                [Op.and]: [
                    { user_id: user_id },
                    {
                        [Op.or]: [{
                            is_read_rejection: {
                                [Op.not]: 1
                            }
                        }, {
                            is_read_rejection: {
                                [Op.is]: null
                            }
                        }]
                    },
                    { status: 2 }
                ]
            },
            attributes: ['reason_for_rejection', 'id']
        });
        return unreadRejections.map(function(item) {
            return item.toJSON();
        })
    },

    readRejectionMessage: async(id) => {
        const read = await models.change_data_request.update({ is_read_rejection: true, updated_at: Math.floor(new Date().getTime() / 1000) }, { where: { id: id } });
        return read;
    }


}