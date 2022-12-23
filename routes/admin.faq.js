const express = require('express');
const router = express.Router();

const adminFaqController = require('../controllers/admin-faq.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
    .post('/getAllFaq',adminFaqController.getAllFaq)
    .post('/saveFaq',adminFaqController.saveFaq)
    .get('/getFaq/:id',adminFaqController.getFaq)
    .post('/deleteFaq',adminFaqController.deleteFaq)

    .post('/getAllReview',adminFaqController.getAllReview)
    .post('/saveReview',adminFaqController.saveReview)
    .get('/getReview/:id',adminFaqController.getReview)
    .post('/deleteReviews',adminFaqController.deleteReviews)

    .post('/getAllFaqCategory',adminFaqController.getAllFaqCategory)
    .post('/saveFaqCategory',adminFaqController.saveFaqCategory)
    .get('/getFaqCategory/:id',adminFaqController.getFaqCategory)
    .post('/deleteFaqCategory',adminFaqController.deleteFaqCategory)

module.exports = router;
