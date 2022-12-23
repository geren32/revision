const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router
    //region Products
    .post('/getAllProducts', productController.getAllProducts)

    .get('/getCategories', productController.getCategories)

    //Create notify when the product will be available
    .post('/informUser', productController.informUser)

    .get('/deletefromInformAvailable/:email/:product_id',productController.deleteFromInformProductAvailability)

module.exports = router;
