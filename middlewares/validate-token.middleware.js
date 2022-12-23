// const jwt = require('jsonwebtoken');
//
// const config = require('../configs/config');
// const userService = require('../services/user.service');
//
//
// module.exports = async(req, res, next) => {
//     const token = req.get('Authorization');
//     //const token = req.cookies['jwt'];
//
//     // if (!token) {
//     //     return res.status(401).json({
//     //         message: 'The access token is not provided in the "Authorization" header',
//     //         errCode: 4011
//     //     });
//     //     // next(err);
//
//     // }
//     // let user;
//     // try {
//     //     jwt.verify(token, config.JWT_SECRET_ADMIN, {}, (err) => {
//     //         if (err) {
//     //             let error = new Error(err.message);
//     //             error.code = 400;
//     //             throw error;
//     //         }
//     //     });
//     //     user = await userService.getUser({ access_token: token })
//     //     if (!user) {
//     //         return res.status(401).json({
//     //             message: 'The access_token provided is invalid',
//     //             errCode: 4012
//     //         });
//     //         // next(err);
//
//     //     }
//     //     res.setHeader('Authorization', token);
//     //     req.userType = user.role;
//     //     req.userid = user.id;
//
//     //     next();
//
//
//     // } catch (error) {
//     //     return res.status(401).json({
//     //         message: 'The access_token provided is invalid',
//     //         errCode: 4013
//     //     });
//
//     // }
//
//
//
//
//
//
//
//
//     if (!token) {
//         return   res.status(401).json({
//                message: 'The access token is not provided in the "Authorization" header',
//                errCode: 4011
//            });
//            // next(err);
//
//        }
//        let session;
//     try {
//         jwt.verify(token, config.JWT_SECRET_ADMIN, {}, (err) => {
//             if (err) {
//                 let error = new Error(err.message);
//                 error.code = 400;
//                 throw error;
//             }
//         });
//         session = await userService.getSessionByFilter({access_token: token})
//         if (!session) {
//             return  res.status(401).json({
//                 message: 'The access_token provided is invalid',
//                 errCode: 4012
//             });
//         }
//         let user = await userService.getUser({ id: session.user_id })
//         res.setHeader('Authorization', token);
//         req.userType = user.role;
//         req.userid = user.id;
//
//         next();
//
//
//     } catch (error) {
//         return res.status(401).json({
//             message: 'The access_token provided is invalid',
//             errCode: 4013
//         });
//
//     }
//
//
//
//
//     /*try {
//         jwt.verify(token, config.JWT_SECRET_ADMIN, {}, (err) => {
//             if (err) {
//                 let error = new Error(err.message);
//                 error.code = 400;
//                 throw error;
//             }
//         });
//         user = await userService.getUser({ access_token: token });
//         if (!user) {
//             res.status(401).json({
//                 message: 'No user find with this token',
//                 errCode: 401
//             });
//             // next(err);
//             return;
//         }
//         //res.setHeader('Authorization', token);
//         req.userType = user.role;
//         req.userid = user.id;
//
//         next();
//
//
//     } catch (error) {
//
//
//         user = await userService.getUser({ access_token: token });
//         if (!user) {
//             res.status(401).json({
//                 message: 'No user find with this token',
//                 errCode: 401
//             });
//             // next(err);
//             return;
//         }
//         if (user && user.refresh_token) {
//             jwt.verify(user.refresh_token, config.JWT_REFRESH_SECRET_ADMIN, {}, async (err) => {
//                 if (err) {
//                     res.status(401).json({
//                         message: 'Refresh token has expired',
//                         errCode: 401
//                     });
//                     return;
//                 }
//                 const newToken = tokenUtil({first_name: user.first_name, last_name: user.user_info.last_name});
//                 await user.update({ access_token: newToken.access_token, refresh_token: newToken.refresh_token });
//                 //res.setHeader('Authorization', newToken.access_token);
//                 res.cookie('jwt', newToken.access_token, { maxAge: config.TOKEN_LIFETIME });
//                 req.userType = user.role;
//                 req.userid = user.id;
//
//                 next();
//
//             })
//         }
//     }*/
//
//
//
//
//
// }



const jwt = require('jsonwebtoken');
const { parseToken, refreshToken } = require('../utils/cognito-util');
const config = require('../configs/config');
const userService = require('../services/user.service');
const log = require('../utils/logger');
const { models } = require('../sequelize-orm')
module.exports =  async (req, res, next) => {
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
    if (!session) {
        log.error(`No user in request`);
        let err = new Error('No user in request');
        err.code = 401;
        next(err);
        return;
    }
    let user = await models.user.findOne({where: {id: session.user_id, role: [config.SUPER_ADMIN_ROLE, config.DESIGNER_ROLE]}});
    if (!user) {
        log.error(`No admin find. Token ${token}`);
        let err = new Error(`No admin find. Token ${token}`);
        err.errorCode = 2;
        err.code = 401;
        next(err);
        res.redirect('/auth/login')
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

        log.error(`Token not verified. Token ${req.token}`);
        let error = new Error(`Token not verified. Token ${req.token}`);
        error.code = 401;
        return next(error);

        // if (err.errorCode !== 3) {
        //     log.error(`Token not verified. Token ${req.token}`);
        //     let err = new Error(`Token not verified. Token ${req.token}`);
        //     err.code = 401;
        //     next(err);
        //     return
        // }
        // session = await models.session.findOne({where:{ access_token: token }});
        // user = await models.user.findOne({where: {id: session.user_id, role: [config.SUPER_ADMIN_ROLE, config.DESIGNER_ROLE]}});
        // const newToken = await refreshToken(user.phone, session.refresh_token );
        //
        // if (newToken.errorCode == 4) {
        //     log.error(`Refresh Token has expired`);
        //     let err = new Error(`Refresh Token has expired`);
        //     err.code = 401;
        //     next(err);
        //     return;
        // } else {
        //     const newDecoded = await parseToken(newToken.access_token);
        //     if (newDecoded) {
        //         log.info(`New token verfied successfully: ${newToken.access_token}`);
        //         res.setHeader('Authorization', newToken.access_token);
        //         req.headers.userid = newDecoded.sub;
        //         session = await models.session.findOne({where:{ access_token: token }});
        //         await session.update({access_token:newToken.access_token,  refresh_token:newToken.refresh_token});
        //         res.cookie("jwt", newToken.access_token, { maxAge: config.TOKEN_LIFETIME })
        //         next();
        //
        //     } else {
        //         log.error(`New token not verified. Token ${newToken}`);
        //         let err = new Error(`New token not verified. Token ${newToken}`);
        //         err.code = 401;
        //         next(err);
        //         return;
        //     }
        // }

    }
}
