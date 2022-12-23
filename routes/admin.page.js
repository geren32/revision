const express = require('express');
const router = express.Router();
const adminPageController = require('../controllers/admin-page.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router


    .post('/savePage', adminPageController.savePage)


.post('/previewPage', adminPageController.createPagePreview)

.post('/getAllPages', adminPageController.getAllPages)

.get('/getPage/:id', adminPageController.getPageById)

.post('/deletePages', adminPageController.deletePagesByIds)


module.exports = router;
