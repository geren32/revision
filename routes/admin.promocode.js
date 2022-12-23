const express = require('express');
const router = express.Router();

const adminPromocodeController = require('../controllers/admin-promocode.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/get_all_promocodes', adminPromocodeController.getAllPromocodes)

.post('/save_promocode', adminPromocodeController.savePromocode)

.get('/get_promocode/:id', adminPromocodeController.getPromocodeById)

.post('/delete_promocodes', adminPromocodeController.deletePromocodes)

module.exports = router;