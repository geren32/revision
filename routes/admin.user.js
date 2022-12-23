const express = require('express');
const router = express.Router();


const validateCheck = require('../middlewares/validate-check.middleware');
const { check } = require('express-validator');
const adminUserController = require('../controllers/admin-user.controller');
const config = require('../configs/config');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');


router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router


    .post('/saveUser', [ // Validate specific elements, sanitize them
            //check('role').isIn([config.DEALER_ROLE, config.SUPER_ADMIN_ROLE, config.CLIENT_ROLE,config.DESIGNER_ROLE]),

        ],
        validateCheck,
        adminUserController.saveUser)

    .post('/getAllUsers', [ // Validate specific elements, sanitize them
            // check('type').isIn([config.SR_MANAGER_ROLE, config.DIALER_ROLE, config.SUPER_ADMIN_ROLE, config.CLIENT_ROLE]),
            //  check('status').isIn(["all", config.GLOBAL_STATUSES.WAITING, config.GLOBAL_STATUSES.ACTIVE, config.GLOBAL_STATUSES.BLOCKED, config.GLOBAL_STATUSES.DELETED]),
        ],
        validateCheck,
        adminUserController.getAllUsers)

    .get('/getUser/:id', adminUserController.getUserById)

    .post('/checkIsDataExist', adminUserController.checkIsDataExist)

    .post('/deleteUsers', adminUserController.deleteUsers)

    .get('/passwordRecovery/:id', adminUserController.passwordRecovery)

    .post('/createEXELClientFile', adminUserController.createEXELClientsFile)





module.exports = router;
