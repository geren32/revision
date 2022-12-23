const sequelize = require("../sequelize-orm");
const log = require('../utils/logger');
const bcryptUtil = require("../utils/bcrypt-util");
const tokenUtil = require("../utils/token-util");
const { models } = require("../sequelize-orm");
const config = require("../configs/config");
const errors = require("../configs/errors");
const userService = require("../services/user.service");
const { Op } = require("sequelize");

const menuService = require("../services/menu.service");
const smsUtil = require('../utils/sms-util')
const cartService = require("../services/cart.service");
const { makeLocalToken, makeOneTimeCode } = require("../utils/app-util");
const emailUtil = require("../utils/mail-util");
const productService = require('../services/product.service');
const pagesService = require("../services/pages.service");
const linksService = require("../services/links.service");
const utilsCognito  = require("../utils/cognito-util");
const notificationService = require('../services/notification-service');
module.exports = {
    loginPage: async(req, res) => {
        log.info(`Start get /loginPage Params: ${JSON.stringify(req.body)} `)
        const lang = req.lang;
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/login'
            } else slugs[languages[i]] = `/${languages[i]}/auth/login`

        }
        let cart = req.cart
        let renderHeader = 'client/layout.hbs'
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let page_background = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_background && page_background.value) page_background = JSON.parse(page_background.value)
        if (page_background && page_background.login) page_background = page_background.login
        let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Логін"
                break;
            case 'ru':
                browserPageName = "Логин"
                break;
            case 'en':
                browserPageName = "Login"
                break;
            default:
                break;
        }

                let homePage = {}
                let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
                if(getHomePage){
                    let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                    homepageLink = homepageLink.toJSON()
                    homePage.slug = homepageLink.slug
                    if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
                }

        log.info(`End get /loginPage`)
        res.render('auth/page-login', {
            lang: lang,
            slugs,
            cart,
            homePage,
            page_background_desktop: page_background.desktop ? page_background.desktop : null,
            page_background_mobile: page_background.mobile ? page_background.mobile : null,
            metaData: req.body.metaData,
            layout: renderHeader,
            browserPageName,
            header_footer: header_footer ? header_footer : null,
            menu,
            favorite: favourite && favourite.length ? favourite.length : 0,
            isAuth: true
        });
    },
    userLogin: async(req, res) => {
        const lang = req.lang;


        log.info(`Start post /signin. Data: ${JSON.stringify(req.body.email)}`);
        let { phone } = req.body;
        //checking phone
        if (phone && (!config.REGEX_PHONE.test(phone) || phone.length != 19)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code,
            });
        }
        let phoneToCognito = phone.replace(/[()\s]/g, '')
        const client = await userService.getUser({ phone });


        if (!client) {
            return res.status(errors.CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.code).json({
                message: errors.CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.code,
            });
        }
        let data  = req.body

        data.phone = phoneToCognito
        let user = await models.user.findOne({ where:{phone:phone} });
        if(user && user.blocked){
            log.error(`User blocked: ${user}`);
            let err = new Error('User blocked');
            err.code = 401;
            err.errorCode = 2;
            // throw err;
        }

        let token = await utilsCognito.signInUserCognito(data,res, lang).catch((err) => {
            if (err) {
                log.error(`Failed to sign in user, ${err.message}`);
                err.code = 401;
                // throw err;
            }
        });


        if (user && token && token.access_token && token.refresh_token) {
            let data = {
                access_token: token.access_token,
                refresh_token: token.refresh_token
            };

            await models.session.create({user_id:user.id, access_token: token.access_token , refresh_token:token.refresh_token});
            res.cookie("jwt", "", { maxAge: 0 });
            res.cookie("jwt", token.access_token, { maxAge: config.TOKEN_LIFETIME });
            log.info(`End post /signin. Data: true`);


            if(user)
            {
                if(lang == 'uk'){
                    return res.status(200).json({ status: 1 , "url": `/client/cabinet`, data, user});
                } else {
                    return res.status(200).json({ status: 1 , "url": `/${lang}/client/cabinet`, data, user});
                }
            }


        } else {
            log.error(`Failed to login user: ${phone}`);
            let err = new Error(`Failed to login user: ${phone}`);
            err.errorCode = 1;
            err.code = 401;
            // throw err;
        }
    },

    registerPage: async(req, res) => {
        const lang = req.lang;
        let slugs = {}
        let cart = req.cart
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/register'
            } else slugs[languages[i]] = `/${languages[i]}/auth/register`

        }
        let renderHeader = 'client/layout.hbs'
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let page_background = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_background && page_background.value) page_background = JSON.parse(page_background.value)
        if (page_background && page_background.registration) page_background = page_background.registration
        let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Реєстрація"
                break;
            case 'ru':
                browserPageName = "Регистрация"
                break;
            case 'en':
                browserPageName = "Registration"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        res.render('auth/page-registration', {
            lang: lang,
            slugs,
            cart,
            homePage,
            browserPageName,
            page_background_desktop: page_background.desktop ? page_background.desktop : null,
            page_background_mobile: page_background.mobile ? page_background.mobile : null,
            page_link_to_private_policy: page_background.link ? page_background.link : null,
            metaData: req.body.metaData,
            layout: renderHeader,
            header_footer: header_footer ? header_footer : null,
            menu,
            favorite: favourite && favourite.length ? favourite.length : 0,
            isAuth: true
        });
    },
    registerPageSuccess: async(req, res) => {
        const lang = req.lang;
        let slugs = {}
        let cart = req.cart
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/register/success'
            } else slugs[languages[i]] = `/${languages[i]}/auth/register/success`

        }
        let renderHeader = 'client/layout.hbs'
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let page_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
        if (page_settings && page_settings.registration) page_settings = page_settings.registration_success
        let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }
        let catalogPage = await pagesService.getPage({ lang, template: "collections" }, null, lang)
        let catalogLink = await linksService.getLinkByFilter({ original_link: `/shop/getCategories/${catalogPage.id}`, lang })
        catalogLink = catalogLink.toJSON()
        catalogPage.slug = catalogLink.slug
        if(catalogPage.slug) catalogPage.slug = lang === config.LANGUAGES[0] ? `${catalogPage.slug}` : `${lang}/${catalogPage.slug}`;

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Реєстрація успішна"
                break;
            case 'ru':
                browserPageName = "Регистрация успешная"
                break;
            case 'en':
                browserPageName = "Registration success"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        res.render('auth/page-registration-success', {
            lang: lang,
            metaData: req.body.metaData,
            slugs,
            cart,
            homePage,
            browserPageName,
            page_settings_desktop: page_settings.desktop ? page_settings.desktop : null,
            page_settings_mobile: page_settings.mobile ? page_settings.mobile : null,
            page_settings_title: page_settings.title ? page_settings.title : null,
            page_settings_text: page_settings.text ? page_settings.text : null,
            page_settings_icon: page_settings.image ? page_settings.image : null,
            layout: renderHeader,
            header_footer: header_footer ? header_footer : null,
            menu,
            catalogPage,
            favorite: favourite && favourite.length ? favourite.length : 0,
            isAuth: true
        });
    },
    registerNewClient: async(req, res) => {
        let {
            last_name,
            first_name,
            email,
            password,
            confirm_password,
            phone_number,
        } = req.body;
        const lang = req.lang;

        log.info(`Start post /register Params: ${JSON.stringify(req.body)} `)
        if (!first_name || !last_name || !email || !phone_number || !password || !confirm_password) {
            return res.status(errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        if (password && !config.REGEX_PASSWORD.test(password)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code,
            });
        }
        //checking confirm password
        if (password && confirm_password && password != confirm_password) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code,
            });
        }
        //checking phone

        if (phone_number && (!config.REGEX_PHONE.test(phone_number) || phone_number.length != 19)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code,
            });
        }

        //checking email
        if (email && !config.REGEX_EMAIL.test(email)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
            });
        }

        const userExist = await userService.getUser({ email: email }, ["id", "email"]);
        if (userExist) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_EMAIL_EXIST.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_EMAIL_EXIST.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_EMAIL_EXIST.code,
                errPlace: 'email'
            });
        }
        const phoneExist = await userService.getUser({ phone: phone_number }, [
            "id",
        ]);
        if (phoneExist) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_EXIST.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PHONE_EXIST.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_EXIST.code,
                errPlace: 'phone'
            });
        }

        try {
            let phone_to_cognito = phone_number.replace(/[()\s]/g, '');

            let userCognito = await utilsCognito.createUserCognito({ username:phone_to_cognito, password:confirm_password }).catch((err) => {
                if (err) {
                    log.error(`Failed to create user, ${err.message}: ${phone_to_cognito}`);
                    err.code = 400;
                    // throw err;
                }
            });
            await utilsCognito.confirmUser(phone_to_cognito)

            let filter_phone
            if(phone_number){
                filter_phone = phone_number.replace(/[- )(]/g,'')
            }
            const { userSub: user_id } = userCognito;
            if (userCognito && userCognito.userSub && userCognito.user.username) {
                let newUser = await models.user.create({
                    first_name:first_name,
                    email:email,
                    phone:phone_number,
                    filter_phone:filter_phone ? filter_phone :null,
                    cognito_id: userCognito.userSub,
                    last_name: last_name,
                    confirm_token: null,
                    confirm_token_type: null,
                    confirm_token_expires: null,
                    mail_verified: true,
                    status: config.GLOBAL_STATUSES.ACTIVE,
                });
               // let newUser = await models.user.findOne({where: {phone: phone_number}, raw: true})

                await notificationService.createNotification(config.NOTIFICATION_TYPES.REGISTER, newUser.id);

            }

            let adminMails = await models.configs.findOne({
                where: { type: "register_emails" },
            });
            if (adminMails.value) {
                let adminEmails = adminMails.value.trim().split(",");
                for (let adminEmail of adminEmails) {
                    let mailObjToAdmin = {
                        to: adminEmail,
                        subject: config.TEXTS[lang].new_user,
                        data: {
                            name: first_name,
                            email: email,
                            phone: phone_number,
                            lang: lang
                        },
                    };
                    emailUtil.sendMail(mailObjToAdmin, "verify-to-admin");
                }
            }
            let mailObjToClient = {
                to: email,
                subject: config.TEXTS[lang].register_congratulation_text,
                data: {
                    info: {
                        subject: config.TEXTS[lang].register_congratulation_text,
                        name: first_name,
                        email: email,
                        phone: phone_number,
                        lang: lang
                    },
                    lang: lang
                },
            };
            emailUtil.sendMail(mailObjToClient, "form-to-client");


            log.info(`Start post /register Result: ${JSON.stringify({successRegistration: true}) } `)
            return res.status(200).json({ successRegistration: true });
        } catch (err) {
            log.error(`${err}`);

            return res.status(400).json({
                message: err.message,
                errCode: 400,
            });
        }
    },
    recoverPasswordPage: async(req, res) => {
        const lang = req.lang;
        let cart = req.cart
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/recover_password'
            } else slugs[languages[i]] = `/${languages[i]}/auth/recover_password`

        }
        let renderHeader = 'client/layout.hbs'
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let page_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
        if (page_settings && page_settings.password_recovery) page_settings = page_settings.password_recovery
        let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Забули пароль?"
                break;
            case 'ru':
                browserPageName = "Забыли пароль?"
                break;
            case 'en':
                browserPageName = "Forgot password?"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        res.render('auth/page-password-recovery', {
            lang: lang,
            slugs,
            cart,
            homePage,
            browserPageName,
            metaData: req.body.metaData,
            page_settings_desktop: page_settings.desktop ? page_settings.desktop : null,
            page_settings_mobile: page_settings.mobile ? page_settings.mobile : null,
            layout: renderHeader,
            header_footer: header_footer ? header_footer : null,
            menu,
            favorite: favourite && favourite.length ? favourite.length : 0,
            isAuth: true
        });

    },
    recoverPassword: async(req, res) => {
        let { phone } = req.body;
        const lang = req.lang
        const user = await userService.getUser({ phone,status:config.GLOBAL_STATUSES.ACTIVE});
        log.info(`Start post /recoverPassword Params: ${JSON.stringify(req.body)}`)
        if (!user) {
            return res.status(errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.code).json({
                message: errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.code,
            });
        }
        let userDataToUpdate = {
            updated_at: new Date(),
        };
        if(user.confirm_token_time) {
            if(user.confirm_token_time.getTime() + 15*60*1000 > Date.now()) {
                if(user.confirm_token_count > 2) {
                    return res.status(errors.CLIENT_BAD_REQUEST_RECOVER_LIMIT.code).json({
                        message: errors.CLIENT_BAD_REQUEST_RECOVER_LIMIT.message[lang],
                        errCode: errors.CLIENT_BAD_REQUEST_RECOVER_LIMIT.code,
                    });
                } else {
                    userDataToUpdate.confirm_token_count = user.confirm_token_count + 1;
                }
            } else if(user.confirm_token_time.getTime() + 30*60*1000 > Date.now()) {
                return res.status(errors.CLIENT_BAD_REQUEST_RECOVER_LIMIT.code).json({
                    message: errors.CLIENT_BAD_REQUEST_RECOVER_LIMIT.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_RECOVER_LIMIT.code,
                });
            } else {
                userDataToUpdate.confirm_token_time = null;
                userDataToUpdate.confirm_token_count = null;
            }
        } else {
            userDataToUpdate.confirm_token_time = new Date();
            userDataToUpdate.confirm_token_count = 1;
        }
        let localToken = makeOneTimeCode();
        userDataToUpdate.confirm_token = localToken.OneTimeCode;
        userDataToUpdate.confirm_token_type = "reset";
        userDataToUpdate.confirm_token_expires = localToken.confirmTokenExpires;
        let userData = await user.update(userDataToUpdate);
        if(user.phone){
            let phoneToTURBOSMS = user.phone.replace(/[(+)\s]/g, '');
            await smsUtil.sendTurboSMS([phoneToTURBOSMS],`${config.TEXTS[lang].verify_recovery_code} ${userData.confirm_token}`);
        }

        log.info(`End post /recoverPassword Params: ${JSON.stringify(true)}`)
        return res.status(200).json({ "phone": user.phone });
    },
    verificationForgotPasswordCodePage: async(req, res) => {
        const lang = req.lang;
        let cart = req.cart
        let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/verificationForgotPasswordCode'
            } else slugs[languages[i]] = `/${languages[i]}/auth/verificationForgotPasswordCode`
        }
        const phone = req.params.phone
        let renderHeader = 'client/layout.hbs'
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let page_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
        if (page_settings && page_settings.verify_password) page_settings = page_settings.verify_password
        let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Відновлення паролю"
                break;
            case 'ru':
                browserPageName = "Восстановление пароля"
                break;
            case 'en':
                browserPageName = "Password recovery"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        res.render('auth/page-password-reset', {
            lang: lang,
            metaData: req.body.metaData,
            page_settings_desktop: page_settings.desktop ? page_settings.desktop : null,
            page_settings_mobile: page_settings.mobile ? page_settings.mobile : null,
            page_settings_text: page_settings.text ? page_settings.text : null,
            layout: renderHeader,
            phone,
            browserPageName,
            cart,
            homePage,
            header_footer: header_footer ? header_footer : null,
            menu,
            slugs,
            favorite: favourite && favourite.length ? favourite.length : 0,
            isAuth: true
        });

    },
    verificationForgotPasswordCode: async(req, res) => {

        let { phone, code } = req.body;
        const lang = req.lang
        code = code.replace(/-/g, '')
        if (!phone || !code) {
            return res.status(errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        if (phone && (!config.REGEX_PHONE.test(phone) || phone.length != 19)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code,
            });
        }
        log.info(`Start post /verificationForgotPasswordCode Params: ${JSON.stringify(req.body)}`)
        try {
            const userInfo = await userService.getOutUserInfo({ phone });


            if (!userInfo || !userInfo.id) {
                return res.status(errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.code).json({
                    message: errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.code,
                });
            }

            const user = await userService.getUser({
                [Op.and]: [{ confirm_token: code }, { id: userInfo.id }] });
            if (!user) {
                return res.status(errors.CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE.code).json({
                    message: errors.CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE.code,
                });
            }
            if (user && user['confirm_token_type'] === 'reset') {
                const expiresAt = (new Date(user.confirm_token_expires)).getTime();
                if (expiresAt < Date.now()) {
                    return res.status(errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code).json({
                        message: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.message[lang],
                        errCode: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code,
                    });
                }
            } else {
                return res.status(errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code).json({
                    message: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code,
                });
            }

            log.info(`End post /verificationForgotPasswordCode `)
            return res.json({ "phone": user.phone, "code": user.confirm_token })

        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.stack,
                errCode: 400
            });

        }
    },
    passwordRecoveryPage: async(req, res) => {
      const lang = req.lang;
      let cart = req.cart
      let slugs = {}
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/passwordRecovery'
            } else slugs[languages[i]] = `/${languages[i]}/auth/passwordRecovery`
        }
      let {phone,code} = req.params
      let renderHeader = 'client/layout.hbs'
      let header_footer = await menuService.getHeaderFooter(lang);
      let menu = await menuService.getMenu(lang);
      let page_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
      if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
      if (page_settings && page_settings.reset_password) page_settings = page_settings.reset_password
      let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }

        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Відновити пароль"
                break;
            case 'ru':
                browserPageName = "Восстановить пароль"
                break;
            case 'en':
                browserPageName = "Recover password"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

      res.render('auth/page-password-new', {
          lang: lang,
          metaData: req.body.metaData,
          page_settings_desktop: page_settings.desktop ? page_settings.desktop : null,
          page_settings_mobile: page_settings.mobile ? page_settings.mobile : null,
          layout: renderHeader,
          phone,
          browserPageName,
          code,
          cart,
          header_footer: header_footer ? header_footer : null,
          menu,
          slugs,
          homePage,
          favorite: favourite && favourite.length ? favourite.length : 0,
          isAuth: true
      });
    },
    passwordRecovery: async(req, res) => {
        const lang = req.lang
        let { phone, code, new_password, confirm_new_password } = req.body;
        code = code.replace(/-/g, '')
        log.info(`Start post /passwordRecovery Params: ${JSON.stringify(req.body)}`)
        if (!phone || !code || !new_password || !confirm_new_password) {
            return res.status(errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
        if (phone && (!config.REGEX_PHONE.test(phone) || phone.length != 19)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID.code,
            });
        }
        if (new_password !== confirm_new_password) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH.code,
            });
        }
        if (!config.REGEX_PASSWORD.test(new_password)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code,
            });
        }
        if (!config.REGEX_PASSWORD.test(confirm_new_password)) {
            return res.status(errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code).json({
                message: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.message[lang],
                errCode: errors.CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID.code,
            });
        }
        try {
            const userInfo = await userService.getOutUserInfo({ phone });
            if (!userInfo || !userInfo.id) {
                return res.status(errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.code).json({
                    message: errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST.code,
                });
            }

            const user = await userService.getUser({
                [Op.and]: [{ confirm_token: code }, { id: userInfo.id }] });
            if (!user) {
                return res.status(errors.CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE.code).json({
                    message: errors.CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE.code,
                });
            }
            if (user && user['confirm_token_type'] === 'reset') {
                const expiresAt = (new Date(user.confirm_token_expires)).getTime();
                if (expiresAt < Date.now()) {
                    return res.status(errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code).json({
                        message: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.message[lang],
                        errCode: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code,
                    });
                }
            } else {
                return res.status(errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code).json({
                    message: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE.code,
                });
            }
            const newHashPassword = await bcryptUtil.hashPassword(new_password);
            await user.update({
                // password: newHashPassword,
                confirm_token: null,
                confirm_token_type: null,
                confirm_token_expires: null,
                updated_at: new Date().toISOString()
            });
            let phoneToCognito = phone.replace(/[()\s]/g, '')
            let userCognito = await utilsCognito.setUserPasswordByAdminByPhone(phoneToCognito, new_password).catch((err) => {
                if (err) {
                    log.error(`Failed to set user password, ${err.message}: ${phoneToCognito}`);
                    err.code = 400;
                    // throw err;
                }
            });

            await notificationService.createNotification(config.NOTIFICATION_TYPES.PASSWORD_RECOVERY, userInfo.id);

            log.info(`End post /passwordRecovery Result: ${JSON.stringify(true)}`)
            return res.json(true)

        } catch (err) {
            log.error(err)
            return res.status(400).json({
                message: err.stack,
                errCode: 400
            });

        }

    },
    passwordRecoverySuccessPage: async(req, res) => {
      const lang = req.lang;
      let slugs = {}
      let cart = req.cart
        const languages = config.LANGUAGES
        for(let i = 0; i < languages.length; i++){
            if(languages[i] == "uk"){
                slugs.uk = '/auth/passwordRecoverySuccess'
            } else slugs[languages[i]] = `/${languages[i]}/auth/passwordRecoverySuccess`
        }
        let renderHeader = 'client/layout.hbs'
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        let page_settings = await models.configs.findOne({ where: { type: 'popups_settings', lang: lang }, raw: true });
        if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
        if (page_settings && page_settings.your_message_sended) page_settings = page_settings.your_message_sended
        let favourite
        if(req.cookies.fav && req.cookies.fav.length){
            favourite = req.cookies.fav.split(',')
        }
        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Пароль відновлено"
                break;
            case 'ru':
                browserPageName = "Пароль восстановлено"
                break;
            case 'en':
                browserPageName = "Password successfully recover"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
        if(getHomePage){
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        res.render('auth/page-password-success', {
            lang: lang,
            slugs,
            cart,
            browserPageName,
            homePage,
            metaData: req.body.metaData,
            page_settings_desktop: page_settings.desktop ? page_settings.desktop : null,
            page_settings_mobile: page_settings.mobile ? page_settings.mobile : null,
            page_settings_icon: page_settings.image ? page_settings.image : null,
            layout: renderHeader,
            header_footer: header_footer ? header_footer : null,
            menu,
            favorite: favourite && favourite.length ? favourite.length : 0,
            isAuth: true
        });
    },
    logout: async(req, res) => {
        const lang = req.lang;
        const token = req.cookies["jwt"];
        try {
            log.info(`Start get /logout `);
            if(token){
                let session = await userService.getSessionByFilter({access_token:token})
                if (!session) {
                    return res.status(403).json({
                        message: errors.NOT_FOUND_USER.message,
                        errCode: 403,
                    });
                }
                await userService.deleteSession({access_token:token})
                res.cookie('jwt', '', {maxAge: 0});
            }


            let homePage = {};
                let getHomePage = await pagesService.getPage({ lang,template: "homepage" },null,lang)
                if(getHomePage){
                    let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`,lang })
                    homepageLink = homepageLink.toJSON()
                    homePage.slug = homepageLink.slug
                    if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
                }

            log.info(`End get /logout Result: redirect to homepage`);
            // if(lang == 'uk'){
            //     return res.redirect(homePage.slug);
            // } else {
            //     return res.redirect('/' + homePage.slug);
            // }
            if(lang == 'uk'){
                return res.status(200).json({url:homePage.slug});
            } else {
                return res.status(200).json({url: '/' + homePage.slug});
            }

        } catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: 400,
            });
        }
    },
    checkIsEmailExist: async(req, res) => {
        let newEmail = req.params.newEmail;
        if (!config.REGEX_EMAIL.test(newEmail)) {
            return res.status(200).json({ notEmail: true });
        }
        log.info(`Start get /checkIsEmailExist/:newEmail ${JSON.stringify(req.params)} `);
        try {

            let result = await userService.getUser({ email: newEmail }, false);
            if (result) {
                return res.status(200).json({ emailExist: true });
            }
            log.info(`End get /checkIsEmailExist/:newEmail Result: ${JSON.stringify({ emailExist: false })} `)
            return res.status(200).json();
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: 400,
            });
        }
    },
    checkIsPhoneExist: async(req, res) => {

        let { phone, id } = req.body;

        if (!config.REGEX_PHONE.test(phone)) {
            return res.status(400).json({
                message: errors.BAD_REQUEST_USER_PHONE_NOT_VALID.message,
                errCode: errors.BAD_REQUEST_USER_PHONE_NOT_VALID.code,
            });
        }
        log.info(`Start post /checkIsPhoneExist ${JSON.stringify(req.body)} `);
        try {
            let result = await userService.getOutUserInfo({ phone: phone }, false);
            if (result && result.id != id) {
                return res.status(400).json({
                    message: errors.BAD_REQUEST_USER_PHONE_EXIST.message,
                    errCode: errors.BAD_REQUEST_USER_PHONE_EXIST.message,
                });
            }
            log.info("End  post /checkIsPhoneExist ")
            return res.status(200).json({ IsPhoneExist: false });
        } catch (error) {
            log.error(error)
            return res.status(400).json({
                message: error.message,
                errCode: 400,
            });
        }
    }
};
