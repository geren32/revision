const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
sharp.cache(false);
const { slugify } = require('transliteration');
slugify.config({ lowercase: true, separator: '-' });
const log = require('../utils/logger');
const { models } = require('../sequelize-orm');
const asyncSaveImageWebpToPath = async(imagePath, savePath) => {
    log.info(`Start asyncSaveImageWebpToPath data:${JSON.stringify(imagePath, savePath)}`)
    try {

        let buffer;
        let image_webp_quality_config = await models.configs.findOne({ where: { type: 'image_webp_quality' }, raw: true });
        let image_webp_quality = image_webp_quality_config && image_webp_quality_config.value ? image_webp_quality_config.value : 100;
        let image_webp_status_config = await models.configs.findOne({ where: { type: 'image_webp_status' }, raw: true });
        let image_webp_status = image_webp_status_config && image_webp_status_config.value ? image_webp_status_config.value : false;
        if(image_webp_status)
        {
            buffer = await sharp(imagePath).webp(
                {
                    quality: parseInt(image_webp_quality)
                }
            ).toBuffer();
            savePath = savePath.split('.')
            log.info(`End asyncSaveImageWebpToPath data:${JSON.stringify(savePath)}`)

            return sharp(buffer).toFile(`${savePath[0]}.webp`);
        }
        else
        {
            return false
        }


    } catch (e) {
        log.error(e)
        let err = new Error(e.message);
        throw err;
    }
}
module.exports = {

    asyncResizeImage: async(imagePath, width, height, fit) => {
        log.info(`Start asyncResizeImage data:${JSON.stringify(imagePath, width, height, fit)}`)
        try {
            let buffer;
            const fileExt = path.basename(imagePath).split('.').pop().toLowerCase();
            let opacity = fileExt === 'png' ? 0 : 1;
            let { info } = await sharp(imagePath).toBuffer({ resolveWithObject: true });


            if (fileExt === 'svg') {
                //buffer = await sharp(imagePath, { density: 20 }).toBuffer();
                log.info(`End asyncResizeImage data:${JSON.stringify(info)}`)
                return info
            } else {
                if (fit === 'contain' && (width > info.width && height > info.height)) {
                    const leftRight = (width - info.width) / 2;
                    const topBottom = (height - info.height) / 2;
                    buffer = await sharp(imagePath)
                        .extend({
                            top: Math.floor(topBottom),
                            bottom: Math.ceil(topBottom),
                            left: Math.floor(leftRight),
                            right: Math.ceil(leftRight),
                            background: { r: 255, g: 255, b: 255, alpha: opacity }
                        })
                        .toBuffer();
                } else {
                    buffer = await sharp(imagePath)
                        .resize({
                            width: width,
                            height: height,
                            fit: fit,
                            background: { r: 255, g: 255, b: 255, alpha: opacity }
                        })
                        .toBuffer();
                }
            }
            log.info(`End asyncResizeImage data:${JSON.stringify(imagePath)}`)
            return sharp(buffer).toFile(imagePath);
            /*if (!width && height > info.height){
                buffer = await sharp(imagePath)
                    .extend({
                        top: Math.floor(topBottom),
                        bottom: Math.ceil(topBottom),
                        background: { r: 255, g: 255, b: 255, alpha: opacity }
                    })
                    .toBuffer();
            }else if (!height && width > info.width){
                buffer = await sharp(imagePath)
                    .extend({
                        left: Math.floor(leftRight),
                        right: Math.ceil(leftRight),
                        background: { r: 255, g: 255, b: 255, alpha: opacity }
                    })
                    .toBuffer();
            } else if (width > info.width && height > info.height) {
                buffer = await sharp(imagePath)
                    .extend({
                        top: Math.floor(topBottom),
                        bottom: Math.ceil(topBottom),
                        left: Math.floor(leftRight),
                        right: Math.ceil(leftRight),
                        background: { r: 255, g: 255, b: 255, alpha: opacity }
                    })
                    .toBuffer();
            } else if (width > info.width || height > info.height) {
                buffer = await sharp(imagePath)
                    .resize({
                        width: width,
                        height: height,
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: opacity }
                    })
                    .toBuffer();
            } else {
                buffer = await sharp(imagePath)
                    .resize({
                        width: width,
                        height: height,
                        fit: 'cover'
                    })
                    .toBuffer();
            }*/


        } catch (e) {
            log.error(e)
            let err = new Error(e.message);
            throw err;
        }
    },

    asyncResizeImageToPath: async(imagePath, savePath, width, height, fit) => {
        log.info(`Start asyncResizeImageToPath data:${JSON.stringify(imagePath, savePath, width, height, fit)}`)
        try {
            let buffer;
            const fileExt = path.basename(imagePath).split('.').pop().toLowerCase();
            let opacity = fileExt === 'png' ? 0 : 1;
            let { info } = await sharp(imagePath).toBuffer({ resolveWithObject: true });


            if (fileExt === 'svg') {
                //buffer = await sharp(imagePath, { density: 20 }).toBuffer();
                log.info(`End asyncResizeImageToPath data:${JSON.stringify(info)}`)
                return info
            } else {
                if (fit === 'contain' && (width > info.width && height > info.height)) {
                    const leftRight = (width - info.width) / 2;
                    const topBottom = (height - info.height) / 2;
                    buffer = await sharp(imagePath)
                        .extend({
                            top: Math.floor(topBottom),
                            bottom: Math.ceil(topBottom),
                            left: Math.floor(leftRight),
                            right: Math.ceil(leftRight),
                            background: { r: 255, g: 255, b: 255, alpha: opacity }
                        })
                        .toBuffer();
                } else {
                    if(info.width < width || info.height < height) fit = 'fill';
                    buffer = await sharp(imagePath)
                        .resize({
                            width: width,
                            height: height,
                            fit: fit,
                            background: { r: 255, g: 255, b: 255, alpha: opacity }
                        })
                        .toBuffer();
                }
            }
            log.info(`End asyncResizeImageToPath data:${JSON.stringify(savePath)}`)
            let rrr = await  sharp(buffer).toFile(savePath);

            await  asyncSaveImageWebpToPath(savePath,savePath)

            return rrr

        } catch (e) {
            log.error(e)
            let err = new Error(e.message);
            throw err;
        }
    },

    asyncResizeImageDIA: async(imageBuffer, isPNG) => {
        log.info(`Start asyncResizeImageDIA data:${JSON.stringify({isPNG})}`);
        try {
            let buffer;
            let opacity = isPNG === true ? 0 : 1;

            const image = await sharp(imageBuffer);
            const metadata = await image.metadata();
            console.log(metadata);

            buffer = await sharp(imageBuffer)
                .resize({
                    width: metadata.width,
                    height: metadata.height,
                    background: { r: 255, g: 255, b: 255, alpha: opacity }
                })
                .toBuffer();

            log.info(`End asyncResizeImageDIA data: true`);

            const new_image = await sharp(buffer);
            const new_metadata = await new_image.metadata();

            return {file: buffer, width: metadata.width, height: metadata.height, size: new_metadata.size };

        } catch (e) {
            console.log(e);
            log.error(e)
            let err = new Error(e.message);
            throw err;
        }
    },

    makeValidFileName: (fileName, fileExt, path) => {
        log.info(`Start makeValidFileName data:${JSON.stringify(fileName, fileExt, path)}`)
        try {
            // to lowercase, replace space to '-', transliteration
            let newFileName = slugify(fileName);
            // replace more '---' to '-'
            while (newFileName.includes('--')) {
                newFileName = newFileName.replace(/--/g, "-")
            }
            // autoincrement the same name
            let counter = 1;
            while (fs.existsSync(path + `${newFileName}.${fileExt}`)) {
                const lastIndex = newFileName.lastIndexOf('_');
                let lastNumber;
                let nameWithoutNumber;
                if (lastIndex !== -1) {
                    nameWithoutNumber = newFileName.slice(0, lastIndex);
                    lastNumber = newFileName.slice(lastIndex + 1, newFileName.length);
                }
                if (lastNumber && /^\d+$/.test(lastNumber)) {
                    newFileName = nameWithoutNumber + '_' + (parseInt(lastNumber) + 1).toString();
                } else {
                    newFileName = newFileName + `_${counter}`;
                }
                counter = counter + 1;
            }
            log.info(`End makeValidFileName data:${JSON.stringify(newFileName)}`)
            return newFileName;
        } catch (e) {
            log.error(e)
            let err = new Error(e.message);
            throw err;
        }
    },

    /*asyncResizeImage: async (imagePath, width, height, isMobile) => {
        try {
            let resizeImagePath;
            if(isMobile) {
                const filename = 'mobile-' + path.basename(imagePath);
                resizeImagePath = path.join('uploads','images', filename);
            }
            else{
                const filename = 'full-' + path.basename(imagePath);
                resizeImagePath = path.join('uploads','images', filename);
            }
            await sharp(imagePath)
                .resize({ width: width, height: height })
                .toFile(resizeImagePath);
            return path.join('/', resizeImagePath);
        } catch (e) {
            let err = new Error(e.message);
            throw err;
        }
    },*/

}
