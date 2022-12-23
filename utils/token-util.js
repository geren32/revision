const jwt = require('jsonwebtoken');

const config = require('../configs/config');


module.exports = (access_payload = {}) => {
    const access_token = jwt.sign(access_payload, config.JWT_SECRET_ADMIN, { expiresIn: config.ACCESS_TOKEN_LIFETIME });
    const refresh_token = jwt.sign({}, config.JWT_REFRESH_SECRET_ADMIN, { expiresIn: config.REFRESH_TOKEN_LIFETIME });

    return {
        access_token,
        refresh_token
    }
}

