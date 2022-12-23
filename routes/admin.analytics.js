const express = require('express');
const router = express.Router();

const adminAnalyticsController = require('../controllers/admin-analytics.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');


router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/getSalesAnalytics', adminAnalyticsController.getSalesAnalytics)



    .post('/getUsersAnalytics', adminAnalyticsController.getUsersAnalytics)




module.exports = router;
