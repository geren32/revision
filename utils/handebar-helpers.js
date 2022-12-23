const moment = require('moment');
const Handlebars = require('handlebars');
const jsonFile = require("edit-json-file");
const config = require('../configs/config');
const appUtils = require('../utils/app-util');
const options = appUtils.getArgs();
const fs = require('fs');

const localisation = function(value, lang) {
    let file = jsonFile(`./localisation/text_${lang}.json`);
    return file.get(value);
};

module.exports = {
    paginate: require('handlebars-paginate'),
    // register new function
    ifCond: function(v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            case 'includes':
                return (v1 && v1.includes(v2)) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },
    sliceStr: function(str) {
        return str.slice(0, 10);
    },

    splitStr: function(str, symbol) {
        return str.split(symbol).shift();
    },

    formatDateTime: function(str, type) {
        let date;
        if (type === 1) {
            date = moment(str).format('DD.MM.YYYY');
        } else if (type === 2) {
            date = moment(str).format('DD.MM.YYYY, HH:mm');
        } else if (type === 3) {
            date = moment(str).format('HH:mm DD.MM.YYYY');
        } else if (type === 4){
            date = moment(str).format('HH:mm');
        } else if(type === 5 && str){
            date = moment(str).format('DDMMYYYY');
        } else if(type === 6) {
            date = moment(str).format('HH:mm:ss DD.MM.YYYY');
        } else date = moment(str).format('DD.MM.YYYY, HH:mm:ss');
        return date;
    },
    formatFileSize: function(bytes) {
        const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ', 'ПБ'];
        let l = 0, n = parseInt(bytes, 10) || 0;

        while(n >= 1024 && ++l){
            n = n/1024;
        }

        return(n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
    },
    timeDifferenceToBeautyFormat: function(miliseconds, lang) {
        let seconds = Math.floor(miliseconds / 1000),
            minutes = Math.floor(seconds / 60),
            hours   = Math.floor(minutes / 60),
            days    = Math.floor(hours / 24),
            months  = Math.floor(days / 30),
            years   = Math.floor(days / 365);

        seconds %= 60;
        minutes %= 60;
        hours %= 24;
        days %= 30;
        months %= 12;
        if(years) {
            return `<b>${years}</b><b>${localisation('years', lang)}</b>`;
        } else if(months) {
            return `<b>${months}</b><b>${localisation('months', lang)}</b>`;
        } else if(days) {
            return `<b>${days}</b><b>${localisation('days', lang)}</b>`;
        } else if(hours) {
            return `<b>${hours}</b><b>${localisation('hours', lang)}</b>`;
        } else if(minutes) {
            return `<b>${minutes}</b><b>${localisation('minutes', lang)}</b>`;
        } else {
            return `<b>${seconds}</b><b>${localisation('seconds', lang)}</b>`;
        }
    },
    payTypeText:function (type,lang) {
        let result=config.SERVICE_PAY_TYPE_TEXT[type].type[lang]
        return result;
    },
    items: function(n, block) {
        var accum = '';
        for (var i = 0; i <= n; ++i) {
            block.data.index = i;
            block.data.first = i === 0;
            block.data.last = i === (n - 1);
            accum += block.fn(this);
        }
        return accum;
    },
    itemsFor: function(n, block) {
        var accum = '';
        for (var i = 0; i < n; ++i)
            accum += block.fn(i);
        return accum;
    },



    inc: function(value, options) {
        return parseInt(value) + 1;
    },

    concatArray: function(array, type) {
        let result = [];
        if (type === 1) result = array.map(i => { return ` ${i.region}` });
        if (type === 2) result = array.map(i => { return ` ${i.company_name}` });

        return result.toString();
    },

    isIn: function(value, array) {
        let result = false;
        if (array && array.length) {
            array.map(i => {
                if (i.id === value) result = true;
            })
        }
        return result;
    },
    switch: function(value, options) {
        this.switch_value = value;
        this.switch_break = false;
        return options.fn(this);
    },
    case: function(value, options) {
        if (value == this.switch_value) {
            this.switch_break = true;
            return options.fn(this);
        }
    },
    default: function(value, options) {
        if (this.switch_break == false) {
            return value;
        }
    },
    imagePathWebp: function(status,image, cropFolder) {
        let result = ''
        if (status && image && image.filenameWebp )
        {
            if (image && cropFolder) {
                if (image.type) {
                    result = `<source srcset="/uploads/${image.type ? image.type: ''}/${cropFolder}/${ image.filenameWebp}" type="image/webp">`;
                } else {
                    result = `<source srcset="/uploads/${ image.filenameWebp}" type="image/webp">`;
                }
            } else if (image && !cropFolder) {
                if (image.type) {
                    result = `<source srcset="/uploads/${image.type ? image.type: ''}/${ image.filenameWebp}" type="image/webp">`;
                } else {
                    result =  `<source srcset="/uploads/${ image.filenameWebp}" type="image/webp">`;
                }

            }
        }
        return result;
    },
    questionType: function(index,lang,plus){
        let result ;
        if(plus){
            index=index+1;
        }
        result=config.FAQ_TYPES[index].type[lang]
        return result;
    },
    imagePath: function(image, cropFolder,lightTheme,is_color) {
        const frontUrlImg = options['front-url-img'] ? options['front-url-img'] :""
        let result = ''
        if (image && cropFolder &&  typeof cropFolder === 'string' ) {
            if (image.type) {
                result = `${frontUrlImg}/uploads/${image.type ? image.type: ''}/${cropFolder}/${image.filename}`;
            } else if(cropFolder === 'original') {
                result = `${frontUrlImg}/uploads/${cropFolder}/${image.filename}`;
            } else {
                result = `${frontUrlImg}/uploads/${image.filename}`;
            }
        } else if (image && cropFolder && typeof cropFolder !== 'string'){
            if (image.type) {
                result = `${frontUrlImg}/uploads/${image.type ? image.type: ''}/${image.filename}`;
            } else {
                result = `${frontUrlImg}/uploads/${image.filename}`;
            }
        }else{
            result = `${frontUrlImg}/img/placeholder.png`;
        }

        return result;
    },

    findSectionByType: function(array, type) {
        return array.find(i => i.type === type);
    },
    findDeliveryType: function(i) {
        return config.DELIVERY_TYPES[i]
    },
    findStatusType: function(i) {
        if (config.BOOKING_STATUSES[i])
            return config.BOOKING_STATUSES[i].value
        else
            return false
    },
    findStatusTypeColor: function(i) {
        if (config.BOOKING_STATUSES[i])
            return config.BOOKING_STATUSES[i].item
        else
            return false
    },
    findStatusPayType: function(i) {
        if (config.PAY_TYPES[i])
            return config.PAY_TYPES[i].item
        else
            return false
    },

    parsePhone: function(data) {
        let html = ''
        data = data.split(',')

        for (let i of data) {
            html += `<a href="tel:${i}">${i}</a>`
        }
        return html

    },
    parseEmail: function(data) {
        let html = ''
        data = data.split(',')

        for (let i of data) {
            html += `<a href="mailto:${i}">${i}</a>`
        }
        return html

    },
    leftRight: function(data) {


        if (data) {
            return `left`

        } else {
            return `right`
        }



    },
    genereteMediaIcons: function(arr) {
        let icons = '';
        arr = JSON.parse(arr);
        if (arr && arr.length) {
            arr.forEach(i => {
                if (i == 1) {
                    icons = icons + '<img src="/img/icons/whatsapp.svg" alt="">'
                } else if (i == 2) {
                    icons = icons + '<img src="/img/icons/telegram.svg" alt="">'
                } else if (i == 3) {
                    icons = icons + '<img src="/img/icons/viber.svg" alt="">'
                } else if (i == 4) {
                    icons = icons + '<img src="/img/icons/messenger.svg" alt="">'
                }
            })
        }

        return new Handlebars.SafeString(icons);
    },

    localisation: localisation,
    menuRecourse: (children) => {
        return recursiveMenuBody(children);

    },
    findSectionByType: function(array, type) {
        return array.find(i => i.type === type);
    },
    getOriginId: function(obj) {
        if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
            return obj.origin_id ? obj.origin_id : obj.id;
        } else {
            return null;
        }
    },
    getInputType: function(arr) {
        return arr && Array.isArray(arr) && arr.length && arr.length <= 1 ? "checkbox" : "radio";
    },

    prodConfigImagPath: function(image) {
        let result = ''
        let current_file_extansion
        if (image && image.filename) current_file_extansion = image.filename.slice((Math.max(0, image.filename.lastIndexOf(".")) || Infinity) + 1);
        if (image) {
            if (image.type) {
                result = current_file_extansion == "svg" ?
                    `/uploads/${image.type ? image.type: ''}/original/${image.filename}` :
                    `/uploads/${image.type ? image.type: ''}/${image.filename}`;
            } else {
                result = current_file_extansion == "svg" ?
                    `/uploads/original/${image.filename}` :
                    `/uploads/${image.filename}`;
            }
        }
        return result;
    },
    findIfAttrChecked: function(attributesArr, item_attr_id, item_attr_value) {
        if (attributesArr && attributesArr.length) {
            for (let item of attributesArr) {
                if (item.val == item_attr_value && item.attr_id == item_attr_id) {
                    return 'checked'
                }
            }
        }

    },
    findIfOptionChecked: function(optionsArr, item_group_id) {
        if (optionsArr && optionsArr.length) {
            for (let item of optionsArr) {
                if (item == item_group_id) {
                    return 'checked'
                }
            }
        }

    },
    findIfAttrsDisabled: function(posibleAttributesArr, item_attr_id, item_attr_value) {
        if (posibleAttributesArr && posibleAttributesArr.length) {
            let isAttrFind = posibleAttributesArr.find(e => e.id == item_attr_id)
            if (isAttrFind) {
                let isFind = isAttrFind.value.find(e => e.id == item_attr_value)
                if (!isFind) {
                    return 'disabled'
                } else return ''
            } else return 'disabled'
        }
    },
    findIfOptionsDisabled: function(posibleOptionsArr, item_group_id) {
        if (posibleOptionsArr && posibleOptionsArr.length) {
            let isInclude = posibleOptionsArr.find(e => e.id == item_group_id);
            if (!isInclude) {
                return 'disabled'
            } else return ''
        }
    },
    parseOrStringify: function(obj,flag) {
        let result

        if(flag == 'parse'){
            result = JSON.parse(obj)
        }
        if(flag == 'stringify'){
            result = JSON.stringify(obj)
        }
        return result
    },



    getProductOptionTranslate:function(type,shower_type,lang,value_title_to_translate){
        if(type == 2 && shower_type){
            if(shower_type == 1){
                if(value_title_to_translate == "product_d") return config.TEXTS[lang].shyryna_dverej
                if(value_title_to_translate == "product_s") return config.TEXTS[lang].shyryna_peregorodku
                if(value_title_to_translate == "product_h") return config.TEXTS[lang].vysota_peregorodku
            }
            if(shower_type == 2){
                if(value_title_to_translate == "product_l") return config.TEXTS[lang].shyryna_fasadnoyi_perehorodky
                if(value_title_to_translate == "product_s") return config.TEXTS[lang].shyryna_vhidnoi_chastyny
                if(value_title_to_translate == "product_m") return config.TEXTS[lang].shyryna_bokovoyi_stinky
                if(value_title_to_translate == "product_h") return config.TEXTS[lang].vysota_kabiny
                if(value_title_to_translate == "product_l1") return config.TEXTS[lang].shyryna_livoyi_chastyny
                if(value_title_to_translate == "product_l2") return config.TEXTS[lang].shyryna_pravoyi_chastyny
            }
            if(shower_type == 3){
                if(value_title_to_translate == "product_d") return config.TEXTS[lang].shyryna_dverej
                if(value_title_to_translate == "product_s") return config.TEXTS[lang].shyryna_mishstinogo_proemy
                if(value_title_to_translate == "product_h") return config.TEXTS[lang].vysota_kabiny
                if(value_title_to_translate == "product_l1") return config.TEXTS[lang].shyryna_livoyi_chastyny
                if(value_title_to_translate == "product_l2") return config.TEXTS[lang].shyryna_pravoyi_chastyny
            }
            if(shower_type == 4){
                if(value_title_to_translate == "product_l") return config.TEXTS[lang].shyryna_bokovoyi_stinky
                if(value_title_to_translate == "product_d") return config.TEXTS[lang].shyryna_dverej
                if(value_title_to_translate == "product_s") return config.TEXTS[lang].shyryna_vhidnoi_chastyny
                if(value_title_to_translate == "product_h") return config.TEXTS[lang].vysota_kabiny
                if(value_title_to_translate == "product_l1") return config.TEXTS[lang].shyryna_livoyi_chastyny
                if(value_title_to_translate == "product_l2") return config.TEXTS[lang].shyryna_pravoyi_chastyny
            }
        }
        if(type == 1){
            if(value_title_to_translate == "product_s") return config.TEXTS[lang].Width
            if (value_title_to_translate == "product_h") return config.TEXTS[lang].Height
        }
        return true

    },

    checkIfSomeSwitcherOn: function(attrs, typeOfReturn){
        if(typeOfReturn == 1){
            let find = attrs.find(el => el.is_default)
            if(find){
                return "checked"
            } else return ""
        }
        if(typeOfReturn == 2){
            let find = attrs.find(el => el.is_default)
            if(find){
                return "show"
            } else return ""
        }
        if(typeOfReturn == 3){
            let find = attrs.find(el => el.is_default)
            if(find){
                return "style='display:block'"
            } else return ""
        }
        if(typeOfReturn == 4){
            let find = attrs.find(el => el.is_default)
            if(!find){
                return "config-group-num"
            } else return ""
        }

    },
    checkIfSizeMustBySwitchOn: function(dimensions, typeOfReturn, typeOfSize){
        let ifSomeElDefault
        let result
        if(dimensions && dimensions.length){
            dimensions.forEach(item => {
                if(item.is_default == true){
                    ifSomeElDefault = true
                    if(typeOfSize == 'size-1'){
                        if(typeOfReturn == 1){
                            result =  "checked"
                        } else if (typeOfReturn == 2){
                            result =  'style="display: block;"'
                        }
                    }
                }
            })
            if(typeOfSize == 'size-2'){
                if(!ifSomeElDefault){
                    if(typeOfReturn == 1){
                        result =  "checked"
                    } else if (typeOfReturn == 2){
                        result =  'style="display: block;"'
                    }
                }
            }
        }
        return result
    },
    checkInputTypeConstructor:function (object,user,lang){
        let result
        let hint = object.hint
        if(hint){
            let text = config.TEXTS[lang].constructor_hint
            hint = `<div class="hint">${text}: ${object.hint}</div>`
        }else{
            hint = ''
        }
        if(object && object.type){
            if(object.type == config.FORM_FIELDS_TYPES.TEXT){
                let first_name = user && user.first_name ? user.first_name :'';
                let last_name = user && user.last_name ? user.last_name :'';
                let father_name = user && user.father_name ? user.father_name :'';
                console.log(father_name,object.register_sur,'3523662623325235324')
                let num_passport = user && user.num_passport ? user.num_passport :'';
                if(!object.maxlength)object.maxlength = 100
                if(object.required && object.required == 2){
                    if(object.register_first && object.register_first == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" value="${first_name}" maxLength="${object.maxlength}" data-register-first="${object.register_first}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}" data-required='2' required>
                           ${hint}
                           </div>`
                    }else if(object.register_last && object.register_last == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" value="${last_name}" maxLength="${object.maxlength}" data-register-last="${object.register_last}"  data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}" data-required='2' required>
                             ${hint}
                           </div>`
                    }else if(object.register_sur && object.register_sur == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" value="${father_name}" maxLength="${object.maxlength}" data-register-sur="${object.register_sur}"  data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}" data-required='2' required>
                             ${hint}
                           </div>`
                    }else if(object.register_sur && object.client_passport == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" value="${num_passport}" maxLength="${object.maxlength}" data-register-passport="${object.client_passport}"  data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}" data-required='2' required>
                           ${hint}
                           </div>`
                    }
                    else{
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" maxLength="${object.maxlength}"  data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}" data-required='2' required>
                           ${hint}
                           </div>`
                    }
                }else{
                    if(object.register_sur && object.register_sur == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" value="${father_name}" maxLength="${object.maxlength}" data-register-sur="${object.register_sur}"  data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}" data-required='1' required>
                             ${hint}
                           </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" maxLength="${object.maxlength}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}"  class="input ${object.name_field}"data-required='1'>
                           ${hint}
                           </div>`
                    }
                }

            }else if(object.type == config.FORM_FIELDS_TYPES.TEXT_REGION){
                if(object.required && object.required == 2){
                    if(object.client_address == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" data-court-field="2" name="${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input region_Autocomplete ${object.name_field}" data-required='2' required>
                           ${hint}
                           </div>`
                    } else{
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input region_Autocomplete ${object.name_field}" data-required='2' required>
                          ${hint}
                           </div>`
                    }
                }else{
                    if(object.client_address == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">${object.placeholder}</div>
                             <input type="text" data-court-field="2" name="${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input region_Autocomplete ${object.name_field}" data-required='1'>
                           ${hint}
                           </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input region_Autocomplete ${object.name_field}" data-required='1'>
                           ${hint}
                           </div>`
                    }

                }
            }else if(object.type == config.FORM_FIELDS_TYPES.TEXT_STREET){
                if(object.required && object.required == 2){
                    let address = user && user.address ? user.address :''
                    let house = user && user.house ? user.house :''
                    let apartment = user && user.apartment ? user.apartment :''
                    let client_checkbox
                    if(user && user.is_private && user.is_private == 2){
                        client_checkbox = `
                         <div class="col-md-6">
                            <label class="checkbox">
                                <input type="checkbox" name="autocomplete_is_private" class="cheked" checked>
                                    <span>Приватний будинок</span>
                            </label>
                        </div>`
                    }else{
                        client_checkbox =`
                        <div class="col-md-6">
                            <label class="checkbox">
                                <input type="checkbox" name="autocomplete_is_private" class="cheked">                             
                                <span>Приватний будинок</span>
                            </label>
                        </div>
                        `
                    }
                    if(object.client_address == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" data-court-field="2" name="${object.name_field}" data-is-court="${object.is_court}" value="${address}" data-client-address="2" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input street_Autocomplete ${object.name_field}" data-required='2' required>
                           ${hint}
                           </div>
                           <div class="col-xl-2 col-12">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Будинок</div>
                                <input name="autocomplete_house" type="text" class="input" required="" value="${house}">
                            </div>
                        </div>

                        <div class="col-xl-2 col-12 apartament-wrap">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Квартира</div>
                                <input name="autocomplete_apartment_number" type="text" class="input" required="" value="${apartment}">
                            </div>
                        </div>
                        ${client_checkbox}
                          `

                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">*${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" data-is-court="${object.is_court}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input street_Autocomplete ${object.name_field}" data-required='2' required>
                          ${hint}
                           </div>
                           <div class="col-xl-2 col-12">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Будинок</div>
                                <input name="autocomplete_house" type="text" class="input" required="" value="">
                            </div>
                        </div>

                        <div class="col-xl-2 col-12 apartament-wrap">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Квартира</div>
                                <input name="autocomplete_apartment_number" type="text" class="input" required="" value="">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="checkbox">
                                <input type="checkbox" name="autocomplete_is_private" class="cheked">                             
                                <span>Приватний будинок</span>
                            </label>
                        </div>
                          `
                    }

                }else{
                    if(object.client_address == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">${object.placeholder}</div>
                             <input type="text" data-court-field="2" name="${object.name_field}" data-is-court="${object.is_court}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input street_Autocomplete ${object.name_field}" data-required='1'>
                          ${hint}
                           </div>
                            <div class="col-xl-2 col-12">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Будинок</div>
                                <input name="autocomplete_house" type="text" class="input" required="" value="">
                            </div>
                        </div>

                        <div class="col-xl-2 col-12 apartament-wrap">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Квартира</div>
                                <input name="autocomplete_apartment_number" type="text" class="input" required="">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="checkbox">
                                <input type="checkbox" name="autocomplete_is_private" class="cheked">                             
                                <span>Приватний будинок</span>
                            </label>
                        </div> 
                            `
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                             <div class="input-placeholder">${object.placeholder}</div>
                             <input type="text" name="${object.name_field}" data-title="${object.title}" data-is-court="${object.is_court}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" class="input street_Autocomplete ${object.name_field}" data-required='1'>
                           ${hint}
                           </div>
                           <div class="col-xl-2 col-12">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Будинок</div>
                                <input name="autocomplete_house" type="text" class="input" required="" value="">
                            </div>
                        </div>

                        <div class="col-xl-2 col-12 apartament-wrap">
                            <div class="input-field-wrapper">
                                <div class="input-placeholder">Квартира</div>
                                <input name="autocomplete_apartment_number" type="text" class="input" required="">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="checkbox">
                                <input type="checkbox" name="autocomplete_is_private" class="cheked">                             
                                <span>Приватний будинок</span>
                            </label>
                        </div>
                              `
                    }

                }
            }else if(object.type == config.FORM_FIELDS_TYPES.PHONE){
                let phone = user && user.phone ? user.phone :''
                if(object.required && object.required == 2){
                    if(object.for_registration == '2'){
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">*${object.placeholder}</div>
                                  <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}"  data-for-registation="${object.for_registration}" value="${phone}" data-title="${object.title}" name="${object.name_field}" data-position="${object.position}" data-form-id="${object.service_form_id}" type="text" data-type="${object.type}" inputmode="numeric" data-inputmask="'mask': '+38 (999) 999 99 99'" data-inputmask-placeholder="x" data-required='2' required>
                             ${hint}
                              </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">*${object.placeholder}</div>
                                  <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" name="${object.name_field}" data-position="${object.position}" data-form-id="${object.service_form_id}" type="text" data-type="${object.type}" inputmode="numeric" data-inputmask="'mask': '+38 (999) 999 99 99'" data-inputmask-placeholder="x" data-required='2' required>
                              ${hint}
                              </div>`
                    }
                }else{
                    if(object.for_registration == '2'){
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">${object.placeholder}</div>
                                  <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}" data-for-registation="${object.for_registration}" data-title="${object.title}" name="${object.name_field}" data-position="${object.position}" data-form-id="${object.service_form_id}" type="text" data-type="${object.type}" inputmode="numeric" data-inputmask="'mask': '+38 (999) 999 99 99'" data-inputmask-placeholder="x" data-required='1'>
                              ${hint}
                              </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">${object.placeholder}</div>
                                  <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" name="${object.name_field}" data-position="${object.position}" data-form-id="${object.service_form_id}" type="text" data-type="${object.type}" inputmode="numeric" data-inputmask="'mask': '+38 (999) 999 99 99'" data-inputmask-placeholder="x" data-required='1'>
                              ${hint}
                              </div>`
                    }
                }
            }else if (object.type == config.FORM_FIELDS_TYPES.NUMBER){

                if(!object.maxlength)object.maxlength = 100
                if(object.required && object.required == 2){
                    result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">*${object.placeholder}</div>
                                  <input class="input ${object.name_field}" data-title="${object.title}"  maxlength="${object.maxlength}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="number" inputmode="numeric" data-required='2'  required>
                              ${hint}
                              </div>`
                }else{
                    result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">${object.placeholder}</div>
                                  <input class="input ${object.name_field}" data-title="${object.title}"  maxlength="${object.maxlength}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="number" inputmode="numeric" data-required='1'>
                              ${hint}
                              </div>`
                }
            }else if (object.type == config.FORM_FIELDS_TYPES.CHILD){
                if(object.required && object.required == 2){
                    result = `<div class="count-kids">
                        <div class="count-kids-title">
                          <span>*${object.placeholder}:</span>
                          <div class="number">
                            <span class="minus disabled">-</span>
                            <input class="count-kids-input ${object.name_field}" data-service-field-id="${object.id}" data-title="${object.title}" maxLength="${object.maxlength}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" data-req type="text" value="0" disabled="" data-required='2'>
                            <span class="plus">+</span>
                          </div>
                        </div>

                        <div class="kids-block">
                          <div class="row kids-row">

                          </div>
                        </div>
                      </div>`
                }else{
                    result = `<div class="count-kids">
                        <div class="count-kids-title">
                          <span>${object.placeholder}:</span>
                          <div class="number">
                            <span class="minus disabled">-</span>
                            <input class="count-kids-input ${object.name_field}" data-service-field-id="${object.id}" data-title="${object.title}" maxLength="${object.maxlength}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="text" value="0" disabled="" data-required='2'>
                            <span class="plus">+</span>
                          </div>
                        </div>

                        <div class="kids-block">
                          <div class="row kids-row">

                          </div>
                        </div>
                    </div>`
                }
            }
            else if (object.type == config.FORM_FIELDS_TYPES.DATAPICKER){
                let date = user && user.birthday_date ? moment(user.birthday_date).format('DDMMYYYY') :''
                if(object.required && object.required == 2){
                    if(object.client_date && object.client_date == 2){
                        result = `
                      <div class="input-field-wrapper ${object.width}">
                    <div class="input-placeholder">*${object.placeholder}</div>
                    <input type="text" class="input calendar inputmask ${object.name_field}"value="${date}" data-title="${object.title}" data-register-date="${object.client_date}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" data-required ="2"  data-toggle="datepicker" data-inputmask="'mask': '99.99.9999'" data-inputmask-placeholder="ДД.ММ.РРРР" required="" >
                    ${hint}
                    <div class="docs-datepicker-container"></div>
                  </div>`
                    }else{
                        result = `
                      <div class="input-field-wrapper ${object.width}">
                    <div class="input-placeholder">*${object.placeholder}</div>
                    <input type="text" class="input calendar inputmask ${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" data-required ="2"  data-toggle="datepicker" data-inputmask="'mask': '99.99.9999'" data-inputmask-placeholder="ДД.ММ.РРРР" required="" >
                    ${hint}
                    <div class="docs-datepicker-container"></div>
                  </div>`
                    }
                }else{
                    result = `
                      <div class="input-field-wrapper ${object.width}">
                    <div class="input-placeholder">${object.placeholder}</div>
                    <input type="text" class="input calendar inputmask ${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" data-required ="1"  data-toggle="datepicker" data-inputmask="'mask': '99.99.9999'" data-inputmask-placeholder="ДД.ММ.РРРР" required="" >
                    ${hint}
                    <div class="docs-datepicker-container"></div>
                  </div>`
                }
            }
            else if(object.type == config.FORM_FIELDS_TYPES.CODE){
                if(object.required && object.required == 2){
                    let client_inn = user && user.inn ?user.inn :''
                    if(object.client_inn && object.client_inn == 2){
                        result = `<div class="input-field-wrapper ${object.width}">
                                 <div class="input-placeholder">*${object.placeholder}</div>
                                 <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" value="${client_inn}" data-register-inn="${object.client_inn}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="text" inputmode="numeric" data-inputmask="'mask': '99999 99999'" data-inputmask-placeholder="x" data-required='2' required>
                              ${hint}
                              </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                                 <div class="input-placeholder">*${object.placeholder}</div>
                                 <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="text" inputmode="numeric" data-inputmask="'mask': '99999 99999'" data-inputmask-placeholder="x" data-required='2' required>
                              ${hint}
                              </div>`
                    }
                }else{
                    result = `<div class="input-field-wrapper ${object.width}">
                                 <div class="input-placeholder">${object.placeholder}</div>
                                 <input class="input inputmask ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="text" inputmode="numeric" data-inputmask="'mask': '99999 99999'" data-inputmask-placeholder="x" data-required='1'>
                              ${hint}
                              </div>`
                }
            }else if(object.type == config.FORM_FIELDS_TYPES.EMAIL){
                let email = user && user.email ? user.email :''
                if(object.required && object.required == 2){
                    if(object.for_registration == '2'){
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">*${object.placeholder}</div>
                                  <input class="input ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" value="${email}" data-for-registation="${object.for_registration}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="email" data-required='2' required>
                              ${hint}
                              </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">*${object.placeholder}</div>
                                  <input class="input ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}"  data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="email" data-required='2' required>
                              ${hint}
                              </div>`
                    }

                }else{
                    if(object.for_registration == '2'){
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">${object.placeholder}</div>
                                  <input class="input ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" data-for-registation="${object.for_registration}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="email" data-required='1'>
                             ${hint}
                              </div>`
                    }else{
                        result = `<div class="input-field-wrapper ${object.width}">
                                  <div class="input-placeholder">${object.placeholder}</div>
                                  <input class="input ${object.name_field}" data-is-defendant="${object.is_defendant}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" type="email" data-required='1'>
                              ${hint}
                              </div>`
                    }

                }
            }else if(object.type == config.FORM_FIELDS_TYPES.CHECKBOX){
                result = `<div class="col-12">
                            <label class="checkbox">
                              <input type="checkbox" data-service-field-id="${object.id}" class="cheked ${object.name_field}" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" data-required='2'>                             
                              <span>${object.placeholder}</span>
                            </label>
                        </div>`
            }else if(object.type == config.FORM_FIELDS_TYPES.RADIOBUTTON){
                result = `<div class="col-12">
                          <div class="rename-fullname">
                            <span>${object.placeholder}</span>
                            <label class="radiobox-wrapper">
                              <input type="radio" name="radio"  checked="checked" value="false">                             
                              <span class="checkmark"></span>
                              <span>Ні</span>
                            </label>
                           <label class="radiobox-wrapper">
                              <input type="radio" name="radio" data-val="true" value="true">                             
                              <span class="checkmark"></span>
                              <span>Так</span>
                            </label>
                            <div class="input-field-wrapper rename-input" style="--placeholder-width:NaNpx; display: none;">
                              <input type="text" data-radio="2" data-service-field-id="${object.id}" class="input ${object.name_field}" placeholder="Введіть дошлюбне прізвище" data-title="${object.title}" data-type="${object.type}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="${object.name_field}" data-required='2'>
                            </div>                            
                          </div>
                        </div>`
            }
            else if (object.type == config.FORM_FIELDS_TYPES.SELECT) {
                let title = object.title
                if(title){
                    title = title.split(',')
                    if(title.length){
                        let end_field = `<option selected disabled>${object.placeholder}</option>`
                        for(let item of title){
                            end_field = end_field + ' ' + `<option value="${item}">${item}</option>`
                        }
                        title = end_field
                    }
                }
                if (object.required && object.required == 2) {
                    result = `<select class="SelectBox" data-type="${object.type}" data-title="${object.title}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="region_select" data-required='2'  required>
                                                       ${title}
                                                   </select>`
                } else {
                    result = `<select class="SelectBox" data-type="${object.type}" data-title="${object.title}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="region_select"data-required='1' >
                                                    ${title}
                                                   </select>`
                }
            }else if(object.type == config.FORM_FIELDS_TYPES.INFO_BLOCK){
                let plaintiff
                let defendant
                if(object.placeholder){
                    object.placeholder = object.placeholder.split(';')
                    if(object.placeholder.length>1){
                        plaintiff = object.placeholder[0]
                        defendant = object.placeholder[1]
                    }else{
                        plaintiff = object.placeholder[0]
                    }
                }
                if(plaintiff)plaintiff = plaintiff.split(',')
                if(defendant)defendant = defendant.split(',')
                if(plaintiff && plaintiff.length){
                    let end =`<div class="cl-item-title">Позивач:</div>`
                    for(let item of plaintiff){
                        item = `<div data-name="${item}" class="plaintiff_items cl-item-${item}"></div>`
                        end = end +' '+ item
                    }
                    plaintiff = end
                }
                if(defendant && defendant.length){
                    let end =`<div class="cl-item-title">Відповідач:</div>`
                    for(let item of defendant){
                        item = `<div data-name="${item}" class="defendant_items cl-item-${item}"></div>`
                        end = end +' '+ item
                    }
                    defendant = end
                }
                if(plaintiff && defendant){
                    result = `
                   <div class="title h5">
                      ${object.title}
                    </div>
                    <div class="row info_step_block" data-type="${object.type}" data-title="${object.title}" data-position="${object.position}" data-form-id="${object.service_form_id}" name="info_block">
                    <div class="col-md-6 ">
                         <div class="cl-item plaintiff">
                              ${plaintiff}
                         </div>
                    </div>
                    <div class="col-md-6">
                        <div class="cl-item defendant">
                         ${defendant}
                         </div>
                    </div>
                  </div>`
                }else if(plaintiff && !defendant){
                    result = `
                    <div class="title h5">
                      ${object.title}
                    </div>
                    <div class="col-md-6">
                         <div class="cl-item">
                              ${plaintiff}
                         </div>
                    </div>`
                }

            }
        }
        return result
    }
    // checkIfSomeSwitcherMustBeShow: function(attr_group){

    // }

    // checkIfRangerEdited: function(filter_min, filter_max,body, widthOrHeight) {
    //         if (widthOrHeight == 'width') {
    //             if ((body.min_s != filter_min) || (body.max_s != filter_max)) {
    //                 return "true"
    //             }
    //         } else if (widthOrHeight == 'height') {
    //             if ((body.min_h != filter_min) || (body.max_h != filter_max)) {
    //                 return "true"
    //             }
    //         }
    // },
};
const recursiveMenuBody = (object) => {
    let i, result = '';
    for (i of object) {
        if (i.children && i.children.length > 0) {

            result += `<li><a href="${i.link}">${i.name}</a>`;
            result += '<ul>'
            result += recursiveMenuBody(i.children);
            result += '</ul>';
            result += '</li>'

        } else {
            result += `<li><a href="${i.link}">${i.name}</a></li>`;
        }
    }

    return result;
}
