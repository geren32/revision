const express = require('express');
const router = express.Router();
const cartProductsMiddleware = require('../middlewares/cart-products.middleware');
const bookingController = require('../controllers/booking.controller');
const {uploadAWSNoValidUser} = require('../middlewares/file.aws.upload.middleware')
router


    .get('/getCurrentCart', cartProductsMiddleware, bookingController.getCurrentCart)

    .post('/createOrder',uploadAWSNoValidUser.array('files'),bookingController.createOrder)

    .post('/preCreateOrder',bookingController.preCreateOrder)

    .post('/validatePhoneAndEmail',bookingController.validatePhoneAndEmail)

    .get('/getFileOrders/:order_id',bookingController.getFileOrders)

    .get('/getPreFileOrders/:file_id',bookingController.getPreFileOrders)

    .post('/getCourt',bookingController.getCourtForService)

    .post('/createOrderAdditional',bookingController.createOrderAdditional)



module.exports = router;
