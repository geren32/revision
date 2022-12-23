const jwt = require('jsonwebtoken');
const { parseToken, refreshToken } = require('../utils/cognito-util');
const config = require('../configs/config');
const userService = require('../services/user.service');
const log = require('../utils/logger');
const { models } = require('../sequelize-orm')
module.exports =  {


    validateToken : function (userType) {

        return async function (req, res, next) {

            log.info(`Start verify admin token function`);
            let token = req.get('Authorization');
             if ( !token )
             {
                 if ( req.cookies && req.cookies['jwt']){
                     token = req.cookies['jwt'];
                 }
             }


            if (!token) {
                log.error(`No token in request`);
                let err = new Error('No token in request');
                err.code = 401;
                next(err);
                return;
            }
            let  session = await models.session.findOne({where:{ access_token: token } , raw:true});
            let user = await models.user.findOne({where: {id: session.id, role: config.SUPER_ADMIN_ROLE}});

                if (!user) {
                    log.error(`No admin find. Token ${token}`);
                    let err = new Error(`No admin find. Token ${token}`);
                    err.errorCode = 2;
                    err.code = 401;
                    next(err);
                    res.redirect('/auth/login')
                    return;
                }
            if (!user) {
                log.error(`No user in request`);
                let err = new Error('No user in request');
                err.code = 401;
                next(err);
                return;
            }
            req.userType = user ? user.role : null
            req.userid = user ? user.id : null
            try {

                const decoded = await parseToken(token);

                if (decoded) {
                    log.info(`Token verfied successfully: ${token}`);
                    res.setHeader('Authorization', token);
                    req.headers.userid = decoded.sub;
                    next();
                } else {

                    log.error(`Token not verified. Token ${token}`);
                    let err = new Error(`Token not verified. Token ${token}`);
                    err.code = 401;
                    next(err);

                    return;
                }
            } catch (err) {
                if (err.errorCode !== 3) {
                    log.error(`Token not verified. Token ${req.token}`);
                    let err = new Error(`Token not verified. Token ${req.token}`);
                    err.code = 401;
                    next(err);
                    return
                }
                session = await models.session.findOne({where:{ access_token: token } , raw:true});
                user = await models.user.findOne({where:{ id: session.user_id }});
                const newToken = await refreshToken(user.phone, session.refresh_token );

                if (newToken.errorCode == 4) {
                    log.error(`Refresh Token has expired`);
                    let err = new Error(`Refresh Token has expired`);
                    err.code = 401;
                    next(err);
                    return;
                } else {
                    const newDecoded = await parseToken(newToken.access_token);
                    if (newDecoded) {
                        log.info(`New token verfied successfully: ${newToken.access_token}`);
                        req.headers.userid = newDecoded.sub;
                        session = await models.session.findOne({where:{ access_token: token }});
                        await session.update({access_token:newToken.access_token,  refresh_token:newToken.refresh_token});
                        next();
                    } else {
                        log.error(`New token not verified. Token ${newToken}`);
                        let err = new Error(`New token not verified. Token ${newToken}`);
                        err.code = 401;
                        next(err);
                        return;
                    }
                }

            }
        }
    },







}
