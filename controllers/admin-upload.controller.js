
const { Op } = require("sequelize");
const path = require("path");
const fs = require('fs');
const { models } = require('../sequelize-orm');
const { getMimeType } = require('stream-mime-type');
const uploadService = require('../services/upload.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { asyncResizeImage, asyncResizeImageToPath } = require('../utils/image-util');
const sizeOf = require('image-size');
const log = require('../utils/logger');
const AWS = require('aws-sdk');
const JSZip = require("jszip");
const bookingService = require("../services/booking.service");
const s3Util = require("../utils/s3-util");
AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION_NAME
});
const s3 = new AWS.S3();


module.exports = {

    uploadFile: async(req, res) => {
        log.info(`Start uploadFile data:${JSON.stringify(req.body)}`)
        let filePath;
        let filenameWebp = null;
        try {
        const languages = config.LANGUAGES;
        let originFile;
        let imgSize;
        const cropSettings = config.CROP_SETTINGS;
        if(req.query.type == '' || !req.query.type) req.query.type = null;

        if(req.query.id && req.query.file_type != 'document' && req.query.file_type != 'video'){
            let id = req.query.id;
            let languages = config.LANGUAGES;
            const lang = req.body.lang ? req.body.lang : languages[0];
            const filter = {
                [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
            };
            let result = await models.uploaded_files.findOne({ where: filter, raw: true });
            if(!result){
                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            if(result.file_type != 'image'){
                return res.status(400).json({
                    message: errors.BAD_REQUEST_INCORECT_FILE_TYPE.message,
                    errCode: errors.BAD_REQUEST_INCORECT_FILE_TYPE.code
                });
            }
            let originPath;
            if(result.type){
                originPath = path.join('public', 'uploads', result.type, `original`, result.filename );
            }else{
                originPath = path.join('public', 'uploads', `original`, result.filename );
            }

            if(result.type != req.query.type && fs.existsSync(originPath)){

                imgSize = sizeOf(originPath);
                let stats = fs.statSync(originPath);
                log.info('Before cropSettings')
                if(cropSettings[req.query.type]){
                    log.info(result.filename)
                    for (let setting of cropSettings[req.query.type]) {
                        let savePath = path.join('public', 'uploads', req.query.type, `${setting.width}X${setting.height}`, result.filename );
                        let savePathFolder = path.join('public', 'uploads', req.query.type, `${setting.width}X${setting.height}` );
                        fs.mkdirSync(savePathFolder, { recursive: true });
                        await asyncResizeImageToPath(originPath, savePath, setting.width, setting.height, setting.fit);
                    }
                    log.info('after create loop of folder to file')
                    let savePath = path.join('public', 'uploads', req.query.type, `admin`, result.filename );
                    let savePathFolder = path.join('public', 'uploads', req.query.type, `admin` );
                    log.info('after create admin crop version of file')
                    fs.mkdirSync(savePathFolder, { recursive: true });
                    if(imgSize.width < config.ADMIN_CROP_SETTINGS.width || imgSize.height < config.ADMIN_CROP_SETTINGS.width){
                        fs.createReadStream(originPath).pipe(fs.createWriteStream(savePath));
                    }else{
                        await asyncResizeImageToPath(originPath, savePath, config.ADMIN_CROP_SETTINGS.width, config.ADMIN_CROP_SETTINGS.height, config.ADMIN_CROP_SETTINGS.fit);
                    }
                    let saveOriginPath = path.join('public', 'uploads', req.query.type, `original`, result.filename );
                    let saveOriginPathFolder = path.join('public', 'uploads', req.query.type, `original` );
                    log.info('after create original crop version of file')
                    fs.mkdirSync(saveOriginPathFolder, { recursive: true });
                    fs.createReadStream(originPath).pipe(fs.createWriteStream(saveOriginPath));
                    let image_webp_status_config = await models.configs.findOne({ where: { type: 'image_webp_status' }, raw: true });
                    let image_webp_status = image_webp_status_config && image_webp_status_config.value ? image_webp_status_config.value : false;
                    if(image_webp_status)
                    {
                        filenameWebp = result.filename.split('.')
                        filenameWebp =  `${filenameWebp[0]}.webp`
                    }
                    for (let lang of languages) {
                        const dataImage = {
                            origin_id: originFile && originFile.id ? originFile.id : 0,
                            lang: lang,
                            type: req.query.type,
                            filename: result.filename,
                            filenameWebp: filenameWebp,
                            width: imgSize && imgSize.width ? imgSize.width : null,
                            height: imgSize && imgSize.height ? imgSize.height : null,
                            size: stats && stats.size ? stats.size : null,
                            file_type: 'image'
                        };
                        result = await models.uploaded_files.create(dataImage);
                        if (!originFile) originFile = result;
                    }

                }else{
                    const width = req.query.width ? parseInt(req.query.width) : null;
                    const height = req.query.height ? parseInt(req.query.height) : null;
                    const fit = req.query.fit ? req.query.fit : 'cover';

                    let isType = req.query.type ? true : false;
                    let savePath = isType
                        ? path.join('public', 'uploads', req.query.type, result.filename )
                        : path.join('public', 'uploads', result.filename );
                    let savePathFolder = isType
                        ? path.join('public', 'uploads', req.query.type )
                        : path.join('public', 'uploads');
                    let saveAdminPath = isType
                        ? path.join('public', 'uploads', req.query.type, `admin`, result.filename )
                        : path.join('public', 'uploads', `admin`, result.filename );
                    let saveAdminPathFolder = isType
                        ? path.join('public', 'uploads', req.query.type, `admin` )
                        : path.join('public', 'uploads', `admin` );
                    let saveOriginPath = isType
                        ? path.join('public', 'uploads', req.query.type, `original`, result.filename )
                        : path.join('public', 'uploads', `original`, result.filename );
                    let saveOriginPathFolder = isType
                        ? path.join('public', 'uploads', req.query.type, `original` )
                        : path.join('public', 'uploads', `original` );

                    fs.mkdirSync(savePathFolder, { recursive: true });
                    if(width || height){
                        await asyncResizeImageToPath(originPath, savePath, width, height, fit);
                    }else{
                        fs.createReadStream(originPath).pipe(fs.createWriteStream(savePath));
                    }
                    fs.mkdirSync(saveAdminPathFolder, { recursive: true });
                    if(imgSize.width < config.ADMIN_CROP_SETTINGS.width || imgSize.height < config.ADMIN_CROP_SETTINGS.width){
                        fs.createReadStream(originPath).pipe(fs.createWriteStream(saveAdminPath));
                    }else{
                        await asyncResizeImageToPath(originPath, saveAdminPath, config.ADMIN_CROP_SETTINGS.width, config.ADMIN_CROP_SETTINGS.height, config.ADMIN_CROP_SETTINGS.fit);
                    }
                    fs.mkdirSync(saveOriginPathFolder, { recursive: true });
                    fs.createReadStream(originPath).pipe(fs.createWriteStream(saveOriginPath));

                    let image_webp_status_config = await models.configs.findOne({ where: { type: 'image_webp_status' }, raw: true });
                    let image_webp_status = image_webp_status_config && image_webp_status_config.value ? image_webp_status_config.value : false;
                    if(image_webp_status)
                    {
                        filenameWebp = result.filename.split('.')
                        filenameWebp =  `${filenameWebp[0]}.webp`
                    }

                    for (let lang of languages) {
                        const dataImage = {
                            origin_id: originFile && originFile.id ? originFile.id : 0,
                            lang: lang,
                            type: req.query.type,
                            filename: result.filename,
                            filenameWebp:filenameWebp,
                            width: imgSize && imgSize.width ? imgSize.width : null,
                            height: imgSize && imgSize.height ? imgSize.height : null,
                            size: stats && stats.size ? stats.size : null,
                            file_type: 'image'
                        };
                        result = await models.uploaded_files.create(dataImage);
                        if (!originFile) originFile = result;
                    }
                }
            }else{
                originFile = result;
            }

        }else{

            const file = req.file;
            filePath = file.path;
            const fileName = path.basename(filePath);
            const width = req.query.width ? parseInt(req.query.width) : null;
            const height = req.query.height ? parseInt(req.query.height) : null;

            const type = config.UPLOAD_IMAGE_TYPES.includes(req.query.type) ? req.query.type : null;
            const fit = req.query.fit ? req.query.fit : 'cover';
            const file_type = req.query.file_type ? req.query.file_type : null;
            const fileType = req.uploaded_file_type;
            let result;


            if (file_type && file_type !== fileType) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_INCORECT_FILE_TYPE.message,
                    errCode: errors.BAD_REQUEST_INCORECT_FILE_TYPE.code
                });

            }

            let img;
            for (let lang of languages) {
                if (fileType === 'image') {
                    imgSize = sizeOf(filePath)

                    if(!img && type && cropSettings[type]){
                        for (let setting of cropSettings[type]) {
                            let savePath = path.join('public', 'uploads', type, `${setting.width}X${setting.height}`, fileName );
                            let savePathFolder = path.join('public', 'uploads', type, `${setting.width}X${setting.height}` );
                            fs.mkdirSync(savePathFolder, { recursive: true });
                            await asyncResizeImageToPath(filePath, savePath, setting.width, setting.height, setting.fit);
                        }
                        let savePath = path.join('public', 'uploads', type, `admin`, fileName );
                        let savePathFolder = path.join('public', 'uploads', type, `admin` );
                        fs.mkdirSync(savePathFolder, { recursive: true });
                        if(imgSize.width < config.ADMIN_CROP_SETTINGS.width || imgSize.height < config.ADMIN_CROP_SETTINGS.width){
                            fs.createReadStream(filePath).pipe(fs.createWriteStream(savePath));
                        }else{
                            await asyncResizeImageToPath(filePath, savePath, config.ADMIN_CROP_SETTINGS.width, config.ADMIN_CROP_SETTINGS.height, config.ADMIN_CROP_SETTINGS.fit);
                        }
                        img = true;
                    }
                    if (!img){
                        if(type){
                            let savePath = path.join('public', 'uploads', type, fileName );
                            let savePathFolder = path.join('public', 'uploads', type, `admin` );
                            fs.mkdirSync(savePathFolder, { recursive: true });
                            img = await asyncResizeImageToPath(filePath, savePath, width, height, fit);
                            savePath = path.join('public', 'uploads', type, `admin`, fileName );
                            savePathFolder = path.join('public', 'uploads', type, `admin` );
                            fs.mkdirSync(savePathFolder, { recursive: true });
                            if(imgSize.width < config.ADMIN_CROP_SETTINGS.width || imgSize.height < config.ADMIN_CROP_SETTINGS.width){
                                fs.createReadStream(filePath).pipe(fs.createWriteStream(savePath));
                            }else{
                                await asyncResizeImageToPath(filePath, savePath, config.ADMIN_CROP_SETTINGS.width, config.ADMIN_CROP_SETTINGS.height, config.ADMIN_CROP_SETTINGS.fit);
                            }
                        }else{
                            let savePath = path.join('public', 'uploads', fileName );
                            img = await asyncResizeImageToPath(filePath, savePath, width, height, fit);
                            savePath = path.join('public', 'uploads', `admin`, fileName );
                            let savePathFolder = path.join('public', 'uploads', `admin` );
                            fs.mkdirSync(savePathFolder, { recursive: true });

                            if(imgSize.width < config.ADMIN_CROP_SETTINGS.width || imgSize.height < config.ADMIN_CROP_SETTINGS.width){
                                fs.createReadStream(filePath).pipe(fs.createWriteStream(savePath));
                            }else{
                                await asyncResizeImageToPath(filePath, savePath, config.ADMIN_CROP_SETTINGS.width, config.ADMIN_CROP_SETTINGS.height, config.ADMIN_CROP_SETTINGS.fit);
                            }
                        }
                    }

                    let image_webp_status_config = await models.configs.findOne({ where: { type: 'image_webp_status' }, raw: true });
                    let image_webp_status = image_webp_status_config && image_webp_status_config.value ? image_webp_status_config.value : false;
                    if(image_webp_status)
                    {
                        filenameWebp = file.filename.split('.')
                        filenameWebp  =  `${filenameWebp[0]}.webp`
                    }

                    const dataImage = {
                        origin_id: originFile && originFile.id ? originFile.id : 0,
                        lang: lang,
                        type: type,
                        filenameWebp:filenameWebp,
                        filename: file.filename,
                        width: imgSize && imgSize.width ? imgSize.width : null,
                        height: imgSize && imgSize.height ? imgSize.height : null,
                        size: file && file.size ? file.size : null,
                        file_type: 'image'
                    };
                    result = await models.uploaded_files.create(dataImage);

                } else {
                    const dataFile = {
                        origin_id: originFile && originFile.id ? originFile.id : 0,
                        lang: lang,
                        type: type,
                        filename: file.filename,
                        size: file.size,
                        file_type: fileType
                    };
                    result = await models.uploaded_files.create(dataFile);
                }
                if (!originFile) originFile = result;
            }

        }
        log.info(`End uploadFile data:${JSON.stringify(originFile)}`)
            return res.status(200).json(originFile);
        } catch (error) {
            log.error('error-upload-file')
            log.error(`${error}`)
            if(filePath) fs.unlinkSync(filePath);
            return res.status(400).json(error.message);

        }
    },

    updateFile: async(req, res) => {
        log.info(`Start updateFile data:${JSON.stringify(req.body)}`)
        const id = req.body.id ? req.body.id : null;
        let languages = config.LANGUAGES;
        const lang = req.body.lang ? req.body.lang : languages[0];
        const alt_text = req.body.alt_text ? req.body.alt_text : null;
        const description = req.body.description ? req.body.description : null;
        const filter = {
            [Op.or]: [{ id: id, lang: lang }, { origin_id: id, lang: lang }]
        };
        try {
            const dataImage = {
                alt_text: alt_text,
                description: description
            };
            await models.uploaded_files.update(dataImage, { where: filter });
            const result = await models.uploaded_files.findOne({ where: filter });
            log.info(`End updateFile data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);

        }
    },

    deleteFile: async(req, res) => {
        log.info(`Start deleteFile data:${JSON.stringify(req.body)}`)
        const id = req.params.id;
        const cropSettings = config.CROP_SETTINGS;
        try {
            let filePath;
            const img = await models.uploaded_files.findByPk(id)
            if (!img) {

                return res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });
            }
            const result = await models.uploaded_files.destroy({
                where: {
                    [Op.or]: [{ id: id }, { origin_id: id }]
                }
            });


            if(img && img.type){
                if(cropSettings[img.type]){
                    for (let setting of cropSettings[img.type]) {
                        let imgCropPath = path.join('public', 'uploads', img.type, `${setting.width}X${setting.height}`, img.filename );
                        if (fs.existsSync(imgCropPath)) fs.unlinkSync(imgCropPath);
                        if(img.filenameWebp){
                            let imgCropPathWebP = path.join('public', 'uploads', img.type, `${setting.width}X${setting.height}`, img.filenameWebp );
                            if (fs.existsSync(imgCropPathWebP)) fs.unlinkSync(imgCropPathWebP);
                        }
                    }
                    let imgOriginPath = path.join('public', 'uploads', img.type, `original`, img.filename );
                    if (fs.existsSync(imgOriginPath)) fs.unlinkSync(imgOriginPath);
                    let imgAdminPath = path.join('public', 'uploads', img.type, `admin`, img.filename );
                    if (fs.existsSync(imgAdminPath)) fs.unlinkSync(imgAdminPath);
                    if(img.filenameWebp){
                        let imgOriginPathWebp = path.join('public', 'uploads', img.type, `original`, img.filenameWebp );
                        if (fs.existsSync(imgOriginPathWebp)) fs.unlinkSync(imgOriginPathWebp);
                        let imgAdminPathWebp = path.join('public', 'uploads', img.type, `admin`, img.filenameWebp );
                        if (fs.existsSync(imgAdminPathWebp)) fs.unlinkSync(imgAdminPathWebp);
                    }
                }

            }else{
                let imgPath = path.join('public', 'uploads', img.filename );
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                let imgOriginPath = path.join('public', 'uploads', `original`, img.filename );
                if (fs.existsSync(imgOriginPath)) fs.unlinkSync(imgOriginPath);
                let imgAdminPath = path.join('public', 'uploads', `admin`, img.filename );
                if (fs.existsSync(imgAdminPath)) fs.unlinkSync(imgAdminPath);
                if(img.filenameWebp){
                    let imgPathWebp = path.join('public', 'uploads', img.filenameWebp );
                    if (fs.existsSync(imgPathWebp)) fs.unlinkSync(imgPathWebp);
                    let imgOriginPathWebp = path.join('public', 'uploads', `original`, img.filenameWebp );
                    if (fs.existsSync(imgOriginPathWebp)) fs.unlinkSync(imgOriginPathWebp);
                    let imgAdminPathWebp = path.join('public', 'uploads', `admin`, img.filenameWebp );
                    if (fs.existsSync(imgAdminPathWebp)) fs.unlinkSync(imgAdminPathWebp);
                }
            }
            log.info(`End deleteFile data:${JSON.stringify(result)}`)
            return res.status(200).json(result);
        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);

        }
    },


    getAllFiles: async(req, res) => {
        log.info(`Start getAllFiles data:${JSON.stringify(req.body)}`)
        try {
            let typesCount = await uploadService.countFiles(req.body.lang);
            let images = await uploadService.getAllFiles(req.body);
            log.info(`End getAllFiles data:${JSON.stringify(typesCount,images)}`)
            return res.status(200).json({ count: images.count, data: images.rows, typesCount });
        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);
        }
    },
    getCountFiles: async(req, res) => {
        log.info(`Start getCountFiles data:${JSON.stringify(req.body)}`)
        try {
            let typesCount = await uploadService.countFiles(req.body.lang);
            log.info(`End getCountFiles data:${JSON.stringify(typesCount)}`)
            return res.status(200).json(typesCount);
        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);
        }
    },

    addCropFolder: async(req, res) => {
        log.info(`Start addCropFolder data:${JSON.stringify(req.body)}`)
        try {
            let { type, width, height, fit,offset,limit } = req.body;

            console.log("+++++++++++++++++++++++++++OFFSET AND LIMIT+++++++++++++++++++++++++++++++")
            console.log(offset)
            console.log(limit)
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

            if(offset != 0){
                if(!offset || !limit){
                    return res.status(400).json('some arg are missing');
                }
            }



            if (type) {
                let readFolderPath = path.join('public', 'uploads', type, 'original');
                if (readFolderPath) {
                    let files = fs.readdirSync(readFolderPath)
                    console.log(files)
                    if (files && files.length) {
                        for (let i = offset; i < limit + offset; i++) {
                            console.log(`File start add to new foler data:${JSON.stringify(files[i])}`)
                            let filePath = path.join('public', 'uploads', type, 'original', files[i]);
                            if (fs.statSync(filePath).isFile()) {
                                let savePath = path.join('public', 'uploads', type, `${width}X${height}`, files[i]);
                                let savePathFolder = path.join('public', 'uploads', type, `${width}X${height}`);
                                fs.mkdirSync(savePathFolder, { recursive: true });
                                await asyncResizeImageToPath(filePath, savePath, width, height, fit);
                                console.log(`File end add to new foler data:${JSON.stringify(savePath)}`)
                            }
                        }
                    }
                }
            } else {
                let readFolderPath = path.join('public', 'uploads', 'original');
                if (readFolderPath) {
                    let files = fs.readdirSync(readFolderPath)
                    console.log(files)
                    if (files && files.length) {
                        for (let i = offset; i < limit + offset; i++) {
                            console.log(`File start add to new foler data:${JSON.stringify(files[i])}`)
                            let filePath = path.join('public', 'uploads', 'original', files[i]);
                            if (fs.statSync(filePath).isFile()) {
                                let savePath = path.join('public', 'uploads', `${width}X${height}`, files[i]);
                                let savePathFolder = path.join('public', 'uploads', `${width}X${height}`);
                                fs.mkdirSync(savePathFolder, { recursive: true });
                                await asyncResizeImageToPath(filePath, savePath, width, height, fit);
                                console.log(`File end add to new foler data:${JSON.stringify(savePath)}`)
                            }
                        }
                    }
                }

            }
            log.info(`End addCropFolder data:${JSON.stringify(true)}`)
            return res.status(200).json(true);

        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);
        }
    },

    uploadFileServiceDocument: async (req, res) => {
        log.info(`Start uploadFile data:${JSON.stringify(req.body)}`);
        const file = req.file;
        try {
            if(req.query.type == '' || !req.query.type) req.query.type = null;
            req.userid = req.userid ? req.userid : req.body.user_id;
            let user_id = req.body.user_id;
            let result =  await models.user_uploaded_files.create({
                type: req.query.type,
                level: config.LVL_PERMISSIONS_IMAGE.private,
                user_id: req.body ? req.body.user_id : req.query.user_id,
                size: file && file.size ? file.size : null,
                filename: req.nameImage,
                file_type: req.fileInfo ? req.fileInfo.mimetype : null
            })
            log.info(`End uploadFile data:${JSON.stringify(result)}`)
            return res.status(200).json( result );
        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);

        }
    },
    downloadDocument: async (req, res) => {
        log.info(`Start uploadFile data:${JSON.stringify(req.params)}`);
        try {
            let result =  await models.user_uploaded_files.findOne({
                where:{id: req.params.id},
                raw:true
            })
            let order_id = await models.orders_to_user_uploaded_files.findOne({where:{user_uploaded_files_id:req.params.id},raw:true})
            let mass
            if(order_id && !order_id.hash_file){
                order_id = order_id.order_id
                mass = await models.orders_to_user_uploaded_files.findAll({where:{order_id:order_id},raw:true})
                if(mass && mass.length){
                    mass = mass.map(i =>i.user_uploaded_files_id)
                    mass = await models.user_uploaded_files.findAll({where:{id:{[Op.in]:mass}},raw:true})
                }
            }
            if(result && result.user_id && !mass)
            {
                const options = {
                    Bucket: config.AWS_BUCKET_NAME,
                    Key : `${result.user_id}/${result.level}/${result.filename}`,
                };

                let file =  await s3.getObject(options).promise();

                const { mime } = await getMimeType( file.Body );

                const fileStream = await s3.getObject(options).createReadStream();
                res.attachment(result.filename);
                res.set('Content-Type',mime)
                fileStream.pipe(res);
            }else if(result.type == 'files' && mass){
                const zip = new JSZip();
                    await Promise.all(mass.map(async item => {
                        zip.file(item.filename, await s3Util.getPreFileBuffer(item));
                    }));

                    res.set('Content-Type','application/zip');
                    res.attachment(`ЗАЯВА_${order_id}.zip`);
                    return zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                        .pipe(res)
                        .on('finish', function () {
                            console.log("sample.zip written.");
                        });
            } else if(result) {
                let key;
                if(result.user_id) {
                    key = `${result.user_id}/${result.level}/${result.filename}`
                } else key = `all/${result.level}/${result.filename}`
                const options = {
                    Bucket: config.AWS_BUCKET_NAME,
                    Key : key,
                };

                let file =  await s3.getObject(options).promise();

                const { mime } = await getMimeType( file.Body );

                const fileStream = await s3.getObject(options).createReadStream();
                res.attachment(result.filename);
                res.set('Content-Type',mime)
                fileStream.pipe(res);
            }
            else
            {
                // const file = new fs.ReadStream('./public/img/404.png');
                // res.set('Content-Type',"image/png");
                // file.pipe(res);
                return res.status(200).json({success: false});
            }
        } catch (error) {
            console.log(error,'3463473734764334746')
            log.error(error)
            return res.status(400).json(error.message);

        }
    },
    uploadFileServiceDocumentService: async (req, res) => {
        log.info(`Start uploadFile data:${JSON.stringify(req.body)}`)
        const file = req.file;
        try {
            if(req.query.type == '' || !req.query.type) req.query.type = null;
            req.userid = req.userid ? req.userid : req.body.user_id
            let result =  await models.user_uploaded_files.create({
                type: req.type,
                level: req.level,
                size: file && file.size ? file.size : null,
                user_id:  req.userid,
                filename: req.nameImage,
                file_type: req.fileInfo ? req.fileInfo.mimetype : null
            })
            log.info(`End uploadFile data:${JSON.stringify(result)}`)
            return res.status(200).json( result );
        } catch (error) {
            log.error(error)
            return res.status(400).json(error.message);

        }
    },

    getServiceDocument: async(req, res) => {
        let user_id  = req.userid
        let result =  await models.user_uploaded_files.findOne({
            where:{filename: req.params.name},
            raw:true
        })


        if(result && result.user_id  ===  user_id)
        {
            const options = {
                Bucket: config.AWS_BUCKET_NAME,
                Key : `${result.user_id}/${result.level}/${result.filename}`,
            };

            let file =  await s3.getObject(options).promise();


            const { mime } = await getMimeType( file.Body );


            const fileStream = await s3.getObject(options).createReadStream();



            res.set('Content-Type',mime)
            fileStream.pipe(res);
        }
        else
        {

            const file = new fs.ReadStream('./public/img/404.png');
            res.set('Content-Type',"image/png")
            file.pipe(res);

        }
    }

}
