const csurf = require('csurf')

const csrf = csurf({ cookie: true });

/**
 * CSRF protection middleware.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @return {Object}
 */
module.exports = async (req, res, next) => {
    if(req.cookies && req.cookies['XSRF-TOKEN']) req.body._csrf = req.cookies['XSRF-TOKEN'];
    if(req.cookies && req.cookies['XSRF-TOKEN']) req.headers['X-CSRF-Token'] = req.cookies['XSRF-TOKEN'];
   // csrf(req, res, next);
   // res.cookie('XSRF-TOKEN', req.csrfToken());
}
