const express = require('express');
const router = express.Router();


const validateCheck = require('../middlewares/validate-check.middleware');
const { check } = require('express-validator');
const adminBlogController = require('../controllers/admin-blog.controller');
const config = require('../configs/config');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/saveNews', [ // Validate specific elements, sanitize them
        check('status').optional().isIn([config.GLOBAL_STATUSES.ACTIVE, config.GLOBAL_STATUSES.WAITING, config.GLOBAL_STATUSES.DUPLICATE_POST, ""]),
    ], validateCheck, 
    adminBlogController.saveNews)
    
    .post('/previewNews', adminBlogController.createNewsPreview)
    .post('/getAllNews', adminBlogController.getAllNews)
    .get('/getNews/:id', adminBlogController.getNewsById)
    .post('/deleteNews', adminBlogController.deleteNewsByIds)


module.exports = router;