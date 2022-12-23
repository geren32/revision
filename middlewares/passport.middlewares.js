// const passport = require('passport');
// const jwt = require('jsonwebtoken');
// const config = require('../configs/config');
// const tokenUtil = require('../utils/token-util');
// const { getDataFromUserToReq } = require('../utils/extra-util');
// const { models } = require('../sequelize-orm');
//
// module.exports = async(req, res, next) => {
//     passport.authenticate('jwt', { session: false }, async(err, user, info) => {
//
//         if (!user && info && info.name === "TokenExpiredError" && info.message === "jwt expired") {
//
//
//             let token = req.cookies['jwt'];
//             if (!token) {
//                 res.redirect('/');
//                 return
//             }
//
//             let session = await models.session.findOne({ where: { access_token: token } })
//
//             if (!session) {
//                 res.redirect('/');
//                 return
//             }
//             if (session && session.refresh_token) {
//                 let user = await models.user.findOne({ where: { id: session.user_id }})
//                 jwt.verify(user.refresh_token, config.JWT_REFRESH_SECRET_ADMIN, {}, async(err) => {
//                     if (err) {
//                         res.redirect('/');
//                         return
//                     }
//                     const newToken = tokenUtil({ first_name: user.first_name, last_name: user.last_name, userid: user.id });
//                     await models.session.update({ access_token: newToken.access_token, refresh_token: newToken.refresh_token,user_id: user.id });
//                     res.cookie('jwt', newToken.access_token, { maxAge: config.TOKEN_LIFETIME });
//                     req.user = getDataFromUserToReq(user);
//                     return next();
//                 })
//             }
//
//         } else {
//             req.user = user;
//             return next();
//         }
//     })(req, res, next);
// }


const jwt = require('jsonwebtoken');
const { parseToken, refreshToken } = require('../utils/cognito-util');
const config = require('../configs/config');
const userService = require('../services/user.service');
const log = require('../utils/logger');
const { models } = require('../sequelize-orm')
module.exports =   async function (req, res, next) {
    log.info(`Start verify token function`);

    if (req.url && (req.url.indexOf("uploads") > -1 || req.url.indexOf("img") > -1 || req.url.indexOf("favicon.ico") > -1)) {
        return next()
    }

    let token = req.get('Authorization');
    if ( !token )
    {
        if ( req.cookies && req.cookies['jwt']){
            token = req.cookies['jwt'];
        }
    }
    if ( !token )
    {
        next();
        return;
    }
    let  session = await models.session.findOne({where:{ access_token: token } , raw:true});
    let  user = await models.user.findOne({where:{ id: session.user_id }});
    if (!user) {
        next();
    }
    req.userType = user ? user.role : null
    req.role = user ? user.role : null
    req.userid = user ? user.id : null
    req.user_name = user ? user.first_name : null
    req.first_name = user ? user.first_name : null
    try {
        const decoded = await parseToken(token);
        if (decoded) {
            log.info(`Token verfied successfully: ${token}`);
            res.cookie("jwt", token, { maxAge: config.TOKEN_LIFETIME });
            req.headers.userid = decoded.sub;
            next();
        } else {
            next();
            return;
        }
    } catch (err) {
        if (err.errorCode !== 3) {
            next();
            return
        }
        session = await models.session.findOne({where:{ access_token: token }});
        user = await models.user.findOne({where:{ id: session.user_id }});
        if (!user )
        {
            next();
            return;
        }
        const newToken = await refreshToken(user.phone, session.refresh_token );
        if (newToken.errorCode == 4) {
            next(err);
            return;
        } else {
            const newDecoded = await parseToken(newToken.access_token);
            if (newDecoded) {
                log.info(`New token verfied successfully: ${newToken.access_token}`);
                req.headers.userid = newDecoded.sub;
                session = await models.session.findOne({where:{ access_token: token }});
                await session.update({access_token:newToken.access_token,  refresh_token:newToken.refresh_token});
                res.cookie("jwt", newToken.access_token, { maxAge: config.TOKEN_LIFETIME });
                next();
            } else {
                next();
                return;
            }
        }

    }
}
