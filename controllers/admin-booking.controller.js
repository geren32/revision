const sequelize = require('../sequelize-orm');
const { Op } = require("sequelize");
const log = require("../utils/logger");
const addressService = require('../services/adress.service');
const bookingService = require('../services/booking.service');
const config = require('../configs/config');
const errors = require('../configs/errors');
const { models } = require('../sequelize-orm');
const emailUtil = require('../utils/mail-util');
const statusService = require('../services/status.service');
const adminOrdersService = require('../services/admin.orders.service');
const notificationService = require("../services/notification-service");
const ordersService = require("../services/order.service");
const requestIp = require("request-ip");
const axios = require("axios");
const userService = require("../services/user.service");
const generator = require("generate-password");
const utilsCognito = require("../utils/cognito-util");
const FormData = require("form-data");
const HTMLtoDOCX = require("html-to-docx");
const fs = require("fs");
const LiqPay = require("../utils/liqpay-util");
const s3Utill = require('../utils/s3-util')
const handlebars = require("handlebars");
const moment = require("moment");

module.exports = {
    getAllOrders: async (req, res) => {
        log.info(
            `Start post /getAllOrders. Params: ${JSON.stringify(req.body)}`
        );
       try{
        let page = req.body.current_page ? parseInt(req.body.current_page) : 0;
        let perPage = req.body.items_per_page ? parseInt(req.body.items_per_page) : 25;

           let statusCount = {
               all: await bookingService.countBookingsByParam({ status: { [Op.ne]: 1 } })
           };
           let ordersStatuses = await statusService.getOrderStatusesByFilter({status: config.GLOBAL_STATUSES.ACTIVE, lang: config.LANGUAGES[0]});
           ordersStatuses.map(async item => {
               statusCount[item.id] = await bookingService.countBookingsByParam({ status: item.id });
           })
        let bookings = await bookingService.getAllBookings(req.body, page, perPage);

        log.info(
            `End post /getAllOrders. Result: ${JSON.stringify({count: bookings.count, data: bookings.rows, statusCount})}`
        );
   return res.status(200).json( {count: bookings.count, data: bookings.rows, statusCount} );
        }
        catch(err){
            log.error(`${err}`);
          return  res.status(400).json({
                message: err.message,
                errCode: err.code
            });
        }
    },
    getBookingById: async (req, res) => {
        try{
            log.info(
                `Start get /getOrder/:id. Params: ${JSON.stringify(req.params)}`
            );
            let result = await bookingService.getBookingByFilter({id:req.params.id})
        log.info(
            `End get /getOrder/:id. Resuit: ${JSON.stringify(result)}`
        );
        return res.status(200).json(result);
    }
        catch (err) {
            log.error(`${err}`);
            return res.status(400).json({
                message: err.message,
                errCode: '400'
            });
        }
    },

    updateBookingById: async (req, res) => {
          let lang =req.lang;
          if(!lang) lang = config.LANGUAGES[0]
        let {id, status,pay_status,send_status,orders_form_results} = req.body;


        const isUpdateStatus = req.body && Object.keys(req.body).length === 2 && req.body.id && req.body.status ? true : false;

        // if(!isUpdateStatus){
        //     if(!id || !address || !address.first_name || !address.phone || !address.email || (!pay_type && pay_type != 0)) {
        //     return  res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
        //             message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
        //             errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
        //         });
        //
        //     }
        //     if (!config.REGEX_PHONE.test(address.phone) || address.phone.length != 19) {
        //     return res.status(errors.BAD_REQUEST_USER_PHONE_NOT_VALID.code).json({
        //             message: errors.BAD_REQUEST_USER_PHONE_NOT_VALID.message,
        //             errCode: errors.BAD_REQUEST_USER_PHONE_NOT_VALID.code,
        //         });
        //
        //     }
        //     let regexp = /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        //     if(!regexp.test(address.email)) {
        //     return  res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
        //             message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
        //             errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
        //         });
        //
        //     }
        //     if (!config.REGEX_EMAIL.test(address.email)) {
        //     return   res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
        //             message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
        //             errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
        //         });
        //
        //     }
        // }
        const transaction = await sequelize.transaction();
        log.info(
            `Start post /editOrder. Params: ${JSON.stringify(req.body)}`
        );
        try {
            let booking = await bookingService.getBookingById(id, transaction);
            if (!booking) {
              return  res.status(400).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code
                });

            }
            let sendMail;
            if(pay_status !== booking.pay_status && status != 27 && status != 28){
                if(pay_status == 1){
                    status = 11
                }else if(pay_status == 2){
                    status = 7
                }
            }
            if(status == 27 || status == 28){
                if(orders_form_results && orders_form_results.length){
                    await ordersService.createOrder({status:27},orders_form_results,booking.id,transaction)
                }
                if(orders_form_results && orders_form_results.length && booking.order_files && booking.order_files.length < 2){
                    let service
                        if(booking.service_id){
                            service  = await ordersService.getService({id:booking.service_id},transaction)
                        }else if(booking.additional_id){
                            service  = await ordersService.getServiceAdditional({id:booking.additional_id},transaction)
                        }

                    let htmlToDocFunc = async (html) => {
                        let doc = await HTMLtoDOCX(html, {header: true}, {margins:{ right: 1000, left: 1000, top: 1440, bottom: 1440, header: 720, footer: 720, gutter: 0  } });
                        return doc
                    }
                    let file_name = booking.order_files[0].filename
                    if(service && service.template_doc){
                        let html = service.template_doc
                        if(orders_form_results && orders_form_results.length){
                            for (let form of orders_form_results){
                                if(form.service_form_fields && form.service_form_fields.length){
                                    for(let item of form.service_form_fields){
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
                                            if(item.value == true && item.service_form_field_id){
                                                let field_in_db = await ordersService.getFieldById({id:item.service_form_field_id},transaction)
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
                                                let field_in_db = await ordersService.getFieldById({id:item.service_form_field_id},transaction)
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
                            }
                        }
                        // html = handlebars.compile(html);
                        // html = await html();
                        if(html){
                            let court = await models.courts.findOne({where: {id: booking.court_id, lang: lang}});
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
                            await s3Utill.updateFile(booking.order_files[0],await htmlToDocFunc(html));
                            let clientMailObj = {
                                to: booking.user.email,
                                subject: 'Доброго дня, ваш документ!',
                                data: {
                                    name: service.title,
                                    order:booking,
                                    lang: lang
                                },
                                attachments:[
                                    {
                                        path:config.FRONT_URL + '/booking/getFileOrders/'+booking.id,
                                        filename:file_name
                                    }
                                ]
                            };
                            emailUtil.sendMail(clientMailObj, 'document-order-to-client');
                            status = 7
                            pay_status = 2
                            send_status = send_status && send_status == 1 ? 2: 3
                        }
                    }
                }
            }
            if(status !== booking.status && status) {
                let new_status = await models.order_statuses.findOne({where:{id:status},raw:true,transaction})
                let old_status = await models.order_statuses.findOne({where:{id:booking.status},raw:true,transaction})
                    if(booking && booking.user_id) {
                        let mailObjToAdmin = {
                            to: booking.user.email,
                            subject: `Статус замовлення №${booking.id} змінено`,
                            data: {
                                booking:booking,
                                email: booking.user.email,
                                info: `Статус замовлення змінено з ${old_status.title} на ${new_status.title}`,
                                lang:lang
                            },
                        };
                        emailUtil.sendMail(mailObjToAdmin, "change-booking-status");
                    }
            }
            await bookingService.createBookingHistory({created_at: new Date().toISOString(), item_id: booking.id, user_id: req.userid, type: 'order'},transaction)
            await transaction.commit();
            await bookingService.editBooking({status,pay_status,send_status},id)
            booking = await bookingService.getBookingById(id);
            if(status !== booking.status) {
                await notificationService.createNotification(config.NOTIFICATION_TYPES.ORDER, booking.user_id, null, booking.id,null);
            }
            log.info(
                `End post /editOrder. Result: ${JSON.stringify(booking)}`
            );
            return res.status(200).json(booking);

        } catch (error) {
            await transaction.rollback();
            log.error(`${error}`);
         return  res.status(400).json({
                message: error.message,
                errCode: '400'
            });

        }
    },
    createOrder:async (req,res)=>{
        let user;
        let userId = null;
        let {
            city,
            department,
            delivery_type,
            pay_type,
            pay_status,
            send_status,
            orders_form_results,
            service_id,
            register_email,
            register_phone,
            court_id,
            region_court,
            court_city,
            register_first_name,
            register_last_name,
            register_sur,
            create_address,
            create_house,
            lang,
            create_inn,
            create_passport,
            create_apartment,
            create_zip_code,
            create_is_private,
            create_birthday,
        } = req.body;
        let transaction;
        if(!lang) lang = config.LANGUAGES[0];
        if(!register_first_name || !register_last_name || !register_email || !register_phone || !region_court || !court_city ||
            !orders_form_results || orders_form_results && !orders_form_results.length){
            return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });
        }
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

                    if(create_birthday){
                        create_birthday = new Date(create_birthday)
                        create_birthday.setHours(create_birthday.getHours() + 3)
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
                            filter_phone :filter_phone ? filter_phone :null,
                            first_name:register_first_name,
                            last_name:register_last_name,
                            father_name:register_sur ? register_sur :null,
                            address:create_address ? create_address :null,
                            house : create_house ? create_house : null,
                            inn:create_inn ? create_inn :null,
                            num_passport: create_passport ? create_passport :null,
                            apartment: create_apartment ? create_apartment:null,
                            zip_code : create_zip_code ? create_zip_code :null,
                            is_private : create_is_private ? 2 :1,
                            birthday_date: create_birthday ? create_birthday:null,
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
                                first_name:register_first_name,
                                last_name:register_last_name,
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
            let order_send_time
            if(send_to_mail && send_to_mail.enabled && !send_to_mail.in_create && send_status == 1){
                order_send_time =new Date(new Date().getTime() + Number(send_to_mail.later))
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
                total_price :service.price  ? service.price:null,
                status:11,
                pay_status: pay_status ? pay_type :config.BOOKING_PAY_STATUSES.NOT_PAID,
                send_status:send_status ? send_status : 1,
                send_time:order_send_time ?order_send_time : null,
                service_type:service.type ? service.type:null,
                court_id : court_id ? court_id :null

            },orders_form_results, null, transaction);
            let order = await ordersService.getOrdersByFilter({ id: result.id },transaction);
            await transaction.commit();
            if(service.type != 3){
                const formData = new FormData();

                let htmlToDocFunc = async (html) => {
                    let doc = await HTMLtoDOCX(html, {header: true}, {margins:{ right: 1000, left: 1000, top: 1440, bottom: 1440, header: 720, footer: 720, gutter: 0  } });
                    let docName = service.title + ' - ' + order.user.first_name + ' ' + order.user.last_name;
                    docName = docName.replace(/<[^>]*>?/gm, '');
                    // fs.createWriteStream('documents/DOC.docx').write(doc);
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
                        for(let item of order.orders_form_results){
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
                                if(item.value == true && item.service_form_field_id){
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
                        let court = await models.courts.findOne({where: {id: result.court_id, lang: lang}});
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
                            html = html.replace( new RegExp( '{{today_date}}', "g" ), service.service_random_text[random_number].text )
                        }
                        html =  html.replace(/ *\{[^}]*\} */g,'')
                        html =  html.replace(/}/g,'')
                        await htmlToDocFunc(html);
                        let resultFile = await  axios.post(`${config.FRONT_URL}/upload/uploadFileServiceDocument?client_id=${userId}`,formData,{
                            headers: {
                                ...formData.getHeaders(),
                            },
                        })
                        file_name = resultFile.data.filename
                        if(resultFile.data && resultFile.data.id){
                            await models.orders_to_user_uploaded_files.create({
                                order_id:order.id,
                                user_uploaded_files_id:resultFile.data.id,
                            },)
                        }
                    }
                }
                if(send_to_mail && send_to_mail.in_create && send_status && send_status == 1 && service.type != 3 && order.pay_status == config.BOOKING_PAY_STATUSES.PAID){
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
            if(order && order.user){
                if (pre_send_to_mail) {
                    let adminEmails = pre_send_to_mail.trim().split(",");
                    for (let adminEmail of adminEmails) {
                        let mailObj = {
                            to: adminEmail,
                            subject: 'Нове замовлення!',
                            data: {
                                info: { title:service.title, id:order.id, name:order.user.name,phone:order.user.phone,email:order.user.email,pay_type:order.pay_type },
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
            return res.status(200).json(order)
        } catch (error) {
            log.error(`${error}`);
            if(!transaction)await transaction.rollback();
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    },
    changeBookingStatusById: async (req, res) => {
        let { id, status } = req.body;
        const lang = req.lang
        if(!id || !status) {
           return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
            });

        }
        try {
            let booking = await bookingService.getBookingById(id);
            if (!booking) {
               return res.status(errors.BAD_REQUEST_ID_NOT_FOUND.code).json({
                    message: errors.BAD_REQUEST_ID_NOT_FOUND.message,
                    errCode: errors.BAD_REQUEST_ID_NOT_FOUND.code,
                });

            }
            let currentStatus = config.BOOKING_STATUSES[`${booking.status}`].value;
            let newStatus = config.BOOKING_STATUSES[`${status}`].value;
            await bookingService.editBooking({ status: status},id);


            await bookingService.createBookingHistory({created_at: new Date().toISOString(), item_id: booking.id, user_id: req.userid, type: 'order'})

           await bookingService.createBookingRevision({created_at: new Date().toISOString(), orders_id: booking.id, message: `${config.TEXTS[lang].change_booking_status} ${currentStatus} ${config.TEXTS[lang].change_status_on} ${newStatus}`});
           if(booking.address){
           let mailObj = {
                to: booking.address.email,
                subject: config.TEXTS[lang].change_booking_status,
                data: {
                    lang:lang,
                    booking: booking,
                    info: `${config.TEXTS[lang].change_booking_status} ${currentStatus} ${config.TEXTS[lang].change_status_on} ${newStatus}`
                }
            };
            await emailUtil.sendMail(mailObj, 'change-booking-status');
        }
            return res.status(200).json(booking);

        } catch (error) {
          return  res.status(400).json({
                message: error.message,
                errCode: ''
            });

        }
    },
    deleteBookingByIds: async (req, res) => {
        let { ids } = req.body;
        const transaction = await sequelize.transaction();
        try {
            log.info(
                `Start post /deleteOrders. Params: ${JSON.stringify(req.body)}`
            );
            let result = [];
            if (ids && ids.length) {
                for (let id of ids) {
                    let orders = await bookingService.getBookingById(id, transaction);
                    if (!orders) {
                        result.push({ id: id, deleted: false, error: `Не знайдено замовлення з id:${id}` })
                    }
                    if (orders && orders.status == config.GLOBAL_STATUSES.DELETED) {
                        await models.orders_revision.destroy({where: {orders_id: id}, transaction});

                        //await adminOrdersService.deleteOrders(id,transaction);
                        await bookingService.deleteBookingById(id,transaction)

                        result.push({ id: id, deleted: true, error: false });
                    } else {
                        let edit=await bookingService.editBooking({status:config.GLOBAL_STATUSES.DELETED},id,transaction);

                        result.push(edit);
                    }
                }
                await transaction.commit();
            }
            log.info(
                `End post /deleteOrders. Result: ${JSON.stringify(result)}`
            );
            return res.status(200).json(result);

        }
        catch (error) {
                log.error(`${error}`);
                if(transaction) await transaction.rollback();
                return res.status(400).json({
                    message: error.message,
                    errCode: '400'
                });
        }
    },
    getUserByPhone:async (req,res)=>{
        let phone =req.body.phone
        try {
            let result = await userService.getUserByPhone(phone)
            return res.status(200).json(result)
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: '400'
            });
        }
    },
}
