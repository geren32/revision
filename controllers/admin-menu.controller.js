const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");


const menuService = require('../services/menu.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { models } = require('../sequelize-orm');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const log = require('../utils/logger');
module.exports = {
    saveHeaderFooter: async(req, res) => {
        log.info(`Start saveHeaderFooter data:${JSON.stringify(req.body)}`)
        let { header_logo,footer_logo,copyright,social_network,partner_logo,partner_link,phone_icon,phone, email,email_icon} = req.body;
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];

        const transaction = await sequelize.transaction();
        try {
            if (social_network && social_network.length) {
                for (let social of social_network) {
                    if (!social.link) {
                        return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                            message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                            errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                        });
                    }
                    if (social.icon) {
                        social.icon = social.icon.id ? (social.icon.origin_id === 0 ? social.icon.id : social.icon.origin_id) : null;
                    }

                }
            }
            header_logo = header_logo && header_logo.id ? (header_logo.origin_id === 0 ? header_logo.id : header_logo.origin_id) : null;
            footer_logo = footer_logo && footer_logo.id ? (footer_logo.origin_id === 0 ? footer_logo.id : footer_logo.origin_id) : null;
            phone_icon = phone_icon && phone_icon.id ? (phone_icon.origin_id === 0 ? phone_icon.id : phone_icon.origin_id) : null;
            email_icon = email_icon && email_icon.id ? (email_icon.origin_id === 0 ? email_icon.id : email_icon.origin_id) : null;
            partner_logo = partner_logo && partner_logo.id ? (partner_logo.origin_id === 0 ? partner_logo.id : partner_logo.origin_id) : null;

            let result = await menuService.saveHeaderFooter({value:JSON.stringify([{ social_network: JSON.stringify(social_network),email,footer_logo_id:footer_logo,header_logo_id:header_logo,partner_link,email_icon_id: email_icon, copyright, phone: phone, phone_icon_id: phone_icon,partner_logo_id:partner_logo }])}, lang, transaction);
            if (result) {
                await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: req.userid, type: 'header_footer' }, transaction);
            
                result = await menuService.getHeaderFooterAdmin(lang, transaction);
            }
            await transaction.commit();

            log.info(`End saveHeaderFooter data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getHeaderFooter: async(req, res) => {
        log.info(`Start getHeaderFooter data:${JSON.stringify(req.body)}`)
        try {
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            let result = await menuService.getHeaderFooterAdmin(lang);
            result.history = await models.admin_changes_history.findAll({where: {type:'header_footer', item_id: result.id}, include: {model: models.user, attributes: ['id','first_name','last_name']}})
            log.info(`End getHeaderFooter data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    saveMenu: async(req, res) => {
        log.info(`Start saveMenu data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        let { value } = req.body;
        if (!value) {
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        const transaction = await sequelize.transaction();
        try {
            let result = await menuService.saveMenu(JSON.stringify(value), lang, transaction);
            if (result) {
                await adminChangesHistoryService.adminCreateHistory({ item_id: result.id, user_id: req.userid, type: 'menu' }, transaction);
                await models.admin_changes_history.create({ created_at: Math.floor(new Date().getTime() / 1000), item_id: result.id, user_id: req.userid, type: 'menu' }, { transaction });
                result = await menuService.getMenuAdmin(lang, transaction);
            }
            if (result && result.value){
                result.value = JSON.parse(result.value);
            }
            await transaction.commit();
            log.info(`End saveMenu data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getMenu: async(req, res) => {
        log.info(`Start getMenu data:${JSON.stringify(req.body)}`)
        try {
            const languages = config.LANGUAGES;
            const lang = req.query.lang ? req.query.lang : languages[0];
            let result = await menuService.getMenuAdmin(lang);
            if (result && result.value){
                result.value = JSON.parse(result.value);
            }
            log.info(`End getMenu data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
}
