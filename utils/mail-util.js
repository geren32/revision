const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const config = require('../configs/config');
const log = require('../utils/logger');
const sendMailGoogleApi = require("./mail-google-api-util")
/**
 * Create mail client
 * @param
 * @param
 */

// const {mailHost, mailPort, mailUsername, mailPassword, mailFrom, mailSecure, mailTls, mailAnon, frontUrl, imgUrl} = options;

log.info(`Initiate mail client`);

// setting mailer configurations
let smtpConfig = {
    host: config.MAIL_HOST,
    port: parseInt(config.MAIL_PORT)
};

if (config.MAIL_ANON === 'true') {
    smtpConfig.ignoreTLS = true;
    smtpConfig.secure = false;
    smtpConfig.auth = false;
    smtpConfig.tls = { rejectUnauthorized: false };
    smtpConfig.debug = true;
} else {
    if (config.MAIL_SECURE) smtpConfig.secure = true;
    if (config.MAIL_TLS) smtpConfig.requireTLS = true;
    if (config.MAIL_USERNAME && config.MAIL_PASSWORD) {
        smtpConfig.auth = {
            user: config.MAIL_USERNAME,
            pass: config.MAIL_PASSWORD
        }
    }
}

// creating transport with configs
const mailTransport = nodemailer.createTransport(smtpConfig);
log.info(`Verify mail connection: Data: ${JSON.stringify(smtpConfig)}`);
let verifyConnection;
try {
    verifyConnection = mailTransport.verify();
    log.info('Mail connection verified');
} catch (err) {
    log.error(`Mail connection not verified. Error: ${JSON.stringify(err)}`);
}

/**
 * get email template
 *
 * @param data - email data
 * @param type - email template
 * @return email text
 */
const getTemplate = async(data, type) => {
    log.info(`Start generating mail template. Data: ${JSON.stringify(data)} Type: ${JSON.stringify(type)}`);
    let file = await fs.readFileSync(`views/email-template/${type}.hbs`);
    let source = file.toString();
    let template = handlebars.compile(source);
    let result = await template({...data, frontUrl: config.FRONT_URL, imgUrl: config.IMG_URL });
    log.info(`Finish generating mail template. Data: ${JSON.stringify(result)}`);
    return result;
}

class EmailUtil {
    /**
     * send email function
     *
     * @param mailInfo - email data
     * @param type - email template
     */
    async sendMail(mailInfo, type) {
        if  (verifyConnection && !config.MAIL_GOOGLE_API) {
            log.info(`Start mail sending. Data: ${JSON.stringify(mailInfo)} Type: ${JSON.stringify(type)}`);
            let template = await getTemplate(mailInfo.data, type);
            let messageData = {
                from: 'Advokat Market' + '<' + `${config.MAIL_USERNAME}` + '>',
                //from: 'Studio Glass' + '<' + 'test123@gmail.com' + '>',
                to: mailInfo.to,
                subject: mailInfo.subject,
                html: template,
                attachments:mailInfo.attachments,
            };
            try {
                let result = await mailTransport.sendMail(messageData);
                log.info(`Mail send successfull. Data: ${JSON.stringify(result)}`);
                return result;
            } catch (err) {
                log.error(`Mail send failed. Error: ${JSON.stringify(err)}`);
            }
        } else if(config.MAIL_GOOGLE_API)
        {
            log.info(`Start mail sending. Data: ${JSON.stringify(mailInfo)} Type: ${JSON.stringify(type)}`);
            let template = await getTemplate(mailInfo.data, type);
            let messageData = {
                from: 'Advokat Market' + '<' + 'studioglass.sender@gmail.com' + '>',
                to: mailInfo.to,
                subject: mailInfo.subject,
                html: template
            };
            try {
                let result = await sendMailGoogleApi(messageData)
                log.info(`Mail send successfull. Data: ${JSON.stringify(result)}`);
                return result;
            } catch (err) {
                log.error(`Mail send failed. Error: ${JSON.stringify(err)}`);
            }
        }
    }
}



module.exports = new EmailUtil();
