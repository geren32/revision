const log = require('./logger');
const Puppeteer = require('puppeteer');
const templateUtil = require("../utils/template-util");
const appUtils = require('../utils/app-util');
const options = appUtils.getArgs();
const { imagePath } = require('../utils/handebar-helpers');
const { models } = require("../sequelize-orm");
module.exports = {

    generatePdf: async(data, type) => {
        log.info('start PDF UTIL')
        const browser = await Puppeteer.launch({
            headless: true,
            args: ['--use-gl=egl'],
        });
        const page = await browser.newPage();
        data.frontUrl = options['front-url'];
        if(data.result.composite_image && data.result.composite_image==true){
            data.result.image_path  = data.result.image
        } else {
            data.result.image_path = imagePath(data.result.image, '930X930', 1, data.result.is_color)
            //data.result.image_path = 'http://185.233.36.201:3013' + data.result.image_path
            //console.log(data.result.image_path)
            data.result.image_path = data.frontUrl + data.result.image_path
        }
       

        let getContacts = await models.configs.findOne({ where: { type: 'header_footer', lang: data.lang }, raw: true })
        data.contacts = getContacts
        let template = await templateUtil.getTemplate(data, type);
        await page.setContent(template);


        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { left: 10, top: 10, right: 10, bottom: 10 }
        });

        await page.close();
        await browser.close();
        log.info('end PDF UTIL')
        return pdfBuffer;
    }

}