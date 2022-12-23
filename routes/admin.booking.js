const express = require('express');
const router = express.Router();

const adminBookingController = require('../controllers/admin-booking.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');


// router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
  
    .post('/getAllOrders', adminBookingController.getAllOrders)
    .get('/getOrder/:id', adminBookingController.getBookingById)
    .post('/deleteOrders', adminBookingController.deleteBookingByIds)
    .post('/editOrder', adminBookingController.updateBookingById)

    .post('/createOrder',adminBookingController.createOrder)

    .post('/getUserByPhone',adminBookingController.getUserByPhone)
module.exports = router;
