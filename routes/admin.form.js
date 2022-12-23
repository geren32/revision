const express = require('express');
const router = express.Router();

const adminFormController = require('../controllers/admin-form-page.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
    .post('/getForms', adminFormController.getForms)

.get('/getForm/:id', adminFormController.getFormById)

.put('/changeFormStatus', adminFormController.changeFormStatusById)

.post('/saveForm', adminFormController.updateFormById)

.post('/getFormComments', adminFormController.getFormComments)

.post('/deleteFormComments', adminFormController.deleteFormCommentsByIds)

module.exports = router;
