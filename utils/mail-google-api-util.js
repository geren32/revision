const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
const credentials = require('../credentials.json');
const tokens = require('../token.json');
const { models } =require('../sequelize-orm')
//
const getGmailService = async () => {
    let google_access_token =  await models.configs.findOne({where:{type:'google_access_token'} , raw: true})
    let google_refresh_token =  await models.configs.findOne({where:{type:'google_refresh_token'}, raw: true})
    google_access_token = google_access_token ? google_access_token.value : null
    google_refresh_token = google_refresh_token ? google_refresh_token.value : null

    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
    await oAuth2Client.setCredentials({ refresh_token: google_refresh_token })
    let result =   await oAuth2Client.getAccessToken()

    google_access_token =  result.res.data && result.res.data.access_token? result.res.data.access_token : google_access_token
    google_refresh_token =  result.res.data && result.res.data.refresh_token ? result.res.data.refresh_token : google_refresh_token


    await models.configs.update({value:google_access_token},{where:{type:'google_access_token'}})
    await models.configs.update({value:google_refresh_token},{where:{type:'google_refresh_token'}})


    const gmail = await google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
};

const encodeMessage = (message) => {
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createMail = async (options) => {
    const mailComposer = new MailComposer(options);
    const message = await mailComposer.compile().build();
    return encodeMessage(message);
};

const sendMailGoogleApi = async (options) => {
    const gmail = await getGmailService();
    const rawMessage = await createMail(options);
    const { data: { id } = {} } = await gmail.users.messages.send({
        userId: 'me',
        resource: {
            raw: rawMessage,
        },
    });
    return id;
};



module.exports = sendMailGoogleApi;
