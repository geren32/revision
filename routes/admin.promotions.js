const express = require('express');
const router = express.Router();

const adminPromotionsController = require('../controllers/admin-promotions.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');


router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
    .post('/saveLabel', adminPromotionsController.saveLadel)
    .post('/getAllLabels', adminPromotionsController.getAllLadels)
    .get('/getLabel/:id', adminPromotionsController.getLadelById)
    .post('/deleteLabels', adminPromotionsController.deleteLabelsByIds)

    .post('/savePromotion', adminPromotionsController.savePromotion)
    .post('/getAllPromotions', adminPromotionsController.getAllPromotions)
    .get('/getPromotion/:id', adminPromotionsController.getPromotionById)
    .post('/deletePromotions', adminPromotionsController.deletePromotionByIds)
    .post('/createPromotionPreview', adminPromotionsController.createPromotionPreview)


module.exports = router;
