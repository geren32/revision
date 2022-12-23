const express = require('express');
const router = express.Router();
const adminStatusController = require('../controllers/admin-status-controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');


// router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/saveOrderStatus', adminStatusController.saveOrderStatus)

    .post('/getAllOrderStatuses', adminStatusController.getAllOrderStatus)

    .get('/getOrderStatusById/:id', adminStatusController.getOrderStatusById)

    .post('/deleteOrderStatuses', adminStatusController.deleteOrderStatusByIds)


module.exports = router;
