const { models } = require('../sequelize-orm');
const config = require('../configs/config');
const jwt = require('jsonwebtoken');
const log = require('../utils/logger');
const { parseToken, refreshToken } = require('../utils/cognito-util');
module.exports = async(req, res, next) => {
    let token = null;

    if (req.url && (req.url.indexOf("uploads") > -1 || req.url.indexOf("img") > -1 || req.url.indexOf("favicon.ico") > -1)) {
       return next()
    }
    token = req.get('Authorization');
    if (!token && req && req.cookies && req.cookies['jwt']){
        token = req.cookies['jwt'];
    }

    if (token) {
        let session = await models.session.findOne({where:{access_token: token}})
        if(session && session.user_id){
            const user = await models.user.findOne({
                where: { id: session.user_id },
            });

            if(user){
                try {
                    const decoded = await parseToken(token);
                    if (decoded) {
                        req.user = {
                            userid: user.id,
                            userType: user.role
                        };
                    } else {
                        return next();
                        // res.cookie("jwt", "", { maxAge: 0 });
                    }
                } catch (e) {
                    return next();
                    // res.cookie("jwt", "", { maxAge: 0 });
                }

                // jwt.verify(token, config.JWT_SECRET_ADMIN, {}, async (err) => {
                //     if (err) {
                //         log.error(`${err}`);
                //         res.cookie("jwt", "", { maxAge: 0 });
                //     }else{
                //
                //         req.user = {
                //             userid: user.id,
                //             userType: user.role
                //         };
                //
                //     }
                // })
            }
        }


    }
    return next();
}
