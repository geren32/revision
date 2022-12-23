

const service = require('../services/forms.service');
const fs = require('fs');
const emailUtil = require('../utils/mail-util');
const config = require('../configs/config')
const userService = require("../services/user.service");
const ordersService = require("../services/order.service");
const log = require("../utils/logger");

module.exports = {

    createNewComment: async(req, res) => {
        if(!req.body.phone)req.body = req.body.data ? JSON.parse(req.body.data) : null;
        let { message, email, name, form_id,phone,header_popup,page_link} = req.body;
        let form = await service.getFormById(form_id);
        let original_id
        if(form.origin_id == 0){
            original_id = form.id
        } else original_id = form.origin_id

        if(phone){
            phone = phone.replace(/[- )(]/g,'')
        }
        const lang =req.lang;
        try {
            if (form) {
                let result = await service.createFormComment({ message, email, name, phone, form_id: original_id, created_at: new Date().getTime() });
                let files =[]
                if(req.files && req.files.length){
                    for(let file of req.files){
                        let document = {
                            filename:file.originalname,
                            user_id:null,
                            type:file.fieldname,
                            file_type:file.contentType ? file.contentType : null,
                            level:req.level
                        }
                        let upload_file = await userService.uploadFormFiles(document,result.id)
                        files.push(upload_file)
                    }
                }
                let page_title = await service.getPageLink(page_link)
                if (result) {
                    if (form.emails) {
                        let attachments =[]
                        if(files && files.length){
                            for(let file of files){
                                let file_to = {
                                    path:config.FRONT_URL + '/booking/getPreFileOrders/'+file.id,
                                    filename:file.filename
                                }
                                attachments.push(file_to)
                            }
                        }
                        let adminEmails = form.emails.trim().split(",");
                        let getOriginForm = await service.getFormById(original_id);
                        if(attachments && attachments.length){
                            for (let adminEmail of adminEmails) {
                                let mailObj = {
                                    to: adminEmail,
                                    subject: header_popup ? config.TEXTS['uk'].call_me_back : getOriginForm.title,
                                    data: {
                                        info: { message, email, name,phone,page_title },
                                        lang:'uk'
                                    },
                                    attachments:attachments
                                };
                                emailUtil.sendMail(mailObj, 'form-question-to-admin');
                            }
                        }else{
                            for (let adminEmail of adminEmails) {
                                let mailObj = {
                                    to: adminEmail,
                                    subject: header_popup ? config.TEXTS['uk'].call_me_back : getOriginForm.title,
                                    data: {
                                        info: { message, email, name,phone,page_title },
                                        lang:'uk'
                                    }
                                };
                                emailUtil.sendMail(mailObj, 'form-question-to-admin');
                            }
                        }
                    }
                    if(email){
                        let clientMailObj = {
                            to: email,
                            subject: config.TEXTS[lang].message_has_been_sended,
                            data: {
                                name: name,
                                message: message,
                                lang: lang
                            }
                        };
                        emailUtil.sendMail(clientMailObj, 'form-question-to-client');
                    }

                }
                return res.json({ "form_id": form_id })
            } else {
                return res.status(400).json({
                    message: 'error',
                    errCode: '400'
                });}
        }catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.stack,
                errCode: '400'
            });
        }
    }
}
