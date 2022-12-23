const express = require('express');
const router = express.Router();
const passportMiddleware = require('../middlewares/passport.middlewares')
const shopController = require('../controllers/shop-controller');


router

    .get('/getService/:id',shopController.getServiceById)

    .get('/catalog/:id', shopController.getCatalog)
/* ---------------------------------------------------------- *

 */
    .get('/getServiceCategory/:id', shopController.getCategoryById)

    .post('/getServiceCategory/:id', shopController.getCategoryByIdAjax)

module.exports = router;
