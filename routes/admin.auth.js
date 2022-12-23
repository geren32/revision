const express = require('express');
const router = express.Router();

const validateCheck = require('../middlewares/validate-check.middleware');
const { check } = require('express-validator');
const controller = require('../controllers/auth-admin.controller');
const config = require('../configs/config');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');



router

//     .get('/test', validateTokenMiddleware, (req, res) => { res.json({ message: 'SUCCESS', userid: req.userid, type: req.userType }) })
//
// .post('/register', [ // Validate specific elements, sanitize them
//         check('email').exists().trim().isEmail().withMessage('Invalid email'),
//         check('role').not().isEmpty().isIn([config.SUPER_ADMIN_ROLE]),
//         // check('password').exists().matches(/^(?=^[^\s]{8,16}$)(?=.*\d.*)(?=.*[a-z].*)(?=.*[A-Z].*)(?=.*[!@#$%^&*()_\-+=]).*$/)
//         check('password').exists().matches(/^[0-9a-zA-Z!@#$%^&*]{6,}$/)
//         .trim()
//         .withMessage('Password mismatch pattern'),
//     ],
//     validateCheck,
//
//     controller.createAdmin)

.post('/login', [ // Validate specific elements, sanitize them
        check('email').exists().trim().isEmail().withMessage('Invalid email'),
        check('password').exists().matches(/^(?=^[^\s]{6,16}$)(?=.*[a-z].*)(?=.*[A-Z].*).*$/)
        // check('password').exists().matches(/^[0-9a-zA-Z!@#$%^&*]{6,}$/)
        .trim()
        .withMessage('Password mismatch pattern'),
    ],
    validateCheck,

    controller.adminLogin)

.get('/refresh', controller.refresh)

.get('/logout', validateTokenMiddleware, controller.logout)


module.exports = router;
