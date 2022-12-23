const express = require('express');
const router = express.Router();

const adminUploadController = require('../controllers/admin-upload.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');
const { uploadPublicImage } = require('../utils/upload-util');
const uploadAWS = require('../middlewares/file.aws.upload.middleware');
// router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router
    .post('/uploadFile', uploadPublicImage.single('file'), adminUploadController.uploadFile)

    .post('/updateFile', adminUploadController.updateFile)

    .delete('/deleteFile/:id', adminUploadController.deleteFile)

    .post('/getAllFiles', adminUploadController.getAllFiles)

    .get('/getCountFiles', adminUploadController.getCountFiles)

    .post('/addCropFolder', adminUploadController.addCropFolder)

    .post('/uploadFileServiceDocument', uploadAWS.uploadAWS.single('file'), adminUploadController.uploadFileServiceDocumentService)

    .post('/uploadPDFDocument', uploadAWS.uploadAWSPDF.single('file'), adminUploadController.uploadFileServiceDocument)

    .get('/getServiceDocument', adminUploadController.getServiceDocument)

    .get('/downloadDocument/:id', adminUploadController.downloadDocument)


module.exports = router;
