const express = require('express');
const router = express.Router();

const adminUploadController = require('../controllers/admin-upload.controller');
const { uploadPublicImage } = require('../utils/upload-util');
const uploadAWS = require('../middlewares/file.aws.upload.middleware');

router
    .post('/uploadFileServiceDocument', uploadAWS.uploadAWS.single('document'), adminUploadController.uploadFileServiceDocumentService)

    .get('/getServiceDocument', adminUploadController.getServiceDocument)

module.exports = router;
