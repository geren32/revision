const express = require('express');
const router = express.Router();

const adminServiceController = require('../controllers/admin-service.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
    //SERVICE
    .post('/saveService', adminServiceController.saveService)

    .get('/getService/:id', adminServiceController.getService)

    .post('/getAllServices',adminServiceController.getAllServices)

    .post('/deleteServices',adminServiceController.deleteServices)

    .post('/previewService',adminServiceController.previewService)


    //CATEGORY
    .post('/getAllServiceCategory',adminServiceController.getAllServiceCategory)

    .post ('/saveServiceCategory',adminServiceController.saveServiceCategory)

    .get ('/getServiceCategory/:id',adminServiceController.getServiceCategory)

    .post ('/deleteServiceCategory',adminServiceController.deleteServiceCategory)

    //COURTS
    .post('/saveCourt',adminServiceController.saveCourt)

    .get ('/getCourt/:id',adminServiceController.getCourt)

    .post('/getAllCourts',adminServiceController.getAllCourts)

    .post('/deleteCourts',adminServiceController.deleteCourts)


module.exports = router;
