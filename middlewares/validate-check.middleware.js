const { validationResult } = require('express-validator');

// Middleware to reject request if validation errors are present
module.exports = async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({error: errors.array()});
    }
    next();
}
