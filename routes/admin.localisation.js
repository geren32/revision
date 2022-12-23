const express = require('express');
const router = express.Router();


const localisationController = require('../controllers/admin-localisation-controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/editLocalisation', localisationController.editLocalisation)
    .get('/getLocalisation', localisationController.getLocalisation)



module.exports = router;
