const express = require('express');
const router = express.Router();

const adminMenuController = require('../controllers/admin-menu.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .get('/getHeaderFooter', adminMenuController.getHeaderFooter)

    .post('/saveHeaderFooter', adminMenuController.saveHeaderFooter)

    .post('/saveMenu', adminMenuController.saveMenu)

    .get('/getMenu', adminMenuController.getMenu)

module.exports = router;
