const service = require('../services/forms.service');
const { Op } = require("sequelize");
const config = require('../configs/config');
const errors = require('../configs/errors');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const sequelize = require('../sequelize-orm');
const log = require('../utils/logger');

module.exports = {

    getForms: async(req, res) => {
        log.info(`Start getForms data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : null;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : null;
        let numberOfDisabledForms = await service.countForms({ origin_id: 0, status: config.FORMS_STATUSES.DISABLED });
        let numberOfEnabledForms = await service.countForms({ origin_id: 0, status: config.FORMS_STATUSES.ENABLED });
        let numberOfAllForms = await service.countForms({ origin_id: 0 });
        let statusCount = {
            all: numberOfAllForms,
            1: numberOfDisabledForms,
            2: numberOfEnabledForms
        };
        let forms = await service.getAllForms(req.body, page, perPage);
        log.info(`End getForms data:${JSON.stringify(forms)}`)
        return res.status(200).json({ count: forms.count, data: forms.rows, statusCount });
    },
    getFormById: async(req, res) => {
        log.info(`Start getFormById data:${JSON.stringify(req.body)}`)
        const languages = config.LANGUAGES;
        const lang = req.query.lang ? req.query.lang : languages[0];
        const id = req.params.id;
        const filter = {
            [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
        };

        let result = await service.getFormById(filter);
        log.info(`End getFormById data:${JSON.stringify(result)}`)
        return res.status(200).json(result);
    },
    updateFormById: async(req, res) => {
        let transaction = await sequelize.transaction();
        try {
            log.info(`Start updateFormById data:${JSON.stringify(req.body)}`)
            let { title, status, emails, id, lang, popup_title, popup_text, popup_icon } = req.body;

            if(!status) status = config.GLOBAL_STATUSES.ACTIVE;

            const filter = {
                [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
            };
            const otherLangFilter = {
                [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
            };

            if (emails) {
                let emailsToCheck = emails.trim().split(",");
                for (let email of emailsToCheck) {
                    email = email.trim()
                    if (!config.REGEX_EMAIL.test(email)) {
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                }
            }



            let form = await service.getFormById(filter);

            let popup_icon_id = popup_icon && popup_icon.id ? (popup_icon.origin_id === 0 ? popup_icon.id : popup_icon.origin_id) : null

            await service.updateForm(otherLangFilter, { title: title, status: status, emails: emails, popup_title, popup_text, popup_icon_id }, transaction);


            await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'forms' }, transaction);

            let result = await service.getFormById(form.id, transaction);

            await transaction.commit();
            log.info(`End updateFormById data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(`${error}`);
            await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });

        }
    },
    changeFormStatusById: async(req, res) => {
        log.info(`Start updateFormById data:${JSON.stringify(req.body)}`)
        let { id, status } = req.body;
        if (!id || !status) {
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });

        }
        let transaction = await sequelize.transaction();
        try {
            const filter = {
                [Op.or]: [{ id: id }, { origin_id: id }]
            };

            let form = await service.getFormById(id);
            if (!form) {
                return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                });

            }



            await service.updateForm(filter, { status: status }, transaction);

            await adminChangesHistoryService.adminCreateHistory({ item_id: id, user_id: req.userid, type: 'forms' }, transaction);

            form = await service.getFormById(form.id, transaction);

            await transaction.commit();
            log.info(`End updateFormById data:${JSON.stringify(form)}`)
            return res.status(200).json(form);

        } catch (error) {
            log.error(error)
            await transaction.rollback();
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    getFormComments: async(req, res) => {
        log.info(`Start getFormComments data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : null;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : null;
        let comments = await service.getFormComments(req.body, page, perPage);
        log.info(`End getFormComments data:${JSON.stringify(comments)}`)
        return res.status(200).json({ count: comments.count, data: comments.rows });
    },
    deleteFormCommentsByIds: async(req, res) => {
        log.info(`Start getFormComments data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;
        try {
            let result = [];
            if (ids && ids.length) {
                for (let id of ids) {
                    let comment = await service.getFormCommentById(id);
                    if (!comment) {
                        result.push({ id: id, deleted: false, error: `No found news with id:${id}` })
                    } else {
                        await comment.destroy();
                        result.push({ id: id, deleted: true, error: false });
                    }
                }
            }
            log.info(`End getFormComments data:${JSON.stringify(result)}`)
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
