const config = require('../configs/config');

module.exports = async(req, res, next) => {
    if (req.user && req.user.userType && (req.user.userType === config.CLIENT_ROLE || req.user.userType === config.DESIGNER_ROLE|| req.user.userType === config.SUPER_ADMIN_ROLE || req.user.userType === config.DEALER_ROLE)) {
        return next();
    }
    // res.redirect('login');
    return res.redirect('/');
}
