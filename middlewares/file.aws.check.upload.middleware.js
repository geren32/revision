const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const log = require('../utils/logger');
const config = require('../configs/config');

aws.config.update({
    secretAccessKey : config.AWS_SECRET_ACCESS_KEY ,
    accessKeyId : config.AWS_ACCESS_KEY_ID ,
    region :config.AWS_REGION_NAME
});

const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {

    log.info(`Start uploading file to S3. File: ${JSON.stringify(file)}`);

    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        let err = new Error(`Invalid file type, only JPEG and PNG is allowed!`);
        err.code = 400;
        cb(err, false);
    }
};



const uploadAWS =  multer({
    fileFilter: fileFilter,
    storage: multerS3({
       // acl: 'public-read',
        s3,
        bucket: config.AWS_BUCKET_NAME,
        key: function (req, file, cb) {
            req.fileInfo = file
            req.file = file.originalname
            cb(null, file.originalname);
        }

    })
})

module.exports = uploadAWS;
