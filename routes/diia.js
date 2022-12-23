const express = require('express');
const clientController = require('../controllers/client.controller');
const router = express.Router();
const { uploadPublicImage } = require('../utils/upload-util');
router
    .post('/callBack',uploadPublicImage.single('encodeData'), clientController.DiaCallBack)
    .get('/callBack',clientController.DiaCallBack)



    .get('/SignCallBack', clientController.SignCallBack)
    .post('/SignCallBack', clientController.SignCallBack)


module.exports = router;
