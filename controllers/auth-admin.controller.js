const tokenUtil = require('../utils/token-util');
const bcryptUtil = require('../utils/bcrypt-util');
const jwt = require('jsonwebtoken');
const {models} = require('../sequelize-orm')
const userService = require('../services/user.service');
const config = require('../configs/config');
const log = require('../utils/logger');
const errors = require('../configs/errors');
const utilsCognito = require ('../utils/cognito-util')
module.exports = {



    adminLogin: async(req, res) => {



        log.info(`Start post /adminLogin. Data: ${JSON.stringify(req.body.email)}`);
        const { email } = req.body;
        try {
            let user = await models.user.findOne({ where:{email:email, role: config.SUPER_ADMIN_ROLE} });
            if(user && user.blocked){
                log.error(`User is not Admin: ${user}`);
                let err = new Error('User Admin');
                err.code = 401;
                err.errorCode = 2;
                throw err;
            }

            let token = await utilsCognito.signInUserCognito(req.body, res).catch((err) => {
                if (err) {
                    log.error(`Failed to sign in user Admin, ${err.message}`);
                    err.code = 401;
                    throw err;
                }
            });


            if (user && token.access_token && token.refresh_token) {
                let data = {
                    access_token: token.access_token,
                    refresh_token: token.refresh_token
                };
                await models.session.create({user_id:user.id, access_token: token.access_token , refresh_token:token.refresh_token});
                res.setHeader('Authorization', token.access_token);
                // res.cookie("jwt", token.access_token, { maxAge: config.TOKEN_LIFETIME });
                log.info(`End post /adminLogin. Data: true`);
                return res.json({access_token: token.access_token, id: user.id, role: user.role});

            } else {
                log.error(`Failed to login user Admin: ${email}`);
                let err = new Error(`Failed to login user Admin: ${email}`);
                err.errorCode = 1;
                err.code = 401;
                throw err;
            }
        } catch (err) {
            log.error(err)
            return res.status(400).json({
                message: err.message,
                errCode: 400
            });

        }
        // log.info(`Start adminLogin data:${JSON.stringify(req.body)}`)
        // try {
        //     let { email, password } = req.body;
        //     const admin = await userService.getUser({ email });
        //     if (!admin) {
        //         return res.status(400).json({
        //             message: errors.BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.message,
        //             errCode: errors.BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.code
        //         });
        //
        //     }
        //     const isPasswordMatch = await bcryptUtil.comparePassword(password, admin.password);
        //     if (!isPasswordMatch) {
        //         return res.status(400).json({
        //             message: errors.BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.message,
        //             errCode: errors.BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.code
        //         });
        //
        //     }
        //     if (admin.role != config.SUPER_ADMIN_ROLE) {
        //         return res.status(400).json({
        //             message: errors.BAD_REQUEST_WRONG_USER_ROLE.message,
        //             errCode: errors.BAD_REQUEST_WRONG_USER_ROLE.code
        //         });
        //
        //     }
        //     const token = tokenUtil({ first_name: admin.first_name, last_name: admin.last_name, userid: admin.id });
        //     await admin.update({ access_token: token.access_token, refresh_token: token.refresh_token });
        //     res.setHeader('Authorization', token.access_token);
        //
        //     log.info(`End adminLogin data:${JSON.stringify(token.access_token)}`)
        //     return res.status(200).json({
        //         access_token: token.access_token,
        //     });
        //
        // } catch (err) {
        //     log.error(err)
        //     return res.status(400).json({
        //         message: err.message,
        //         errCode: 400
        //     });
        //
        // }
    },

    logout: async(req, res) => {
        log.info(`Start logout data:${JSON.stringify(req.body)}`)
        try {
            const token = req.get('Authorization');
            const user = await userService.getUser({ access_token: token });
            if (!user) {
                return res.status(401).json({
                    message: errors.NOT_FOUND_USER.code,
                    errCode: 401
                });

            }
            await user.update({ access_token: '', refresh_token: '', updated_at: Math.floor(new Date().getTime() / 1000) });
            log.info(`End logout data:${JSON.stringify(true)}`)
            return res.status(200).json(true);

        } catch (err) {
            log.error(err)
            return res.status(400).json({
                message: error.message,
                errCode: 400
            });

        }
    },

    refresh: async(req, res) => {
        log.info(`Start refresh data:${JSON.stringify(req.body)}`)
        // const token = req.get('Authorization');
        const token = req.headers['authorization'];
        try {
            // const user = await userService.getUser({ access_token: token });
            if(!token) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_TO_REFRESH_TOKEN.message,
                    errCode: errors.BAD_REQUEST_TO_REFRESH_TOKEN.code
                });
            }
            const session = await models.session.findOne({where:{ access_token: token }});
            if (!session) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ACCESS_TOKEN_INVALID.message,
                    errCode: errors.BAD_REQUEST_ACCESS_TOKEN_INVALID.code
                });
            }
            let userInfo = await userService.getUser({ id: session.user_id });
            if (session && session.refresh_token) {
                const newToken =  await utilsCognito.refreshToken(userInfo.email, session.refresh_token)
                await models.session.update({ access_token: newToken.access_token, refresh_token: newToken.refresh_token },{where:{ id: session.id }});
                // await session.update({
                //     access_token: newToken.access_token,
                //     refresh_token: newToken.refresh_token,
                //     // updated_at: Math.floor(new Date().getTime() / 1000)
                // });
                // res.setHeader('Authorization', newToken.access_token);
                log.info(`End refresh data:${JSON.stringify(newToken.access_token)}`)
                return res.status(200).json({
                    access_token: newToken.access_token,
                });

            } else {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_TO_REFRESH_TOKEN.message,
                    errCode: errors.BAD_REQUEST_TO_REFRESH_TOKEN.code
                });
            }

        } catch (err) {
            log.error(err)
            return res.status(400).json({
                message: `Error to refresh token: ${err.message} `,
                errCode: 400
            });
        }
    },


    // createAdmin: async(req, res) => {
    //     log.info(`Start createAdmin data:${JSON.stringify(req.body)}`)
    //     try {
    //         let { first_name, last_name, email, password, role } = req.body;
    //         const isEmailExist = await userService.getUser({ email });
    //         if (isEmailExist) {
    //             return res.status(403).json({
    //                 message: errors.BAD_REQUEST_USER_EMAIL_EXIST.message,
    //                 errCode: 403
    //             });
    //
    //         }
    //         const hashedPassword = await bcryptUtil.hashPassword(password);
    //         const admin = await userService.createUser({
    //             email,
    //             password: hashedPassword,
    //             role,
    //             status: config.GLOBAL_STATUSES.ACTIVE,
    //             first_name,
    //             last_name
    //         });
    //         log.info(`End createAdmin data:${JSON.stringify(admin)}`)
    //         return res.status(200).json(admin);
    //
    //     } catch (err) {
    //         log.error(err)
    //         return res.status(400).json({
    //             message: err.message,
    //             errCode: 400
    //         });
    //
    //     }
    // },






}
