const express = require('express');
const router = express.Router();

const adminConfigsController = require('../controllers/admin-configs.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
    .get('/getDashboard', adminConfigsController.getDashboard)

    .post('/sendHelpMessage', adminConfigsController.sendHelpMessage)

    .get('/getShopConfigs', adminConfigsController.getShopConfigs)

    .post('/saveShopConfigs', adminConfigsController.saveShopConfigs)
    
    .get('/getMapConfigs', adminConfigsController.getMapConfigs)

    .post('/saveMapConfigs', adminConfigsController.saveMapConfigs)
    
    .get('/siteIndexing/:value', adminConfigsController.siteIndexing)
    
    .get('/statusOfIndexing', adminConfigsController.statusOfIndexing)
    
    .get('/generateSitemap', adminConfigsController.generateSitemap)

    .get('/generateFeedFile', adminConfigsController.generateFeedFile)

    .get('/statusTestimonialsValidation', adminConfigsController.statusTestimonialsValidation)
    .get('/changeTestimonialsValidation/:value', adminConfigsController.changeTestimonialsValidation)
    
module.exports = router;
