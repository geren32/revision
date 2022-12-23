const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const addressService = require('../services/adress.service');
const ordersService = require('../services/order.service');
const productService = require('../services/product.service');
const userService = require('../services/user.service');
const cartService = require('../services/cart.service');
const log = require('../utils/logger');
const errors = require('../configs/errors');

const templateUtil = require('../utils/template-util');
const config = require('../configs/config');
const emailUtil = require('../utils/mail-util');
const moment = require('moment');
const menuService = require('../services/menu.service');
const adminPromocodeService = require('../services/admin-promocode.service')
const FormData = require('form-data');



const uuid = require('uuid')
const crypto = require('crypto')
const axios = require('axios');
const smsUtil = require('../utils/sms-util')
const pagesService = require('../services/pages.service');
const linksService = require('../services/links.service');
const productPriceUtil = require('../utils/product_price-util');
const utilsCognito = require("../utils/cognito-util");
const generator = require("generate-password");
const HTMLtoDOCX = require('html-to-docx');
const fs = require("fs");
const service = require("../services/forms.service");
const s3_util = require('../utils/s3-util');
const notificationService = require("../services/notification-service");
const requestIp = require("request-ip");
const handlebars = require("handlebars");
const LiqPay = require("../utils/liqpay-util");



module.exports = {

    validatePhoneAndEmail:async (req,res)=>{
        let {phone,email} = req.body

        let phone_email_exist = await userService.finUserPhoneAndEmailExist(phone,email)

       return res.status(200).json(phone_email_exist)
    },
    getFileOrders:async (req,res)=>{
        let id = req.params.order_id;
        let file = await userService.getDocumentByOrder(id)
        if(file){
            return  await s3_util.getBASE64(file,res)
        }
        return res.send("files")
    },
    getPreFileOrders:async (req,res)=>{
        try {
            let id = req.params.file_id;

            let file = await userService.getPreDocumentByOrder(id)
            if(file){
                return  await s3_util.getBASE64NoUser(file,res)
            }
            return res.send("files")
        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    getCourtForService:async (req,res)=>{
        let {city,region,lang} = req.body
        let court = await userService.getCourtByOrder({city:city,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},region)

        return res.status(200).json(court)

    },
    createOrderAdditional:async(req,res)=>{
        let user;
        const lang = req.lang ? req.lang :req.body.lang;
        let userId = req.user ? req.user.userid : null;
        if(!req.body.additional_id)req.body = req.body.data ? JSON.parse(req.body.data) : null;
        let {
            city,
            department,
            delivery_type,
            pay_type,
            additional_id,
            court_id,
            region_court,
            court_city,
            name,
            phone,
            message,
            order_id,

        } = req.body;
        let transaction;
        try {
            pay_type = pay_type ? pay_type :config.SERVICE_PAY_TYPE.NOT_PAID
            let payment_type = pay_type
            transaction = await sequelize.transaction();
            let onlinePayment
            if(pay_type == 1){
                onlinePayment = true
            }else{
                onlinePayment = false
            }

            let court
            let service = await ordersService.getServiceAdditional({id:additional_id},transaction)
            if(service){
                const ip = requestIp.getClientIp(req)

                let ipCountry = await axios({
                    method: 'get',
                    url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                })
                if(ipCountry)ipCountry = ipCountry.data
                if(service.service_country_pricing && service.service_country_pricing.length && ipCountry && ipCountry.country){
                    for(let country_price of service.service_country_pricing){
                        if(country_price.ip == ipCountry.country){
                            service.price = country_price.price
                        }
                    }
                }
            }
            if(service){
                if(court_id){
                    court = await ordersService.getCourt({id:court_id},transaction)
                }else if (region_court && court_city){
                    court =  await userService.getCourtByOrder({city:court_city,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},region_court)
                    if(!court){
                        await transaction.commit();
                        return res.status(200).json({validate_court_error:true})
                    }
                }else{
                    await transaction.commit();
                    return res.status(200).json({validate_court_error:true})
                }
            }
            let send_to_mail = service.options
            let pre_send_to_mail = await models.configs.findOne({where:{type:"pre_orders_emails",lang:lang},raw:true,transaction})
            if(send_to_mail){
                send_to_mail = JSON.parse(send_to_mail)
                if(send_to_mail.later){
                    send_to_mail.later = Number(send_to_mail.later) / 60 / 1000
                }
            }
            if(pre_send_to_mail){
                pre_send_to_mail = (pre_send_to_mail.value)
            }

            if(!service || service && !service.price && service.type == 1){
                await transaction.commit();
                return res.status(errors.CLIENT_BAD_REQUEST.code).json({
                    message: errors.CLIENT_BAD_REQUEST.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST.code,
                });
            }
            let order_send
            let order_send_time
            if(send_to_mail && send_to_mail.enabled && send_to_mail.in_create && service.type != 3){
                order_send = 1
            }else if(send_to_mail && send_to_mail.enabled && !send_to_mail.in_create && service.type != 3){
                order_send_time =new Date(new Date().getTime() + Number(send_to_mail.later))
                order_send = 1
            }else{
                order_send = 1
            }
            court_id = court ? court.id :court_id
            let originServiceId = service.id
            let result = await ordersService.createOrder({
                user_id: userId ? userId :null,
                city: city ? city : null,
                department : department ? department : null,
                delivery_type :delivery_type ? delivery_type : null,
                pay_type : pay_type ? pay_type :null,
                additional_id: originServiceId,
                price:service.price ? service.price : null,
                court_price: court && court.price ? court.price : null,
                total_price :service.price ? service.price :null,
                status:service && service.type  && service.type == 3 ? 25:11,
                pay_status: service && service.type  && service.type == 3 ? null:config.BOOKING_PAY_STATUSES.NOT_PAID,
                send_status:order_send ? order_send : null,
                send_time:order_send_time ? order_send_time : null,
                service_type:service.type ? service.type:null,
                user_name: name ? name: null,
                user_phone : phone ? phone :null,
                comment: message ? message : null,
                court_id:court_id ? court_id :null,
                parent_order_id: order_id ? order_id: null
            }, null,null,transaction);

            await ordersService.addFormFieldsToOrder(result.id,order_id,transaction)

            if(req.fileInfo){
                let document = {
                    filename:req.nameImage,
                    user_id:req.client_id,
                    type:req.typeImage,
                    file_type:req.fileInfo ? req.fileInfo.mimetype : null,
                    level:req.level
                }
                await userService.uploadUserDocuments(document,result.id,transaction)
            }


            let order = await ordersService.getOrdersByFilter({ id: result.id },transaction);

            if(service.type !=3){
                const formData = new FormData();

                let htmlToDocFunc = async (html) => {
                    let doc = await HTMLtoDOCX(html, {header: true}, {margins:{ right: 1000, left: 1000, top: 1440, bottom: 1440, header: 720, footer: 720, gutter: 0  } });
                    // fs.createWriteStream('documents/DOC.docx').write(doc);
                    let docName = service.title + ' - ' + order.user.first_name + ' ' + order.user.last_name;
                    docName = docName.replace(/<[^>]*>?/gm, '');
                    fs.writeFileSync(`documents/${docName}.docx`,doc)
                    fs.writeFileSync('documents/DOC.docx',doc)

                    // const doc_file = await fs.readFileSync('documents/DOC.docx')
                    formData.append('order_id', order.id);
                    formData.append('document', doc, `documents/${docName}.docx`);
                    formData.append('user_id',userId);

                }
                let file_name
                if(service && service.template_doc){
                    let html = service.template_doc
                    if(order.orders_form_results && order.orders_form_results){
                        order.orders_form_results.forEach(item => {
                            html = html.replace( new RegExp( `{{${item.name_field}}}`, "g" ), item.value );
                        })
                    }
                    if(html){
                        let court = await models.courts.findOne({where: {id: order.court_id, lang: lang}});
                        if(court) {
                            let court_html = '<p style="text-align: right;">';
                            if(court.title) court_html += `<span lang="${lang}">${court.title}</span><br>`;
                            if(court.address) court_html += `<span lang="${lang}">${court.address}</span><br>`;
                            if(court.email) court_html += `<span lang="${lang}">${court.email}</span><br>`;
                            court_html += '</p>';
                            html = court_html + html;
                        }
                        html =  html.replace(/ *\{[^}]*\} */g,'')
                        html =  html.replace(/}/g,'')
                        await htmlToDocFunc(html);
                        let result = await  axios.post(`${config.FRONT_URL}/upload/uploadFileServiceDocument?client_id=${userId}`,formData,{
                            headers: {
                                ...formData.getHeaders(),
                            },
                        })
                        file_name = result.data.filename
                        if(result.data && result.data.id){
                            await models.orders_to_user_uploaded_files.create({
                                order_id:order.id,
                                user_uploaded_files_id:result.data.id,
                            },{transaction})
                        }else{
                            await transaction.rollback();
                        }
                    }
                }
                if(send_to_mail && send_to_mail.enabled && send_to_mail.in_create && service.type != 3 && order.pay_status == 2){
                    if(send_to_mail.message_to_e_mail){
                        let clientMailObj = {
                            to: order.user.email,
                            subject: 'Доброго дня, ваш документ!',
                            data: {
                                name: service.title,
                                order:order,
                                lang: lang
                            },
                            attachments:[
                                {
                                    path:config.FRONT_URL + '/booking/getFileOrders/'+order.id,
                                    filename:file_name
                                }
                            ]
                        };
                        emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                    }

                }
            }
            await transaction.commit();
            if(order && order.user){
                if (pre_send_to_mail) {
                    let adminEmails = pre_send_to_mail.trim().split(",");
                    for (let adminEmail of adminEmails) {
                        let mailObj = {
                            to: adminEmail,
                            subject: 'Нове замовлення!',
                            data: {
                                info: { title:service.title, id:order.id, name:order.user.name,phone:order.user.phone,email:order.user.email,pay_type:order.pay_type,first_name:order.user.first_name,last_name:order.user.last_name },
                                lang:'uk'
                            }
                        };
                        emailUtil.sendMail(mailObj, 'order-pre-question-to-admin');
                    }
                }

                if(order.user.email){
                    let clientMailObj = {
                        to: order.user.email,
                        subject: 'Вітаємо, ви заповнили форму послуги!',
                        data: {
                            name: order.user.email,
                            message: service.title,
                            order:order,
                            lang: lang
                        }
                    };
                    emailUtil.sendMail(clientMailObj, 'order-pre-question-to-user');
                }
            }
            if (pay_type == "1") {
                let pay_types = await models.configs.findOne({where:{type: 'pay_types',lang:lang}});
                pay_types = JSON.parse(pay_types.value);

                let public_key = pay_types[1].liqpay_public_key
                let private_key = pay_types[1].liqpay_private_key

                const LiqPay = require('../utils/liqpay-util');
                const liqpay = new LiqPay(public_key, private_key);
                const result = liqpay.cnb_object({
                    'action': 'pay',
                    'amount': order.total_price,
                    'currency': 'UAH',
                    'description': `Order ${order.id} payment`,
                    'order_id': order.id,
                    'version': '3',
                    'result_url': lang == "uk" ? `${config.FRONT_URL}/payment/cabinet/thank_you/${order.id}/${userId}/${pay_type}/${additional_id}` : `${config.FRONT_URL}/${lang}/payment/cabinet/thank_you/${order.id}/${userId}/${payment_type}/${additional_id}`,
                    'server_url': `${config.FRONT_URL}/payment/liqPayCallBack`
                });
                console.log(lang == "uk" ? `${config.FRONT_URL}/payment/cabinet/thank_you/${order.id}/${userId}/${pay_type}/${additional_id}` : `${config.FRONT_URL}/${lang}/payment/cabinet/thank_you/${order.id}/${userId}/${payment_type}/${additional_id}`,'325566352363534')
                log.info(`End post checkoutOrder:`);
                return res.status(200).json({ link: `https://www.liqpay.ua/api/3/checkout?data=${result.data}&signature=${result.signature}` })
            }else{
                if(service.type != 3){
                    await notificationService.createNotification(config.NOTIFICATION_TYPES.ORDER, userId, null, order.id);
                    return  res.status(200).json({link: lang == "uk" ? `${config.FRONT_URL}/payment/cabinet/thank_you/${order.id}/${userId}/${pay_type}/${additional_id}` : `${config.FRONT_URL}/${lang}/payment/cabinet/thank_you/${order.id}/${userId}/${payment_type}/${additional_id}`})
                }else{
                    return res.status(200).json(true)
                }
            }
        } catch (error) {
            log.error(`${error}`);
            if(transaction)await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    preCreateOrder:async (req,res)=>{
        let user;
        const lang = req.lang;
        let userId = req.user ? req.user.userid : null;
        if(!req.body.service_id)req.body = req.body.data ? JSON.parse(req.body.data) : null;
        let {
            city,
            department,
            delivery_type,
            pay_type,
            forms_all,
            service_id,
            register_email,
            register_phone,
            register_first,
            register_last,
            register_sur,
            court_id,
            region_court,
            court_city,
            name,
            phone,
            message,
            create_address,
            create_house,
            create_passport,
            create_inn,
            birthday,
            create_apartment,
            create_is_private
        } = req.body;
        let transaction;
        try {
            pay_type = pay_type ? pay_type :config.SERVICE_PAY_TYPE.NOT_PAID
            let payment_type = pay_type
            transaction = await sequelize.transaction();
            let onlinePayment
            if(pay_type == 1){
                onlinePayment = true
            }else{
                onlinePayment = false
            }

            let court
            let service = await ordersService.getService({id:service_id},transaction)
            if(service){
                const ip = requestIp.getClientIp(req)

                let ipCountry = await axios({
                    method: 'get',
                    url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                })
                if(ipCountry)ipCountry = ipCountry.data
                if(service.service_country_pricing && service.service_country_pricing.length && ipCountry && ipCountry.country){
                    for(let country_price of service.service_country_pricing){
                        if(country_price.ip == ipCountry.country){
                            service.price = country_price.price
                        }
                    }
                }
            }
            // if(service && service.type && service.type != 3){
            //     if(court_id){
            //         court = await ordersService.getCourt({id:court_id},transaction)
            //     }else if (region_court && court_city){
            //         court =  await userService.getCourtByOrder({city:court_city,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},region_court)
            //         if(!court){
            //             await transaction.commit();
            //             return res.status(200).json({validate_court_error:true})
            //         }
            //     }else{
            //         await transaction.commit();
            //         return res.status(200).json({validate_court_error:true})
            //     }
            // }
            // let send_to_mail = await models.configs.findOne({where:{type:'orders_mail_to_client',lang:service.lang},raw:true,transaction})
            let send_to_mail = service.options
            let pre_send_to_mail = await models.configs.findOne({where:{type:"pre_orders_emails",lang:service.lang},raw:true,transaction})
            if(send_to_mail){
                send_to_mail = JSON.parse(send_to_mail)
                if(send_to_mail.later){
                    send_to_mail.later = Number(send_to_mail.later) / 60 / 1000
                }
            }
            if(pre_send_to_mail){
                pre_send_to_mail = (pre_send_to_mail.value)
            }

            if(!service || service && !service.price && service.type == 1){
                await transaction.commit();
                return res.status(errors.CLIENT_BAD_REQUEST.code).json({
                    message: errors.CLIENT_BAD_REQUEST.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST.code,
                });
            }
            let order_send
            let order_send_time
            if(send_to_mail && send_to_mail.enabled && send_to_mail.in_create && service.type != 3){
                order_send = 1
            }else if(send_to_mail && send_to_mail.enabled && !send_to_mail.in_create && service.type != 3){
                order_send_time =new Date(new Date().getTime() + Number(send_to_mail.later))
                order_send = 1
            }else{
                order_send = 1
            }
            if(!name){
                name =register_first && register_last  ? register_first +' '+register_last:null;
            }
            if(!phone){
                phone = register_phone ? register_phone :null;
            }
            court_id = court ? court.id :court_id
            let originServiceId = service.origin_id ? service.origin_id : service.id ;
            let order = await ordersService.createOrder({
                user_id: userId ? userId :null,
                city: city ? city : null,
                department : department ? department : null,
                delivery_type :delivery_type ? delivery_type : null,
                pay_type : pay_type ? pay_type :null,
                service_id: originServiceId,
                price:service.price ? service.price : null,
                court_price: court && court.price ? court.price : null,
                total_price :service.price ? service.price :null,
                status:31,
                pay_status: service && service.type  && service.type == 3 ? null:config.BOOKING_PAY_STATUSES.NOT_PAID,
                send_status:order_send ? order_send : null,
                send_time:order_send_time ? order_send_time : null,
                service_type:service.type ? service.type:null,
                user_name: name ? name: null,
                user_phone : phone ? phone :null,
                comment: message ? message : null,
                court_id:court_id ? court_id :null,
            },forms_all,null,transaction);
            await transaction.commit();
            if(order){
                if (pre_send_to_mail && service && service.type != '3') {
                    let adminEmails = pre_send_to_mail.trim().split(",");
                    for (let adminEmail of adminEmails) {
                        let mailObj = {
                            to: adminEmail,
                            subject: 'Нове замовлення!',
                            data: {
                                info: { title:service.title, id:order.id},
                                lang:'uk'
                            }
                        };
                        emailUtil.sendMail(mailObj, 'order-pre-question-to-admin');
                    }
                }
            }
            return res.json({
                order_id:order.id
            })
        } catch (error) {
            console.log(error,'325236565454646345345')
            log.error(`${error}`);
            if(transaction)await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    createOrder: async (req, res) => {
        let user;
        const lang = req.lang;
        let userId = req.user ? req.user.userid : null;
        if(!req.body.service_id)req.body = req.body.data ? JSON.parse(req.body.data) : null;
        let {
            city,
            department,
            delivery_type,
            pay_type,
            forms_all,
            service_id,
            register_email,
            register_phone,
            register_first,
            register_last,
            register_sur,
            court_id,
            region_court,
            court_city,
            name,
            phone,
            message,
            create_address,
            create_house,
            create_passport,
            create_inn,
            birthday,
            create_apartment,
            create_is_private,
            pre_order_create,
        } = req.body;
        let transaction;
        try {
            pay_type = pay_type ? pay_type :config.SERVICE_PAY_TYPE.NOT_PAID
            let payment_type = pay_type
            transaction = await sequelize.transaction();
            let onlinePayment
            if(pay_type == 1){
                onlinePayment = true
            }else{
                onlinePayment = false
            }

            let court
            let service = await ordersService.getService({id:service_id},transaction)
            if(service){
                const ip = requestIp.getClientIp(req)

                let ipCountry = await axios({
                    method: 'get',
                    url: `http://ipinfo.io/${ip}?token=bd233e88429807`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                })
                if(ipCountry)ipCountry = ipCountry.data
                if(service.service_country_pricing && service.service_country_pricing.length && ipCountry && ipCountry.country){
                    for(let country_price of service.service_country_pricing){
                        if(country_price.ip == ipCountry.country){
                            service.price = country_price.price
                        }
                    }
                }
            }
            if(service && service.type && service.type != 3){
                if(court_id){
                    court = await ordersService.getCourt({id:court_id},transaction)
                }else if (region_court && court_city){
                    court =  await userService.getCourtByOrder({city:court_city,lang:lang,status:config.GLOBAL_STATUSES.ACTIVE},region_court)
                    if(!court){
                        await transaction.commit();
                        return res.status(200).json({validate_court_error:true})
                    }
                }else{
                    await transaction.commit();
                    return res.status(200).json({validate_court_error:true})
                }
            }
            // let send_to_mail = await models.configs.findOne({where:{type:'orders_mail_to_client',lang:service.lang},raw:true,transaction})
            let send_to_mail = service.options
            let pre_send_to_mail = await models.configs.findOne({where:{type:"pre_orders_emails",lang:service.lang},raw:true,transaction})
            if(send_to_mail){
                send_to_mail = JSON.parse(send_to_mail)
                if(send_to_mail.later){
                    send_to_mail.later = Number(send_to_mail.later) / 60 / 1000
                }
            }
            if(pre_send_to_mail){
                pre_send_to_mail = (pre_send_to_mail.value)
            }

            if(!service || service && !service.price && service.type == 1){
                await transaction.commit();
                return res.status(errors.CLIENT_BAD_REQUEST.code).json({
                    message: errors.CLIENT_BAD_REQUEST.message[lang],
                    errCode: errors.CLIENT_BAD_REQUEST.code,
                });
            }
            if(!userId && service.type != 3){
                let user = await models.user.findOne({ where:{phone:register_phone} });
                if(user && user.blocked){
                    log.error(`User blocked: ${user}`);
                    await transaction.commit();
                    return res.status(errors.CLIENT_BAD_REQUEST.code).json({
                        message: errors.CLIENT_BAD_REQUEST.message[lang],
                        errCode: errors.CLIENT_BAD_REQUEST.code,
                    });
                }else if(user && !user.blocked){
                    userId = user.id
                }else{
                    let phone_to_cognito = register_phone.replace(/[()\s]/g, '');
                    const password = generator.generate({
                        length: 10,
                        numbers: true,
                        uppercase: true,
                        lowercase: true,
                        symbols: true
                    });
                    let userCognito = await utilsCognito.createUserCognito({ username:phone_to_cognito, password:password }).catch((err) => {
                        if (err) {
                            log.error(`Failed to create user, ${err.message}: ${phone_to_cognito}`);
                            err.code = 400;
                            // throw err;
                        }
                    });
                    await utilsCognito.confirmUser(phone_to_cognito)

                    if(birthday){
                        let [day, month, year] = birthday.split('.');
                        birthday = new Date(+year, +month, +day);
                        birthday.setHours(birthday.getHours() + 3)
                    }
                    let filter_phone
                    if(register_phone){
                        filter_phone = register_phone.replace(/[- )(]/g,'')
                    }
                    const { userSub: user_id } = userCognito;
                    if (userCognito && userCognito.userSub) {
                       let user_create =  await models.user.create({
                            email:register_email,
                            phone:register_phone,
                            filter_phone:filter_phone ? filter_phone :null,
                            address :create_address ? create_address :null,
                            house:create_house ? create_house :null,
                            first_name:register_first ? register_first :null,
                            last_name:register_last ? register_last :null,
                            father_name:register_sur ? register_sur :null,
                            inn: create_inn ? create_inn :null,
                            birthday_date : birthday ? birthday:null,
                            num_passport: create_passport ? create_passport :null,
                            apartment : create_apartment ? create_apartment :null,
                            is_private : create_is_private && create_is_private == '2'? 2 :1,
                            cognito_id: userCognito.userSub,
                            confirm_token: null,
                            confirm_token_type: null,
                            confirm_token_expires: null,
                            mail_verified: true,
                            status: config.GLOBAL_STATUSES.ACTIVE,
                        },{transaction});
                        // let newUser = await models.user.findOne({where: {phone: phone_number}, raw: true})
                        userId = user_create.id
                        await notificationService.createNotification(config.NOTIFICATION_TYPES.REGISTER, userId);
                    }
                    let adminMails = await models.configs.findOne({
                        where: { type: "register_emails" },transaction
                    });
                    if (adminMails.value) {
                        let adminEmails = adminMails.value.trim().split(",");
                        for (let adminEmail of adminEmails) {
                            let mailObjToAdmin = {
                                to: adminEmail,
                                subject: config.TEXTS[lang].new_user,
                                data: {
                                    email: register_email,
                                    phone: register_phone,
                                    lang: lang
                                },
                            };
                            emailUtil.sendMail(mailObjToAdmin, "verify-to-admin");
                        }
                    }
                    let mailObjToClient = {
                        to: register_email,
                        subject: config.TEXTS[lang].register_congratulation_text,
                        data: {
                            info: {
                                first_name:register_first,
                                last_name:register_last,
                                email: register_email,
                                phone: register_phone,
                                password:password,
                                lang: lang
                            },
                            lang: lang
                        },
                    };
                    emailUtil.sendMail(mailObjToClient, "form-to-client");
                }
            }
            let order_send
            let order_send_time
            if(send_to_mail && send_to_mail.enabled && send_to_mail.in_create && service.type != 3){
                order_send = 1
            }else if(send_to_mail && send_to_mail.enabled && !send_to_mail.in_create && service.type != 3){
                order_send_time =new Date(new Date().getTime() + Number(send_to_mail.later))
                order_send = 1
            }else{
                order_send = 1
            }
            court_id = court ? court.id :court_id
            let originServiceId = service.origin_id ? service.origin_id : service.id ;
            let result = await ordersService.createOrder({
                user_id: userId ? userId :null,
                city: city ? city : null,
                department : department ? department : null,
                delivery_type :delivery_type ? delivery_type : null,
                pay_type : pay_type ? pay_type :null,
                service_id: originServiceId,
                price:service.price ? service.price : null,
                court_price: court && court.price ? court.price : null,
                total_price :service.price ? service.price :null,
                status:service && service.type  && service.type == 3 ? 25:11,
                pay_status: service && service.type  && service.type == 3 ? null:config.BOOKING_PAY_STATUSES.NOT_PAID,
                send_status:order_send ? order_send : null,
                send_time:order_send_time ? order_send_time : null,
                service_type:service.type ? service.type:null,
                user_name: name ? name: null,
                user_phone : phone ? phone :null,
                comment: message ? message : null,
                court_id:court_id ? court_id :null,
            },forms_all,pre_order_create,transaction);

            if(req.files && req.files.length){
                for(let file of req.files){
                    let document = {
                        filename:file.originalname,
                        user_id:null,
                        type:file.fieldname,
                        file_type:file.contentType ? file.contentType : null,
                        level:req.level
                    }
                    await userService.uploadUserDocuments(document,result.id,transaction)
                }
            }else if(req.fileInfo){
                let document = {
                    filename:req.nameImage,
                    user_id:req.client_id,
                    type:req.typeImage,
                    file_type:req.fileInfo ? req.fileInfo.mimetype : null,
                    level:req.level
                }
                await userService.uploadUserDocuments(document,result.id,transaction)
            }
            let order = await ordersService.getOrdersByFilter({ id: result.id },transaction);

            if(service.type !=3){
                const formData = new FormData();

                let htmlToDocFunc = async (html) => {
                    let doc = await HTMLtoDOCX(html, {header: true}, {margins:{ right: 1000, left: 1000, top: 1440, bottom: 1440, header: 720, footer: 720, gutter: 0  } });
                    // fs.createWriteStream('documents/DOC.docx').write(doc);
                    let docName = service.title + ' - ' + order.user.first_name + ' ' + order.user.last_name;
                    docName = docName.replace(/<[^>]*>?/gm, '');
                    fs.writeFileSync(`documents/${docName}.docx`,doc)

                    // const doc_file = await fs.readFileSync('documents/DOC.docx')
                    formData.append('order_id', order.id);
                    formData.append('document', doc, `documents/${docName}.docx`);
                    formData.append('user_id',userId);

                }
                let file_name
                if(service && service.template_doc){
                    let html = service.template_doc
                    if(order.orders_form_results && order.orders_form_results){
                        for (let item of order.orders_form_results ){
                            if(item.type == 9){
                                let value =''
                                let splitVal
                                if(item.value){
                                    splitVal = item.value.split(',')
                                }
                                if(splitVal && splitVal.length){
                                    value = splitVal[0]
                                    if(item.house){
                                        value = value+', '+item.house
                                    }
                                    if(item.apartment){
                                        value = value +', '+ item.apartment
                                    }
                                    for(let i=1; i < splitVal.length;i++){
                                        value = value +', '+splitVal[i]
                                    }
                                }else{
                                    if(item.house){
                                        value = value+', '+item.house
                                    }
                                    if(item.apartment){
                                        value = value +', '+ item.apartment
                                    }
                                }
                                if(value){
                                    item.value = value
                                }
                            }else if(item.type == 14){
                                if(item.value == "true" && item.service_form_field_id){
                                    let field_in_db = await ordersService.getFieldById({id:item.service_form_field_id})
                                    if(field_in_db && field_in_db.doc_1){
                                     item.value = JSON.parse(field_in_db.doc_1)
                                    }else{
                                        item.value = ''
                                    }
                                }else{
                                    item.value = ''
                                }
                            }else if(item.type == 15){
                                if(item.service_form_field_id){
                                    let field_in_db = await ordersService.getFieldById({id:item.service_form_field_id})
                                    if( item.value && field_in_db && field_in_db.doc_2 && field_in_db.child_name_field){
                                        let doc_2 = JSON.parse(field_in_db.doc_2)
                                        item.value = doc_2.replace( new RegExp( `{{${field_in_db.child_name_field}}}`, "g" ), item.value );
                                    }else if(!item.value && field_in_db && field_in_db.doc_1 || item.value == '' && field_in_db && field_in_db.doc_1){
                                        item.value = JSON.parse(field_in_db.doc_1)

                                    } else{
                                        item.value = ''
                                    }
                                }else{
                                    item.value = ''
                                }
                            }else if (item.type == 13){
                                let all_text=''
                                let field_in_db = await ordersService.getFieldById({id:item.service_form_field_id})
                                if(item.value && field_in_db && field_in_db.doc_1 && field_in_db.child_name_field){
                                    let childs = item.value.split(',')
                                    for(let i=0; i<childs.length;i++){
                                        if(i == 0){
                                            item.value = childs[i]+' ' +'року народження'
                                        }else{
                                            item.value = item.value +', '+childs[i]+' ' +'року народження'
                                        }
                                    }
                                    let one_child = JSON.parse(field_in_db.doc_1)
                                    item.value = one_child.replace( new RegExp( `{{${field_in_db.child_name_field}}}`, "g" ), item.value);
                                }else if(field_in_db && field_in_db.doc_2){
                                    item.value = JSON.parse(field_in_db.doc_2)
                                }
                            }
                            if(!item.value)item.value = ''
                            html = html.replace( new RegExp( `{{${item.name_field}}}`, "g" ), item.value );
                        }
                    }
                    if(html){
                        let court = await models.courts.findOne({where: {id: order.court_id, lang: lang}});
                        if(court) {
                            let court_html = '<p style="text-align: right;">'
                            if(court.title) court_html += `<span lang="${lang}">${court.title}</span><br>`;
                            if(court.address) court_html += `<span lang="${lang}">${court.address}</span><br>`;
                            if(court.email) court_html += `<span lang="${lang}">${court.email}</span><br>`;
                            court_html += '</p>';
                            html = court_html + html;
                        }
                        if(service.service_random_text && service.service_random_text.length){
                            let random_number = Math.floor(Math.random() * service.service_random_text.length)
                            if(random_number){
                                html = html.replace( new RegExp( '{{random_text}}', "g" ), service.service_random_text[random_number].text )
                            }
                        }
                        if(lang == 'uk') {
                            let today = new Date()
                            today = today.setHours(today.getHours() + 3)
                            let today_moon = moment(today).locale(lang).format('MMMM')
                            let tooday_day = moment(today).date();
                            let tooday_year = moment(today).year();
                            let date_text = tooday_day + ' ' + today_moon + ' ' + tooday_year + ' ' + 'року'
                            html = html.replace( new RegExp( '{{today_date}}', "g" ), date_text )
                        }
                        html =  html.replace(/ *\{[^}]*\} */g,'')
                        html =  html.replace(/}/g,'')
                        await htmlToDocFunc(html);
                        let result = await  axios.post(`${config.FRONT_URL}/upload/uploadFileServiceDocument?client_id=${userId}`,formData,{
                            headers: {
                                ...formData.getHeaders(),
                            },
                        })
                        file_name = result.data.filename
                        if(result.data && result.data.id){
                            await models.orders_to_user_uploaded_files.create({
                                order_id:order.id,
                                user_uploaded_files_id:result.data.id,
                            },{transaction})
                        }else{
                            await transaction.rollback();
                        }
                    }
                }
                if(send_to_mail && send_to_mail.enabled && send_to_mail.in_create && service.type != 3 && order.pay_status == 2){
                    if(send_to_mail.message_to_e_mail){
                        let clientMailObj = {
                            to: order.user.email,
                            subject: 'Доброго дня, ваш документ!',
                            data: {
                                name: service.title,
                                order:order,
                                lang: lang
                            },
                            attachments:[
                                {
                                    path:config.FRONT_URL + '/booking/getFileOrders/'+order.id,
                                    filename:file_name
                                }
                            ]
                        };
                        emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                    }

                }
            }
            await transaction.commit();
            if(order){
                if (pre_send_to_mail && service && service.type != '3' && !pre_order_create) {
                    let adminEmails = pre_send_to_mail.trim().split(",");
                    for (let adminEmail of adminEmails) {
                        let mailObj = {
                            to: adminEmail,
                            subject: 'Нове замовлення!',
                            data: {
                                info: { title:service.title, id:order.id, name:order.user.name,phone:order.user.phone,email:order.user.email,pay_type:order.pay_type,first_name:order.user.first_name,last_name:order.user.last_name },
                                lang:'uk'
                            }
                        };
                        emailUtil.sendMail(mailObj, 'order-pre-question-to-admin');
                    }
                }else if(service && service.type == '3'){
                    let adminEmails = pre_send_to_mail.trim().split(",");
                    let attachments =[]
                    let orderFiles =await ordersService.ordersGetAllOrdersFiles(order.id)
                    if(orderFiles && orderFiles.length){
                        for(let file of orderFiles){
                            let file_to = {
                                path:config.FRONT_URL + '/booking/getPreFileOrders/'+file.id,
                                filename:file.filename
                            }
                            attachments.push(file_to)
                        }
                    }
                    if(attachments && attachments.length){
                        for (let adminEmail of adminEmails) {
                            let mailObj = {
                                to: adminEmail,
                                subject: 'Нове замовлення!',
                                data: {
                                    info: {
                                        title:service.title,
                                        id:order.id,
                                        name: order.user &&  order.user.name ? order.user.name:null,
                                        phone: order.user && order.user.phone ? order.user.phone:null,
                                        email: order.user && order.user.email ? order.user.email:null,
                                        pay_type:order.pay_type,
                                        first_name:order.user && order.user.first_name ? order.user.first_name:null,
                                        last_name:order.user && order.user.last_name ? order.user.last_name:null
                                    },
                                    lang:'uk'
                                },
                                attachments:attachments
                            };
                            emailUtil.sendMail(mailObj, 'order-pre-question-to-admin');
                        }
                    }else{
                        for (let adminEmail of adminEmails) {
                            let mailObj = {
                                to: adminEmail,
                                subject: 'Нове замовлення!',
                                data: {
                                    info: { title:service.title, id:order.id, name:order.user.name,phone:order.user.phone,email:order.user.email,pay_type:order.pay_type,first_name:order.user.first_name,last_name:order.user.last_name },
                                    lang:'uk'
                                },
                            };
                            emailUtil.sendMail(mailObj, 'order-pre-question-to-admin');
                        }
                    }
                }

                if(order.user && order.user.email){
                    let clientMailObj = {
                        to: order.user.email,
                        subject: 'Вітаємо, ви заповнили форму послуги!',
                        data: {
                            name: order.user.email,
                            message: service.title,
                            order:order,
                            lang: lang
                        }
                    };
                    emailUtil.sendMail(clientMailObj, 'order-pre-question-to-user');
                }
            }
            if (pay_type == "1") {
                let pay_types = await models.configs.findOne({where:{type: 'pay_types',lang:service.lang}});
                pay_types = JSON.parse(pay_types.value);

                let public_key = pay_types[1].liqpay_public_key
                let private_key = pay_types[1].liqpay_private_key

                const LiqPay = require('../utils/liqpay-util');
                const liqpay = new LiqPay(public_key, private_key);
                const result = liqpay.cnb_object({
                    'action': 'pay',
                    'amount': order.total_price,
                    'currency': 'UAH',
                    'description': `Order ${order.id} payment`,
                    'order_id': order.id,
                    'version': '3',
                    'result_url': lang == "uk" ? `${config.FRONT_URL}/payment/thank_you/${order.id}/${userId}/${pay_type}/${service_id}` : `${config.FRONT_URL}/${lang}/payment/thank_you/${order.id}/${userId}/${payment_type}/${service_id}`,
                    'server_url': `${config.FRONT_URL}/payment/liqPayCallBack`
                });
                log.info(`End post checkoutOrder:`);
                return res.status(200).json({ link: `https://www.liqpay.ua/api/3/checkout?data=${result.data}&signature=${result.signature}` })
            }else{
                if(service.type != 3){
                    await notificationService.createNotification(config.NOTIFICATION_TYPES.ORDER, userId, null, order.id);
                    return  res.status(200).json({link: lang == "uk" ? `${config.FRONT_URL}/payment/thank_you/${order.id}/${userId}/${pay_type}/${service_id}` : `${config.FRONT_URL}/${lang}/payment/thank_you/${order.id}/${userId}/${payment_type}/${service_id}`})
                }else{
                    return res.status(200).json(true)
                }
            }
        } catch (error) {
            log.error(`${error}`);
            if(transaction)await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    getCurrentCart: async (req, res) => {
        const cart = req.cart;
        const lang = req.lang;
        const languages = config.LANGUAGES
        let catalogPage = await pagesService.getPage({ lang, template: "collections" }, null, lang)
        let catalogLink = await linksService.getLinkByFilter({ original_link: `/shop/getCategories/${catalogPage.id}`, lang })
        catalogLink = catalogLink.toJSON()
        catalogPage.slug = catalogLink.slug
         if(catalogPage.slug) catalogPage.slug = lang === config.LANGUAGES[0] ? `${catalogPage.slug}` : `${lang}/${catalogPage.slug}`;
        const html = await templateUtil.getTemplate({ cart, lang, catalogPage }, 'client/cartAjax');
        return res.json({
            html: html
        })
    },
    addCart: async (req, res) => {
        log.info(`Start /addCart`);
        const lang = req.lang
        let { tempUser, product_id, product_collection, quantity, product_type, product_s, product_h, general_options, product_additional_options, product_collection_length, product_l, product_l1, product_l2, product_m, product_d, variation_id, is_update } = req.body;
        let user_id = req.user ? String(req.user.userid) : null;
        let additional_options = product_additional_options
        let parsed_additional_options
        let parsed_general_options
        if (additional_options) {
            parsed_additional_options = JSON.parse(additional_options)
            let arr = []
            for (let item of parsed_additional_options) {
                let value = await productService.getAtrByFilter({
                    [Op.or]: [{ id: item.originAtrId, lang: lang }, { origin_id: item.originAtrId, lang: lang }] })
                let no_option = value.no_option ? value.no_option : null

                if (!no_option) arr.push(item)
            }
            parsed_additional_options = arr
        }
        if (general_options) {
            parsed_general_options = JSON.parse(general_options)
        }
        let cart
        if (!user_id) user_id = tempUser
        quantity = quantity ? Number(quantity) : quantity;
        if (!product_id || !quantity) {
            return res.status(400).json({
                message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
            });
        }
        try {
            let product;
            if (parsed_additional_options && parsed_additional_options.length) {

                product = await productService.getProductByslug({
                    [Op.or]: [{ id: product_id, lang: lang }, { origin_id: product_id, lang: lang }]
                }, false, true, parsed_additional_options);

            } else {
                product = await productService.getProduct({
                    [Op.or]: [{ id: product_id, lang: lang }, { origin_id: product_id, lang: lang }]
                });
            }
            let obj = {
                'uk': "",
                "ru": "",
                "en": ""
            }


            if (parsed_general_options && parsed_general_options.length && !is_update) {
                let product2, product3


                if (lang == 'uk') {
                    product2 = await productService.getProduct({
                        [Op.or]: [{ id: product_id, lang: 'ru' }, { origin_id: product_id, lang: 'ru' }]
                    });
                    product3 = await productService.getProduct({
                        [Op.or]: [{ id: product_id, lang: 'en' }, { origin_id: product_id, lang: 'en' }]
                    });
                } else if (lang == 'ru') {
                    product2 = await productService.getProduct({
                        [Op.or]: [{ id: product_id, lang: 'uk' }, { origin_id: product_id, lang: 'uk' }]
                    });
                    product3 = await productService.getProduct({
                        [Op.or]: [{ id: product_id, lang: 'en' }, { origin_id: product_id, lang: 'en' }]
                    });
                } else if (lang == 'en') {
                    product2 = await productService.getProduct({
                        [Op.or]: [{ id: product_id, lang: 'uk' }, { origin_id: product_id, lang: 'uk' }]
                    });
                    product3 = await productService.getProduct({
                        [Op.or]: [{ id: product_id, lang: 'ru' }, { origin_id: product_id, lang: 'ru' }]
                    });
                }






                if (lang == 'uk') obj.uk = parsed_general_options
                if (lang == 'ru') obj.ru = parsed_general_options
                if (lang == 'en') obj.en = parsed_general_options


                for (let i = 0; i < parsed_general_options.length; i++) {
                    if (parsed_general_options[i].index) {
                        if(product2 && product2.characteristics && product2.characteristics.length){
                            for (let k = 0; k < product2.characteristics.length; k++) {
                                if (i == k) {
                                    let splited = product2.characteristics[k].text.split(',')
                                    if (splited && splited.length > 1) {
                                        product2.characteristics[k].text = splited[parsed_general_options[i].index]
                                        product2.characteristics[k].index = parsed_general_options[i].index
                                    }

                                }
                            }
                        }
                    }
                }


                if (product2.lang == 'uk') obj.uk = product2.characteristics
                if (product2.lang == 'ru') obj.ru = product2.characteristics
                if (product2.lang == 'en') obj.en = product2.characteristics

                for (let i = 0; i < parsed_general_options.length; i++) {
                    if (parsed_general_options[i].index) {
                        if(product3 && product3.characteristics && product3.characteristics.length){
                            for (let k = 0; k < product3.characteristics.length; k++) {
                                if (i == k) {
                                    let splited = product3.characteristics[k].text.split(',')
                                    if (splited && splited.length > 1) {
                                        product3.characteristics[k].text = splited[parsed_general_options[i].index]
                                        product3.characteristics[k].index = parsed_general_options[i].index
                                    }

                                }
                            }
                        }
                    }
                }

                if (product3.lang == 'uk') obj.uk = product3.characteristics
                if (product3.lang == 'ru') obj.ru = product3.characteristics
                if (product3.lang == 'en') obj.en = product3.characteristics




            } else obj = parsed_general_options

            if (product.type && product.type == config.PRODUCT_TYPES.GLASS) {
                if (product_type == 'together-prod') {
                    if (is_update) {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? product_collection : null,
                            product_collection_length,
                        });
                    } else {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? JSON.stringify(product_collection) : null,
                            product_collection_length,
                        });
                    }
                } else {
                    cart = await cartService.getUserCartByFilter({
                        user_id,
                        product_id,
                        product_collection: null,
                        additional_options: parsed_additional_options && parsed_additional_options.length ? additional_options : '[]',
                        general_options: obj && !!(obj.hasOwnProperty('uk') && obj.hasOwnProperty('ru') && obj.hasOwnProperty('en')) ? JSON.stringify(obj) : '[]',
                        product_s: +product_s ? product_s : null,
                        product_h: +product_h ? product_h : null,
                    });
                }








            }
            else if (product.type && product.type == config.PRODUCT_TYPES.SHOWER) {

                if (product_type == 'together-prod') {
                    if (is_update) {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? product_collection : null,
                            product_collection_length,
                        });
                    } else {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? JSON.stringify(product_collection) : null,
                            product_collection_length,
                        });
                    }
                } else {
                    cart = await cartService.getUserCartByFilter({
                        user_id,
                        product_id,
                        product_collection: null,
                        additional_options: parsed_additional_options && parsed_additional_options.length ? additional_options : '[]',
                        general_options: obj && !!(obj.hasOwnProperty('uk') && obj.hasOwnProperty('ru') && obj.hasOwnProperty('en')) ? JSON.stringify(obj) : '[]',
                        product_s: +product_s ? product_s : null,
                        product_h: +product_h ? product_h : null,
                        product_l: +product_l ? product_l : null,
                        product_l1: +product_l1 ? product_l1 : null,
                        product_l2: +product_l2 ? product_l2 : null,
                        product_m: +product_m ? product_m : null,
                        product_d: +product_d ? product_d : null
                    });

                }
            } else if (product.type && product.type == config.PRODUCT_TYPES.SIMPLE) {
                if (product_type == 'together-prod') {
                    if (is_update) {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? product_collection : null,
                            product_collection_length,
                        });
                    } else {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? JSON.stringify(product_collection) : null,
                            product_collection_length,
                        });
                    }
                } else {
                    cart = await cartService.getUserCartByFilter({
                        user_id,
                        product_id,
                        product_collection: null,
                        general_options: obj && !!(obj.hasOwnProperty('uk') && obj.hasOwnProperty('ru') && obj.hasOwnProperty('en')) ? JSON.stringify(obj) : '[]',
                    });

                }
            } else if (product.type && product.type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS) {
                if (product_type == 'together-prod') {
                    if (is_update) {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? product_collection : null,
                            product_collection_length,
                        });
                    } else {
                        cart = await cartService.getUserCartByFilter({
                            user_id,
                            product_id,
                            product_collection: product_collection ? JSON.stringify(product_collection) : null,
                            product_collection_length,
                        });
                    }
                } else {
                    cart = await cartService.getUserCartByFilter({
                        user_id,
                        product_id,
                        product_collection: null,
                        variation_id: variation_id ? variation_id : null,
                        general_options: obj && !!(obj.hasOwnProperty('uk') && obj.hasOwnProperty('ru') && obj.hasOwnProperty('en')) ? JSON.stringify(obj) : '[]',
                    });

                }
            }





            if (!cart) {
                await cartService.createUserCart({
                    user_id: user_id,
                    product_id,
                    product_collection: product_collection ? JSON.stringify(product_collection) : null,
                    quantity,
                    product_s: +product_s ? product_s : null,
                    product_h: +product_h ? product_h : null,
                    product_l: +product_l ? product_l : null,
                    product_l1: +product_l1 ? product_l1 : null,
                    product_l2: +product_l2 ? product_l2 : null,
                    product_m: +product_m ? product_m : null,
                    product_d: +product_d ? product_d : null,
                    variation_id: variation_id ? variation_id : null,
                    general_options: obj && !!(obj.hasOwnProperty('uk') && obj.hasOwnProperty('ru') && obj.hasOwnProperty('en')) ? JSON.stringify(obj) : '[]',
                    additional_options: parsed_additional_options && parsed_additional_options.length ? additional_options : '[]',
                    product_collection_length
                });
            } else {
                if (is_update) {
                    await cart.update({ quantity: quantity });
                } else {
                    await cart.update({ quantity: (+cart.quantity) + quantity });
                }
            }


            log.info(`End /addCart`);
            return res.status(200).json(true);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    deleteCart: async (req, res) => {
        log.info(`Start /deleteCart`);
        let { tempUser, product_id, total_price, product_s, product_h, product_type, product_collection_length, product_l, product_l1, product_l2, product_m, product_d, product_additional_options, variation_id, general_options, product_collection } = req.body;
        let additional_options = product_additional_options ? JSON.parse(product_additional_options) : null
        let product_general_options = general_options ? JSON.parse(general_options) : null
        let user_id = req.user ? String(req.user.userid) : null;
        if (!user_id) user_id = tempUser
        if (!product_id) {
            return res.status(400).json({
                message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
            });
        }

        try {
            if (product_type == 'together-prod') {
                cart = await cartService.deleteUserCartByFilter({
                    user_id,
                    product_id,
                    product_collection_length,
                    product_collection
                });
            } else {
                cart = await cartService.deleteUserCartByFilter({
                    user_id,
                    product_id,
                    product_collection: null,
                    additional_options: additional_options && additional_options.length ? product_additional_options : '[]',
                    general_options: product_general_options && Object.keys(product_general_options).length ? general_options : '[]',
                    product_s: product_s ? product_s : null,
                    product_h: product_h ? product_h : null,
                    product_l: product_l ? product_l : null,
                    product_l1: product_l1 ? product_l1 : null,
                    product_l2: product_l2 ? product_l2 : null,
                    product_m: product_m ? product_m : null,
                    product_d: product_d ? product_d : null,
                    variation_id: variation_id ? variation_id : null,
                });
            }
            log.info(`End /deleteCart`);
            return res.status(200).json(true);

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
    getCurrentCheckout: async (req, res) => {
        const lang = req.lang;
        const userId = req.user ? req.user.userid : null;

        let favProducts = req.favProducts;
        let favorite = favProducts && favProducts.length ? favProducts.length : 0;
        let cart = req.cart;
        let page_settings = await models.configs.findOne({ where: { type: 'pages_settings', lang: lang }, raw: true });
        if (page_settings && page_settings.value) page_settings = JSON.parse(page_settings.value)
        if (page_settings && page_settings.checkout) page_settings = page_settings.checkout

        let user;
        // let userAddresses
        let header_footer = await menuService.getHeaderFooter(lang);
        let menu = await menuService.getMenu(lang);
        if (userId) {
            user = await userService.getUser(userId, ['id', 'email', 'first_name', 'last_name', 'phone', 'role']);
            user = user ? user.toJSON() : user;
            // if (user) {
            //     userAddresses = await userService.findUsersAddressesByFiler({ user_id: user.id })
            // }
        }

        let self_pickup = await models.configs.findOne({ where: { type: 'self_pickup', lang }, raw: true })
        self_pickup = self_pickup && self_pickup.value ? JSON.parse(self_pickup.value) : [];

        let delivery_types = await models.configs.findOne({ where: { type: 'delivery_types' } });
        delivery_types = JSON.parse(delivery_types.value);

        let pay_types = await models.configs.findOne({ where: { type: 'pay_types' } });
        pay_types = JSON.parse(pay_types.value);

        let catalogPage = await pagesService.getPage({ lang, template: "collections" }, null, lang)
        let catalogLink = await linksService.getLinkByFilter({ original_link: `/shop/getCategories/${catalogPage.id}`, lang })
        catalogLink = catalogLink.toJSON()
        catalogPage.slug = catalogLink.slug
        if(catalogPage.slug) catalogPage.slug = lang === config.LANGUAGES[0] ? `${catalogPage.slug}` : `${lang}/${catalogPage.slug}`;
        let browserPageName

        switch (lang) {
            case 'uk':
                browserPageName = "Оформлення замовлення"
                break;
            case 'ru':
                browserPageName = "Оформление заказа"
                break;
            case 'en':
                browserPageName = "Checkout"
                break;
            default:
                break;
        }

        let homePage = {}
        let getHomePage = await pagesService.getPage({ lang, template: "homepage" }, null, lang)
        if (getHomePage) {
            let homepageLink = await linksService.getLinkByFilter({ original_link: `/getPage/${getHomePage.id}`, lang })
            homepageLink = homepageLink.toJSON()
            homePage.slug = homepageLink.slug
            if(homePage.slug) homePage.slug = lang === config.LANGUAGES[0] ? `${homePage.slug}` : `${lang}${homePage.slug}`;
        }

        let slugs = {}
            const languages = config.LANGUAGES
            for(let i = 0; i < languages.length; i++){
                if(languages[i] == "uk"){
                    slugs.uk = '/checkout'
                } else slugs[languages[i]] = `/${languages[i]}/checkout`
            }

        return res.render('client/checkout', {
            langs: req.langs,
            lang: lang,
            slugs,
            browserPageName,
            homePage,
            page_settings: page_settings ? page_settings : null,
            layout: 'client/layout.hbs',
            metaData: req.body.metaData,
            favorite: favorite ? favorite : null,
            user,
            // userAddresses,
            cart: cart,
            self_pickup,
            catalogPage,
            header_footer: header_footer ? header_footer : null,
            menu: menu ? menu : null,
            pay_types: pay_types,
            delivery_types: delivery_types,
            isCheckout: true
        });


    },
    getCurrentOrder: async (req, res) => {
        const cart = req.cart;
        const lang = req.lang;
        const languages = config.LANGUAGES
        let catalogPage = await pagesService.getPage({ lang, template: "collections" }, null, lang)
        let catalogLink = await linksService.getLinkByFilter({ original_link: `/shop/getCategories/${catalogPage.id}`, lang })
        catalogLink = catalogLink.toJSON()
        catalogPage.slug = catalogLink.slug
        if(catalogPage.slug) catalogPage.slug = lang === config.LANGUAGES[0] ? `${catalogPage.slug}` : `${lang}/${catalogPage.slug}`;
        const html = await templateUtil.getTemplate({ cart, lang }, 'client/orderAjax');
        return res.json({
            html: html
        })
    }

}
