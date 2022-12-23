const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const userService = require('../services/user.service');
const utilsCognito = require('../utils/cognito-util')
const extraUtil = require("../utils/extra-util");
const config = require('../configs/config');
const errors = require('../configs/errors');
const bcryptUtil = require('../utils/bcrypt-util');
const { makeLocalToken } = require('../utils/app-util');
const { models } = require('../sequelize-orm');
const adminChangesHistoryService = require('../services/admin-changes-history.service');
const log = require('../utils/logger');
const emailUtil = require("../utils/mail-util");
const generator = require('generate-password');
const notificationService = require('../services/notification-service');
const helloSignUtil = require('../utils/hello-sign-util');
const s3Util = require('../utils/s3-util');
const XlsUtil = require('../utils/exportXLS');

module.exports = {

    getAllUsers: async(req, res) => {
        log.info(`Start getAllUsers data:${JSON.stringify(req.body)}`)
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;

        try {
            let numberOfWaitionUser = await userService.adminCountsStatus(config.GLOBAL_STATUSES.WAITING);
            let numberOfActiveUser = await userService.adminCountsStatus(config.GLOBAL_STATUSES.ACTIVE);
            let numberOfBlockedUser = await userService.adminCountsStatus(config.GLOBAL_STATUSES.BLOCKED);
            let numberOfDeletedUser = await userService.adminCountsStatus(config.GLOBAL_STATUSES.DELETED);
            let numberOfAllUser = await userService.adminCountsAllStatus();
            let statusCount = {
                all: numberOfAllUser,
                1: numberOfDeletedUser,
                2: numberOfActiveUser,
                3: numberOfBlockedUser,
                4: numberOfWaitionUser,
            };

            if (req.body && req.body.status && req.body.status === 'all') {
                let filter = await userService.makeUserFilter(req.body, {
                    status: {
                        [Op.ne]: 1
                    }
                });
                let result = await userService.adminGetAllUsers(filter, page, perPage, ['id', "first_name", "last_name", "email", 'status', 'phone', 'role', 'created_at', "updated_at", 'email_verified']);


                result.statusCount = statusCount;
                return res.status(200).json(result);
            }
            let filter = await userService.makeUserFilter(req.body);
            let result = await userService.adminGetAllUsers(filter, page, perPage, ['id', "first_name", "last_name", "email", 'status', 'phone', 'role', 'created_at', "updated_at", 'email_verified']);

            result.statusCount = statusCount;
            log.info(`End getAllUsers data:${JSON.stringify(result)}`)
            return res.status(200).json(result);

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: 400
            });

        }
    },
    createEXELClientsFile: async (req, res) => {
        let page = req.body.current_page ? parseInt(req.body.current_page) : 1;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 10;
        try {
            log.info(`Start post createEXELClientsFile:${JSON.stringify(req.body)}`);
            let filterwhere = {}
            let result
            if (req.body && req.body.status && req.body.status === 'all') {
                let filter = await userService.makeUserFilter(req.body, {
                    status: {
                        [Op.ne]: 1
                    }
                });
                 result = await userService.adminGetAllUsers(filter, page, perPage, ['id', "first_name", "last_name", "email", 'status', 'phone', 'role', 'created_at', "updated_at", 'email_verified']);
            }else{
                let filter = await userService.makeUserFilter(req.body);
                result = await userService.adminGetAllUsers(filter, page, perPage, ['id', "first_name", "last_name", "email", 'status', 'phone', 'role', 'created_at', "updated_at", 'email_verified']);
            }
            result = await XlsUtil.exportXlClients(result.data)
            res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.attachment('clients.xlsx');
            log.info(`End post createEXELClientsFile:${JSON.stringify(result)}`);
            res.send(result);
        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }

    },

    getUserById: async(req, res) => {
        log.info(`Start getUserById data:${JSON.stringify(req.body)}`)
        try {
            const id = req.params.id;
            let user = await userService.getUserDetails(id, null,true);
            if(user && !user.admin_sign && user.signature_request_id) {
                user.signing_url = 'https://app.hellosign.com/sign/' + user.signature_request_id;
            }
            log.info(`End getUserById data:${JSON.stringify(user)}`)
            return res.status(200).json(user);

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: 400
            });

        }
    },

    saveUser: async(req, res) => {
        log.info(`Start saveUser data:${JSON.stringify(req.body)}`)
        let { first_name, last_name, email, phone, role, status, id, password, confirm_password,
            father_name, address, apartment, house, street,inn,num_passport,is_private,
            birthday_date,
            contract_id,
        } = req.body;
        let transaction = await sequelize.transaction();
        if(!status) status = config.GLOBAL_STATUSES.WAITING;
        if (id) {
            if (!first_name && !last_name && !email && !phone && !role && status && id) {
                try {

                    let user = await userService.getUserDetails(id, [
                        'id', 'status',
                    ]);
                    if (!user) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                        });

                    }
                    let userObj = {
                        status: status,
                        updated_at: new Date()
                    };

                    await models.user.update(userObj, { where: { id: id }, transaction });

                    await adminChangesHistoryService.adminCreateHistory({
                        item_id: id,
                        user_id: req.userid,
                        type: 'user'
                    }, transaction);
                    await transaction.commit();
                    log.info(`End saveUser updated`)
                    let result = await userService.getUserDetails(id, ['id', "first_name", "last_name", "email", 'status', 'phone', 'role', 'created_at', "updated_at", 'email_verified','contract_id']);
                    return res.status(200).json(result);
                } catch (error) {
                    log.error(error);
                    if (transaction) await transaction.rollback();
                    return res.status(400).json({
                        message: error.message,
                        errCode: '400'
                    });
                }

            }

                if (!first_name || !last_name || !phone || !role || !status || !email) {
                    if (transaction) await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                        message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                        errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });

                }
            try {
                if (email) {
                    if (!config.REGEX_EMAIL.test(email)) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                    let regexp = /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
                    if (!regexp.test(email)) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                        });
                    }
                    let isEmailExist = await userService.getUser({ email }, false);
                    if (isEmailExist && isEmailExist.id != id) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_USER_EMAIL_EXIST.code).json({
                            message: errors.BAD_REQUEST_USER_EMAIL_EXIST.message,
                            errCode: errors.BAD_REQUEST_USER_EMAIL_EXIST.code,
                        });
                    }
                    const phoneExist = await userService.getUser({ phone: phone }, [
                        "id",
                    ]);
                    if (phoneExist && phoneExist.id != id) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_USER_PHONE_EXIST.code).json({
                            message: errors.BAD_REQUEST_USER_PHONE_EXIST.message,
                            errCode: errors.BAD_REQUEST_USER_PHONE_EXIST.code,
                            errPlace: 'phone'
                        });
                    }
                }
                if (password) {
                    if(password != confirm_password) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code).json({
                            message: errors.BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.message,
                            errCode: errors.BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code,
                        });
                    }
                    if (!config.REGEX_PASSWORD.test(password)) {
                        if (transaction) await transaction.rollback();
                        return res.status(errors.BAD_REQUEST_USER_PASSWORD_NOT_VALID.code).json({
                            message: errors.BAD_REQUEST_USER_PASSWORD_NOT_VALID.message,
                            errCode: errors.BAD_REQUEST_USER_PASSWORD_NOT_VALID.code,
                        });
                    }
                }

                let user = await userService.getUserDetails(id, ['id', "first_name", "last_name", "email", 'status', 'phone', 'role', 'created_at', "updated_at", 'email_verified','contract_id']);
                if (!user) {
                    if (transaction) await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                        message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                        errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                    });

                }
                let userObj = {
                    role,
                    status: status,
                    updated_at: new Date(),
                    first_name: first_name,
                    last_name: last_name,
                    contract_id: contract_id ? contract_id: null
                    // email: email,
                    // phone: phone,
                };
                if(role === config.CLIENT_ROLE) {
                    userObj.father_name = father_name;
                    userObj.address = address;
                    userObj.apartment = apartment;
                    userObj.house = house;
                    userObj.street = street;
                    userObj.birthday_date = birthday_date;
                    userObj.inn = inn;
                    userObj.num_passport = num_passport;
                    userObj.is_private = is_private ? 2 :1;
                }
                if(!contract_id || contract_id != user.contract_id) {
                    userObj.user_sign = null;
                    userObj.admin_sign = null;
                    userObj.signature_request_id = null;
                }
                if(role == config.SUPER_ADMIN_ROLE || role == config.DESIGNER_ROLE) {
                    userObj.phone = phone;
                } else if(role == config.CLIENT_ROLE){
                    userObj.email = email;
                }
                if(father_name) userObj.father_name = father_name;
                if(birthday_date) userObj.birthday_date = birthday_date;

                if(password) {
                    let cognitoName;
                    if(role == config.SUPER_ADMIN_ROLE || role == config.DESIGNER_ROLE) {
                        cognitoName = user.email;
                    } else if(role == config.CLIENT_ROLE){
                        cognitoName = user.phone.replace(/[()\s]/g, '');
                    }
                    await utilsCognito.setUserPasswordByAdminByPhone(cognitoName, password).catch((err) => {
                        if (err) {
                            log.error(`Failed to set user password, ${err.message}: ${cognitoName}`);
                            err.code = 400;
                            throw err;
                        }
                    });
                    await notificationService.createNotification(config.NOTIFICATION_TYPES.CHANGE_PASSWORD, user.id);
                    let mailObj = {
                        to: user.email,
                        subject: config.TEXTS[config.LANGUAGES[0]].password_recovery,
                        data: {
                            info: {
                                name: user.first_name,
                                password: password,
                                subject: config.TEXTS[config.LANGUAGES[0]].password_recovery,
                                text: config.TEXTS[config.LANGUAGES[0]].password_recovery_text,
                            },
                            lang: config.LANGUAGES[0]
                        }
                    };
                    await emailUtil.sendMail(mailObj, 'form-to-client');
                }

                if(!contract_id && user.contract_id || user.contract_id && contract_id != user.contract_id) {
                    let oldContract = await models.user_uploaded_files.findOne({where: {id: user.contract_id}});
                    await models.user_uploaded_files.destroy({where: {id: oldContract.id}, transaction});
                    await s3Util.deleteFile(oldContract);
                }

                await models.user.update(userObj, { where: { id: id }, transaction });

                await adminChangesHistoryService.adminCreateHistory({
                    item_id: id,
                    user_id: req.userid,
                    type: 'user'
                }, transaction);
                await transaction.commit();
                let signatureUrl;
                if(!user.contract_id && contract_id || user.contract_id && contract_id != user.contract_id) {
                    let contract = await models.user_uploaded_files.findOne({where: {id: contract_id}, raw:true});
                    signatureUrl = await helloSignUtil.signatureRequest(contract, user);
                }
                let result = await userService.getUserDetails(id, ['id', 'first_name', 'last_name', 'email', 'status', 'phone', 'role', 'created_at', 'updated_at', 'email_verified','contract_id','admin_sign','signature_request_id']);
                if(signatureUrl && signatureUrl.signature_request) {
                    await userService.updateUser({id: result.id},{signature_request_id: signatureUrl.signature_request.signature_request_id});
                    result.signing_url = signatureUrl.signature_request.signing_url;
                }
                if(result && !result.admin_sign && result.signature_request_id && !result.signing_url) {
                    result.signing_url = 'https://app.hellosign.com/sign/' + result.signature_request_id;
                }
                log.info(`End saveUser updated`);
                return res.status(200).json(result);
            } catch (error) {
                console.log(error);
                log.error(error)
                if (transaction) await transaction.rollback();
                return res.status(400).json({
                    message: error.message,
                    errCode: '400'
                });
            }
        } else {
                if (!first_name || !last_name || !phone || !role || !password || !confirm_password || !email) {
                    if (transaction) await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                        message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                        errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                    });
                }
            if (!config.REGEX_PASSWORD.test(password)) {
                if (transaction) await transaction.rollback();
                return res.status(errors.BAD_REQUEST_USER_PASSWORD_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_USER_PASSWORD_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_USER_PASSWORD_NOT_VALID.code,
                });
            }
            if (password != confirm_password) {
                if (transaction) await transaction.rollback();
                return res.status(errors.BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code).json({
                    message: errors.BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.message,
                    errCode: errors.BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code,
                });

            }
            if (!config.REGEX_PHONE.test(phone) || phone.length != 19) {
                if (transaction) await transaction.rollback();
                return res.status(errors.BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_USER_PHONE_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_USER_PHONE_NOT_VALID.code,
                });
            }
            if (email) {
                if (!config.REGEX_EMAIL.test(email)) {
                    if (transaction) await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                        message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                        errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                    });
                }
                let regexp = /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
                if (!regexp.test(email)) {
                    if (transaction) await transaction.rollback();
                    return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                        message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                        errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                    });
                }
            }
            let isUserPhoneExist = await userService.getUser({ phone }, ['phone']);
            if (isUserPhoneExist) {
                if (transaction) await transaction.rollback();
                return res.status(errors.BAD_REQUEST_USER_PHONE_EXIST.code).json({
                    message: errors.BAD_REQUEST_USER_PHONE_EXIST.message,
                    errCode: errors.BAD_REQUEST_USER_PHONE_EXIST.code,
                });

            }

            try {
                let data = {}
                if (role == config.SUPER_ADMIN_ROLE || role == config.DESIGNER_ROLE)
                {
                    data = {
                        username:email,
                        password:password
                    }
                }
                else
                {
                    data = {
                        username:phone.replace(/[()\s]/g, ''),
                        password:password
                    }
                }

                let userCognito = await utilsCognito.createUserCognito(data).catch((err) => {
                    if (err) {
                        if (transaction) transaction.rollback();
                        log.error(`Failed to create user, ${err.message}: ${data.username}`);
                        err.code = 400;
                        throw err;
                    }
                });

                await utilsCognito.confirmUser(data.username);

                let filter_phone
                if(phone){
                    filter_phone = phone.replace(/[- )(]/g,'')
                }
                let newUser = {
                    cognito_id:userCognito.userSub,
                    role,
                    status: config.GLOBAL_STATUSES.ACTIVE,
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    phone: phone,
                    filter_phone:filter_phone ? filter_phone : null,
                    contract_id: contract_id ? contract_id: null
                };
                if(role === config.CLIENT_ROLE) {
                    newUser.father_name = father_name;
                    newUser.address = address;
                    newUser.apartment = apartment;
                    newUser.house = house;
                    newUser.street = street;
                    newUser.birthday_date = birthday_date;
                    newUser.inn = inn;
                    newUser.num_passport = num_passport;
                    newUser.is_private = is_private ? 2 :1;
                }
                if(!contract_id) {
                    newUser.user_sign = null;
                    newUser.admin_sign = null;
                    newUser.signature_request_id = null;
                }

                let user = await models.user.create(newUser, {
                    transaction
                });
                let signatureUrl;
                await notificationService.createNotification(config.NOTIFICATION_TYPES.REGISTER, user.id);
                if(contract_id) {
                    let contract = await models.user_uploaded_files.findOne({where: {id: contract_id}});
                    signatureUrl = await helloSignUtil.signatureRequest(contract, user);
                }

                // let localToken = makeLocalToken();
                // await user.update({
                //     confirm_token: localToken.confirmToken,
                //     confirm_token_type: 'reset',
                //     confirm_token_expires: localToken.confirmTokenExpires,
                //     updated_at: new Date()
                // }, { transaction });
                let mailObjToClient = {
                    to: email,
                    subject: config.TEXTS[config.LANGUAGES[0]].register_congratulation_text,
                    data: {
                        info: {
                            subject: config.TEXTS[config.LANGUAGES[0]].register_congratulation_text,
                            name: first_name,
                            email: email,
                            phone: phone,
                            lang: config.LANGUAGES[0]
                        },
                        lang: config.LANGUAGES[0]
                    },
                };
                emailUtil.sendMail(mailObjToClient, "form-to-client");

                await transaction.commit();
                let result = await userService.getUserDetails(user.id, ['id', 'first_name', 'last_name', 'email', 'status', 'phone', 'role', 'created_at', 'updated_at', 'email_verified'])
                if(signatureUrl && signatureUrl.signature_request) {
                    await userService.updateUser({id: result.id},{signature_request_id: signatureUrl.signature_request.signature_request_id});
                    result.signing_url = signatureUrl.signature_request.signing_url;
                }
                log.info(`End saveUser created`);
                return res.status(200).json(result);
            } catch (error) {
                log.error(error)
                await transaction.rollback();
                return res.status(400).json({
                    message: error.message,
                    errCode: 400
                });

            }
        }

    },
    confirmUser: async(req, res) => {
        try {
            let email =  req.body.email
            let result =   await utilsCognito.confirmUser(email)
            return res.status(200).json(result)
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },


    passwordRecovery: async(req, res) => {
        log.info(`Start passwordRecovery data:${JSON.stringify(req.body)}`);
        let id = req.params.id;
        try {
            let user = await userService.getUser(id);
            if (!user) {
                return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                });
            }

            const password = generator.generate({
                length: 10,
                numbers: true,
                uppercase: true,
                lowercase: true,
                symbols: true
            });

            let phoneToCognito = user.phone.replace(/[()\s]/g, '');
            await utilsCognito.setUserPasswordByAdminByPhone(phoneToCognito, password).catch((err) => {
                if (err) {
                    log.error(`Failed to set user password, ${err.message}: ${phoneToCognito}`);
                    err.code = 400;
                    throw err;
                }
            });

            await notificationService.createNotification(config.NOTIFICATION_TYPES.PASSWORD_RECOVERY, user.id);

            let mailObj = {
                to: user.email,
                subject: config.TEXTS[config.LANGUAGES[0]].password_recovery,
                data: {
                    info: {
                        name: user.first_name,
                        password: password,
                        subject: config.TEXTS[config.LANGUAGES[0]].password_recovery,
                        text: config.TEXTS[config.LANGUAGES[0]].password_recovery_text,
                    },
                    lang: config.LANGUAGES[0]
                }
            };
            await emailUtil.sendMail(mailObj, 'form-to-client');

            log.info(`End passwordRecovery data:${JSON.stringify(true)}`)
            return res.status(200).json(true);

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },

    deleteUsers: async(req, res) => {
        log.info(`Start deleteUsers data:${JSON.stringify(req.body)}`)
        let { ids } = req.body;
        const updated_at = new Date();

        const transaction = await sequelize.transaction();
        try {
            let result = [];
            if (ids && ids.length) {
                for (let id of ids) {
                    let user = await models.user.findOne({ where: { id: id }, attributes: ['status', 'id','role','email','phone'], raw: true , transaction})

                    if (!user) {
                        return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                            message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                            errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                        });
                    }
                    if (user.status != config.GLOBAL_STATUSES.DELETED) {
                        await models.user.update({ status: config.GLOBAL_STATUSES.DELETED, updated_at: updated_at }, { where: { id: id } })

                        result.push({ id: id, basket: true });
                    } else {
                        await models.user.destroy({ where: { id: id }, transaction });
                        let username;
                        if(user.role == config.SUPER_ADMIN_ROLE || user.role == config.DESIGNER_ROLE) {
                            username = user.email;
                        } else {
                            username = user.phone.replace(/[()\s]/g, '');
                        }
                        await utilsCognito.deleteUser(username).catch((err) => {
                            if (err) {
                                log.error(`Failed to delete user, ${err.message}: ${username}`);
                                err.code = 400;
                                throw err;
                            }
                        });
                        result.push({ id: id, deleted: true })
                    }

                }
            }
            await transaction.commit();
            log.info(`End deleteUsers data:${JSON.stringify(result)}`)
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
    checkIsDataExist: async(req, res) => {
        log.info(`Start checkIsDataExist data:${JSON.stringify(req.body)}`)
        let { id, email, phone } = req.body;
        try {
            let result
            let return_value
            if (email) {
                result = await userService.findUsersByFilter({ email });
            } else if (phone) {
                result = await userService.findUsersByFilter({ phone });
            }
            if (id) {
                if (result && result.length && result.length === 1 && result[0].id == id) {
                    return_value = { isExist: false }
                } else if (result && result.length === 0) {
                    return_value = { isExist: false }
                } else return_value = { isExist: true }
            } else {
                if (result && result.length) {
                    return_value = { isExist: true }
                } else {
                    return_value = { isExist: false }
                }
            }
            log.info(`End checkIsDataExist data:${JSON.stringify(return_value)}`)
            return res.status(200).json(return_value)

        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },


}
