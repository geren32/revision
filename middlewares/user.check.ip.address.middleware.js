
const requestIp = require('request-ip');
module.exports =   function(req, res, next) {


    req.ip_address = requestIp.getClientIp(req);
    next();

};
