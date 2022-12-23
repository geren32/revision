const express = require('express');
const clientController = require('../controllers/client.controller');
const router = express.Router();
const checkClientMiddleware = require("../middlewares/check-client-role.middleware");
const passportMiddleware = require("../middlewares/passport.middlewares");

router

    .post('/liqPayCallBack',clientController.liqPayCallBack)
    .get('/thank_you/:order_id/:user_id/:payment_type/:service_id',  clientController.thankYou)
    .post('/thank_you/:order_id/:user_id/:payment_type/:service_id',  clientController.thankYou)
    .get('/cabinet/thank_you/:order_id/:user_id/:payment_type/:additional_id',checkClientMiddleware,clientController.thankYouCabinet)
    .post('/cabinet/thank_you/:order_id/:user_id/:payment_type/:additional_id', clientController.thankYouCabinet)
module.exports = router;
