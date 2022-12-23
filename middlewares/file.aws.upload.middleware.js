const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid');
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
    cb(null, true);
    // if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ||  file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    //     cb(null, true);
    // } else {
    //     let err = new Error(`Invalid file type, only JPEG and PNG is allowed!`);
    //     err.code = 400;
    //     cb(err, false);
    // }
};
const checkIssetImage = async (name,id) => {
    if(id) name = id + '-' + name;
    let result = await models.user_uploaded_files.findAll({
        where:{filename: name},
        raw:true
    });
    if (result && result.length)
    {
        let keyIterate = 0;
        if(result && result.length) {
            for (let item of result) keyIterate++
        }
        keyIterate++
        name = result[result.length - 1].id ? result[result.length - 1].id + '-' + name : name;
        return await checkIssetImage(name);
    }
    return name;
}
const checkPDF = async (name, num) => {
    let file_name = name;
    if(num) file_name = `${num}_` + file_name
    let result = await models.user_uploaded_files.findOne({
        where:{filename: file_name},
        raw:true
    });
    if (result)
    {
        num += 1;
        return await checkPDF(name, num);
    }
    return file_name;
}
const { models } = require('../sequelize-orm');

const uploadPrivateImageAWS =  multer({
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 1000 }, // 300 Mb
    storage: multerS3({
        // acl: 'public-read',
        s3,
        bucket: config.AWS_BUCKET_NAME,
        key:  async function (req, file, cb) {
            req.level = config.LVL_PERMISSIONS_IMAGE.private;
            let nameImage = await checkIssetImage(file.originalname, null);
            nameImage = uuid.v4() + nameImage;
            req.typeImage = file.fieldname ? file.fieldname : null;
            req.fileInfo = file;
            req.file = file.originalname;
            req.nameImage = nameImage;
            req.client_id = req.query.client_id ? req.query.client_id : req.userid;
            cb(null, `${req.client_id}/${req.level}/${nameImage}` );
        }

    })
})

const uploadAWS =  multer({
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 1000 }, // 300 Mb
    storage: multerS3({
        // acl: 'public-read',
        s3,
        bucket: config.AWS_BUCKET_NAME,
        key:  async function (req, file, cb) {
            // if (!req.query.level || !req.query.type ) {
            //     log.error(`not found in query level or type`);
            //     let err = new Error(`not found in query level or type`);
            //     err.errorCode = 2;
            //     err.code = 401;
            //     cb(err);
            //     return;
            // }
            req.level = config.LVL_PERMISSIONS_IMAGE.private;
            let nameImage = await checkIssetImage(file.originalname, req.body.order_id);
            req.typeImage = file.fieldname ? file.fieldname : null;
            req.fileInfo = file;
            req.file = file.originalname;
            req.nameImage = nameImage;
            req.client_id = req.query.client_id ? req.query.client_id : req.userid;
            cb(null, `${req.client_id}/${req.level}/${nameImage}` );
        }

    })
})
const uploadAWSNoValidUser =  multer({
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 1000 }, // 300 Mb
    storage: multerS3({
        // acl: 'public-read',
        s3,
        bucket: config.AWS_BUCKET_NAME,
        key:  async function (req, file, cb) {
            // if (!req.query.level || !req.query.type ) {
            //     log.error(`not found in query level or type`);
            //     let err = new Error(`not found in query level or type`);
            //     err.errorCode = 2;
            //     err.code = 401;
            //     cb(err);
            //     return;
            // }
            let ext = file.originalname.split('.');
            ext = ext[ext.length-1];
            req.level = config.LVL_PERMISSIONS_IMAGE.private;
            let nameImage = await checkIssetImage(uuid.v4() + '.' + ext);
            file.originalname = nameImage;
            // let nameImage = await checkIssetImage(file.originalname, req.body.order_id);
            req.typeImage = file.fieldname ? file.fieldname : null;
            req.fileInfo = file;
            req.file = file.originalname;
            req.nameImage = nameImage;
            req.client_id = null;
            cb(null, `all/${req.level}/${nameImage}` );
        }

    })
})
const uploadAWSPDF = multer({
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 1000 }, // 300 Mb
    storage: multerS3({
        s3,
        bucket: config.AWS_BUCKET_NAME,
        key: async function (req, file, cb) {
            req.level = config.LVL_PERMISSIONS_IMAGE.private;
            let nameImage = await checkPDF(file.originalname,0);
            req.typeImage = file.fieldname ? file.fieldname : null;
            req.fileInfo = file;
            req.file = file.originalname;
            req.nameImage = nameImage;
            let isDocumentPDF = /pdf/.test(file.mimetype);
            let user_id = req.body.user_id;
            if(!user_id) {
                req.body.user_id = req.query.user_id;
                user_id = req.query.user_id;
            }
            if(isDocumentPDF) {
                cb(null, `${user_id}/${req.level}/${nameImage}` );
            }
            let err = new Error('File extension not match');
            err.code = 400;
            return cb(err);
        }

    })
})

module.exports = {
    uploadAWS,
    uploadAWSPDF,
    uploadPrivateImageAWS,
    uploadAWSNoValidUser,
};
