const log = require('../utils/logger');
const config = require('../configs/config');
const errors = require('../configs/errors');
const product_discount_calc = require('../utils/product_discount_calc');

module.exports = {

    countPrice: ( product, dbFormat, responseFormat, custom_s, custom_h, user, discount,isDeleteStep) => {
        log.info(`Start countPrice util`)
        let s,h, prod_price, prod_discounted_price;
        if(product){
            let custom_SH
            let { base, mat, steps, dimensions } = product;
            if (!base || !mat) {
                throw new Error(errors.BAD_PRODUCT_INVALID_VALUE_BASE_OR_MAT.message)
            }
            if(custom_s && custom_h) {
                custom_SH = true
                product.price = Math.ceil(base + (mat * custom_s  * custom_h) / 1000000);
                if(user && product.price){
                    product.price = product_discount_calc(user, product.price, discount);
                }
                product.dimensions.forEach(element => {
                    if(element.s == custom_s && element.h == custom_h){
                        if (element.discount && element.discount_type) {
                            if (element.discount_type == config.DISCOUNT_TYPES.VALUE) {
                                product.discounted_price = Math.ceil(product.price - element.discount);
                            } else if (element.discount_type == config.DISCOUNT_TYPES.PERCENT) {
                                product.discounted_price = Math.ceil(product.price - (product.price * (element.discount / 100)));
                            }
                            if(user && product.discounted_price){
                                product.discounted_price = product_discount_calc(user, product.discounted_price, discount);
                            }

                        } else {
                            product.discounted_price = null;
                        }
                        s = custom_s;
                        h = custom_h;
                        prod_price = product.price;
                        prod_discounted_price = product.discounted_price ? Number(product.discounted_price) : null;

                    }  else {
                        product.discounted_price = null;
                    }
                    
                    // if(element.is_default){
                    // }
                    
                });
                if(!s && !h){
                    s = custom_s;
                    h = custom_h;
                    prod_price = Math.ceil(product.price);
                    prod_discounted_price = product.discounted_price ? Math.ceil(product.discounted_price) : null;
                }
            
            } else {
                if (dimensions && dimensions.length) {
                    for (let [ index, dimension ] of dimensions.entries()) {
                        if(index === 0) {
                            dimension.is_default = true;
                        }else{
                            dimension.is_default = null;
                        }
                        let dimPrise = base + (mat * dimension.s * dimension.h) / 1000000; 
                        dimension.price = Math.ceil(dimPrise);

                        if(user && dimension.price){
                            dimension.price =  product_discount_calc(user, dimension.price, discount);
                        }
                        if (dimension.discount && dimension.discount_type) {
                            if (dimension.discount_type == config.DISCOUNT_TYPES.VALUE) {
                                dimension.discounted_price = Math.ceil(dimension.price - dimension.discount);
                            } else if (dimension.discount_type == config.DISCOUNT_TYPES.PERCENT) {
                                dimension.discounted_price = Math.ceil(dimension.price - (dimension.price * (dimension.discount / 100)));
                            }
                            if(user && dimension.discounted_price){
                                dimension.discounted_price = product_discount_calc(user, dimension.discounted_price, discount);
                            }
                        } else {
                            dimension.discounted_price = null;
                        }
                        dimension.discounted_price = dimension.discounted_price ? dimension.discounted_price : null
                        if(dimension.is_default){
                            s = dimension.s;
                            h = dimension.h;
                            prod_price = Math.ceil(dimension.price);
                            prod_discounted_price = dimension.discounted_price ? Math.ceil(dimension.discounted_price) : null;
                        }
                    }
                }
            }

            if (!s || !h) {
                throw new Error(errors.BAD_PRODUCT_INVALID_VALUE_S_OR_H.message)
            }

            product.default_s = s;
            product.default_h = h;

            let config_checkout = [];
            let config_checkout_counter = 0;
            let option_price = 0;

            if (steps && steps.length) {
                for (let step of steps) {

                    if(step && step.attribute_groups && step.attribute_groups.length){

                        for (let atrGr of  step.attribute_groups) {
                            atrGr.preventDelete = true

                            

                            if(atrGr && atrGr.attributes && atrGr.attributes.length){
                                if(isDeleteStep == 'true'){
                                    let find = atrGr.attributes.find(el => el.no_option == 1)
                                    if(find) find.is_default = true
                                }
                                if(config.DEFAULT_CHECKBOXES_GROUP_TYPE.includes(atrGr.type)) atrGr.preventDelete = false
                                if(atrGr.attributes.find(el => el.no_option == 1)) atrGr.preventDelete = false

                                for (let attribute of  atrGr.attributes) {

                                    if(attribute.price == -1 || attribute.base == -1 || attribute.mat == -1){
                                        attribute.count_price = 0;
                                    }else{
                                        if(atrGr.type){

                                            //base+mat*(2*S+2*H)/1000
                                            if(config.ATR_GROUP_TYPES_TO_FORMULS.formula1.includes(atrGr.type) && attribute.base && attribute.mat){
                                                attribute.count_price = attribute.base + attribute.mat * (2*s + 2*h)/1000;
                                            
                                            //mat*S*H/1000000
                                            }else if(config.ATR_GROUP_TYPES_TO_FORMULS.formula2.includes(atrGr.type) && attribute.mat){
                                                attribute.count_price = (attribute.mat * s * h) / 1000000;
                                            
                                            //mat*(2*S+2*H)/1 000
                                            }else if(config.ATR_GROUP_TYPES_TO_FORMULS.formula3.includes(atrGr.type) && attribute.mat){
                                                attribute.count_price = attribute.mat * (2*s + 2*h)/1000;
                                            
                        
                                            //base+mat*S/1 000 
                                            }else if(config.ATR_GROUP_TYPES_TO_FORMULS.formula4.includes(atrGr.type) && attribute.base && attribute.mat){
                                                attribute.count_price = attribute.base + attribute.mat * s /1000;
            
                                            //price
                                            }else if(config.ATR_GROUP_TYPES_TO_FORMULS.price.includes(atrGr.type)){
                                                attribute.count_price = attribute.price ? attribute.price : null;
                                            }

                                            if(user && attribute.count_price){
                                                attribute.count_price = product_discount_calc(user, attribute.count_price, discount);
                                            }

                                            if(attribute.count_price) attribute.count_price = Math.ceil(attribute.count_price);
                                        }
                        
                                        if (attribute.discount) {
                                            attribute.discounted_price = Math.ceil(attribute.count_price - (attribute.count_price * (attribute.discount / 100)));
                                            
                                            if(user && attribute.discounted_price){
                                                attribute.discounted_price = product_discount_calc(user, attribute.discounted_price, discount);
                                            }
                                            if(attribute.discounted_price){
                                                attribute.old_count_price = attribute.count_price
                                                attribute.count_price = attribute.discounted_price
                                            }
                                        } else {
                                            attribute.discounted_price = null;
                                        }

                                        if(atrGr.origin_id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID|| atrGr.id == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                                            let product_price = product.discounted_price ? product.discounted_price : product.price
                                            if(!custom_SH){
                                                product_price = product_price / 100 
                                            }
                                            if(attribute.price && attribute.price_type == config.PRICE_TYPES.VALUE){
                                                attribute.count_price = attribute.price
                                                if(user){
                                                    attribute.count_price = product_discount_calc(user, attribute.count_price, discount);
                                                }
                                            }
                                            if(attribute.price_type == config.PRICE_TYPES.PERCENT){
                                                attribute.count_price = Math.ceil(product_price * (attribute.price / 100));
                                                if(user){
                                                    attribute.count_price = product_discount_calc(user, attribute.count_price, discount);
                                                }
                                            }
                                        }
                                    }
                
                
                                    if(attribute && attribute.is_default){
                                        prod_price += attribute.count_price  ? attribute.count_price  : null;
                                        if(prod_discounted_price){
                                            prod_discounted_price += attribute.discounted_price ? attribute.discounted_price : attribute.count_price;
                                        } 
                                        
                                        if(attribute.title){
                                            if(attribute.dependent_atr_id){
                                                    let find = false
                                                    for (let atrGr of  step.attribute_groups) {
                                                        if(atrGr && atrGr.attributes && atrGr.attributes.length){
                                                            for (let attr of  atrGr.attributes) {
                                                                if(attr.is_default){
                                                                    if(attr.origin_id == attribute.dependent_atr_id || attr.id == attribute.dependent_atr_id) find = true
                                                                }
                                                                
                                                            }
                                                        }
                                                    }
                                                if(find){
                                                    config_checkout.push({
                                                        origin_id: attribute.origin_id ? attribute.origin_id : attribute.id,
                                                        gr_title: atrGr.title,
                                                        gr_attr_origin_id: atrGr.origin_id ? atrGr.origin_id : atrGr.id,
                                                        is_default: atrGr.preventDelete ? true: false,
                                                        atr_title: attribute.title,
                                                        no_option: attribute.no_option,
                                                        count_price: attribute.count_price ? Math.ceil(attribute.count_price) : 0,
                                                        discounted_price: attribute.discounted_price,
                                                        config_checkout_counter: config_checkout_counter++,
        
                                                    })
                                                }
                                            } else {
                                                config_checkout.push({
                                                    origin_id: attribute.origin_id ? attribute.origin_id : attribute.id,
                                                    gr_title: atrGr.title,
                                                    gr_attr_origin_id: atrGr.origin_id ? atrGr.origin_id : atrGr.id,
                                                    is_default: atrGr.preventDelete ? true: false,
                                                    atr_title: attribute.title,
                                                    no_option: attribute.no_option,
                                                    count_price: attribute.count_price ? Math.ceil(attribute.count_price) : 0,
                                                    discounted_price: attribute.discounted_price,
                                                    config_checkout_counter: config_checkout_counter++,
    
                                                })
                                            }
                                            
                                        }
                                        if(!attribute.count_price) attribute.count_price = 0
                                        option_price += attribute.count_price;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if(dbFormat){
                product.option_price = Number(option_price).toFixed(0);
                if(prod_discounted_price){
                    product.price_without_option_price = Number(prod_discounted_price - option_price).toFixed(0);
                }else if(prod_price){
                    product.price_without_option_price = Number(prod_price - option_price).toFixed(0);
                }
                product.price = prod_price*100;
                product.discounted_price = prod_discounted_price*100;
                product.config_checkout = config_checkout;
            }
            if(responseFormat){
                product.price = product.price ? product.price/100 : null;
                product.discounted_price = product.discounted_price ? product.discounted_price/100 : null;
                product.option_price = Number(option_price).toFixed(0);
                if(product.discounted_price){
                    product.price_without_option_price = Number(product.discounted_price - option_price).toFixed(0);
                }else if(product.price){
                    product.price_without_option_price = Number(product.price - option_price).toFixed(0);
                }
                product.config_checkout = config_checkout;
            }
            if(!dbFormat && !responseFormat){
                product.price = prod_price ? prod_price : null;
                product.discounted_price = prod_discounted_price ? prod_discounted_price : null;
                product.option_price = Number(option_price).toFixed(0);
                if(product.discounted_price){
                    product.price_without_option_price = Number(product.discounted_price - option_price).toFixed(0);
                }else if(product.price){
                    product.price_without_option_price = Number(product.price - option_price).toFixed(0);
                }
                product.config_checkout = config_checkout;
            }
        }

  
        if (product.price) product.price =  Math.ceil(product.price)
        if (product.discounted_price) product.discounted_price = Math.ceil(product.discounted_price)

        log.info(`End countPrice util`)
        return product;
    },

    countShowerPrice: ( product, dbFormat, responseFormat, custom_s, custom_h, custom_l, custom_l1, custom_l2, custom_m, custom_d,  user, discount, changedMat, changedMatAtrId,isDeleteStep ) => {
        log.info(`Start countShowerPrice util`);
        let prod_price, prod_discounted_price;
        if(product){
            let { base, mat, steps } = product;
            if (!base || !mat) {
                throw new Error(errors.BAD_PRODUCT_INVALID_VALUE_BASE_OR_MAT.message)
            }
            if( custom_s || custom_h || custom_l || custom_l1 || custom_l2 || custom_m ) {
                if(custom_s) {
                    custom_s = Number(custom_s);
                    product.s.value = custom_s;
                }else{
                    custom_s = 0;
                    product.s.value = 0;
                }
                if(custom_h) {
                    custom_h = Number(custom_h);
                    product.h.value = custom_h;
                }
                if(custom_l) {
                    custom_l = Number(custom_l);
                    product.l.value = custom_l;
                }else{
                    custom_l = 0;
                    product.l.value = 0;
                }
                if(custom_l1) {
                    custom_l1 = Number(custom_l1);
                    product.l1.value = custom_l1;
                }else{
                    custom_l1 = 0;
                    product.l1.value = 0;
                }
                if(custom_l2) {
                    custom_l2 = Number(custom_l2);
                    product.l2.value = custom_l2;
                }else{
                    custom_l2 = 0;
                    product.l2.value = 0;
                }
                if(custom_m) {
                    custom_m = Number(custom_m);
                    product.m.value = custom_m;
                }else{
                    custom_m = 0;
                    product.m.value = 0;
                }
                if(custom_d) {
                    custom_d = Number(custom_d);
                    product.d.value = custom_d;
                }else{
                    custom_d = 0;
                    product.d.value = 0;
                }

                product.price = null;
                product.discounted_price = null;
                let countPrise = null;
                if(product.shower_type == config.SHOWER_TYPES.BLINDS  && custom_s && custom_h){
                    countPrise = base + (mat * custom_s * custom_h) / 1000000; 
                }
                    
                if(product.shower_type == config.SHOWER_TYPES.WALK &&  custom_h){
                    countPrise = base + (mat * custom_h * (custom_l + custom_m + custom_l1 + custom_l2))  / 1000000;
                }

                if(product.shower_type == config.SHOWER_TYPES.DOORS && custom_s && custom_h ){
                    countPrise = base + (mat * custom_s * custom_h)  / 1000000; 
                }

                if(product.shower_type == config.SHOWER_TYPES.BOX && custom_h ){
                    countPrise = base + (mat * custom_h *(custom_s + custom_l + custom_l1 + custom_l2)) / 1000000; 
                }
                if(countPrise) prod_price = Math.ceil(countPrise);
                
                if(product.discount && product.discount.type && product.discount.value){
                    if (product.discount.type == config.DISCOUNT_TYPES.VALUE) {
                        prod_discounted_price = Math.ceil(prod_price - product.discount.value);
                    } else if (product.discount.type == config.DISCOUNT_TYPES.PERCENT) {
                        prod_discounted_price = Math.ceil(prod_price - (prod_price * (product.discount.value / 100)));
                    }
                }

                if(user){
                    if(prod_price) prod_price = product_discount_calc(user, prod_price, discount);
                    if(prod_discounted_price) prod_discounted_price = product_discount_calc(user, prod_discounted_price, discount);
                }

            } else {
                if (product.type && product.type == config.PRODUCT_TYPES.SHOWER && product.shower_type) {
                    let countPrise = null;
                    if(product.shower_type == config.SHOWER_TYPES.BLINDS && product.s && product.s.value && product.h && product.h.value){
                        countPrise = base + (mat * product.s.value * product.h.value)  / 1000000; 
                    }
                     
                    if(product.shower_type == config.SHOWER_TYPES.WALK && product.s  && product.l && product.m && product.h && product.h.value && product.l1 && product.l2 ){
                        countPrise = base + (mat * product.h.value*(product.l.value + product.m.value + product.l1.value + product.l2.value)) / 1000000;
                    }

                    if(product.shower_type == config.SHOWER_TYPES.DOORS && product.s && product.s.value && product.h && product.h.value ){
                        countPrise = base + (mat * product.s.value * product.h.value) / 1000000; 
                    }

                    if(product.shower_type == config.SHOWER_TYPES.BOX && product.s  && product.l && product.h && product.h.value && product.l1 && product.l2 ){
                        countPrise = base + (mat * product.h.value*(product.s.value + product.l.value + product.l1.value + product.l2.value)) / 1000000; 
                    }
                    if(countPrise) prod_price = Math.ceil(countPrise);
                    
                    if(product.discount && product.discount.type && product.discount.value){
                        if (product.discount.type == config.DISCOUNT_TYPES.VALUE) {
                            prod_discounted_price = Math.ceil(prod_price - product.discount.value);
                        } else if (product.discount.type == config.DISCOUNT_TYPES.PERCENT) {
                            prod_discounted_price = Math.ceil(prod_price - (prod_price * (product.discount.value / 100)));
                        }
                    }
                    if(user){
                        if(prod_price) prod_price = product_discount_calc(user, prod_price, discount);
                        if(prod_discounted_price) prod_discounted_price = product_discount_calc(user, prod_discounted_price, discount);
                    }
                    
                }
            }

    
            let config_checkout = [];
            let config_checkout_counter = 0;
            let option_price = 0;

            if (steps && steps.length) {
                for (let step of steps) {

                    if(step && step.attribute_groups && step.attribute_groups.length){

                        for (let atrGr of  step.attribute_groups) {
                            atrGr.preventDelete = true

                           

                            if(atrGr && atrGr.attributes && atrGr.attributes.length){
                                if(isDeleteStep == 'true'){
                                    let find = atrGr.attributes.find(el => el.no_option == 1)
                                    if(find) find.is_default = true
                                }
                                
                                if(config.DEFAULT_CHECKBOXES_GROUP_TYPE.includes(atrGr.type)) atrGr.preventDelete = false
                                if(atrGr.attributes.find(el => el.no_option == 1)) atrGr.preventDelete = false

                                for (let attribute of  atrGr.attributes) {

                                    if(attribute.price <= -1){
                                        attribute.count_price = 0;
                                    }else{
                                        let isSelectValue = false;

                                        
                                        if(atrGr.type){
                                            //price
                                            if(config.ATR_GROUP_TYPES_TO_FORMULS.price.includes(atrGr.type)){
                                                if(attribute.values && attribute.values.length){
                                                    let selectValue = attribute.values.find(item => item.is_default);
                                                    if(selectValue && selectValue.price && selectValue.price > -1){
                                                        isSelectValue = true;
                                                        attribute.count_price = selectValue.price;
                                                        attribute.selectValue = selectValue;
                                                    }
                                                }
                                                if(!attribute.count_price) attribute.count_price = attribute.price ? Math.ceil(attribute.price) : 0;
                                            }

                                            if(user && attribute.count_price){
                                                attribute.count_price = product_discount_calc(user, attribute.count_price, discount);
                                            }
                                        }
                        
                                        if (attribute.discount && !isSelectValue) {
                                            attribute.discounted_price = Math.ceil(attribute.count_price - (attribute.count_price * (attribute.discount / 100)));
                                            
                                            if(user && attribute.discounted_price){
                                                attribute.discounted_price = product_discount_calc(user, attribute.discounted_price, discount);
                                            }
                                            if(attribute.discounted_price){
                                                attribute.old_count_price = attribute.count_price
                                                attribute.count_price = attribute.discounted_price 
                                            }
                                             
                                        } else {
                                            attribute.discounted_price = 0;
                                        }
                                    }
                
                
                                    if(attribute && attribute.is_default){
                                        let shelfCount;

                                        if(atrGr.id && [83,84,85].includes(atrGr.id)){
                                            shelfCount = Number(attribute.title);
                                            let shelfCountGroupStep = steps.find(item => [73,74,75].includes(item.id))
                                            if(shelfCountGroupStep && shelfCountGroupStep.attribute_groups && shelfCountGroupStep.attribute_groups.length){
                                                let shelfCountGroup = shelfCountGroupStep.attribute_groups.find(item => [89,90,91].includes(item.id));
                                                if(shelfCountGroup && shelfCountGroup.attributes && shelfCountGroup.attributes.length){
                                                    let selectAtr = shelfCountGroup.attributes.find(item => item.is_default);
                                                    if (selectAtr && selectAtr.title) shelfCount = Number(selectAtr.title);
                                                }
                                            }
                                        }
                                        if(shelfCount){
                                            attribute.count_price = attribute.count_price  ? attribute.count_price*shelfCount  : 0;
                                            prod_price += attribute.count_price;
                                            if(prod_discounted_price){
                                                attribute.discounted_price = attribute.discounted_price ? attribute.discounted_price*shelfCount : attribute.count_price;
                                                prod_discounted_price += attribute.discounted_price;
                                            }
                                        }else{
                                            if(!(changedMatAtrId==attribute.id || changedMatAtrId==attribute.origin_id)){
                                                prod_price += attribute.count_price  ? attribute.count_price  : 0;
                                                if(prod_discounted_price){
                                                    prod_discounted_price += attribute.discounted_price ? attribute.discounted_price : attribute.count_price;
                                                }
                                            }
                                        }
                                        
                                        
                                        if(attribute.title){
                                            if(atrGr.type == 12){
                                                config_checkout.push({
                                                    origin_id: attribute.origin_id ? attribute.origin_id : attribute.id,
                                                    gr_title: atrGr.title,
                                                    atr_title: attribute.title,
                                                    no_option: attribute.no_option,
                                                    gr_attr_origin_id: atrGr.origin_id ? atrGr.origin_id : atrGr.id,
                                                    count_price: Math.ceil(0),
                                                    discounted_price: attribute.discounted_price,
                                                    config_checkout_counter: config_checkout_counter++,
                                                    selectValue: attribute.selectValue,
                                                    shelfCount: shelfCount,
                                                    is_default: atrGr.preventDelete ? true: false,
    
                                                })
                                            } else {
                                                config_checkout.push({
                                                    origin_id: attribute.origin_id ? attribute.origin_id : attribute.id,
                                                    gr_title: atrGr.title,
                                                    atr_title: attribute.title,
                                                    no_option: attribute.no_option,
                                                    gr_attr_origin_id: atrGr.origin_id ? atrGr.origin_id : atrGr.id,
                                                    count_price: attribute.count_price ? Math.ceil(attribute.count_price) : 0,
                                                    discounted_price: attribute.discounted_price,
                                                    config_checkout_counter: config_checkout_counter++,
                                                    selectValue: attribute.selectValue,
                                                    shelfCount: shelfCount,
                                                    is_default: atrGr.preventDelete ? true: false,
    
                                                })
                                            }
                                            
                                        }
                                        if(atrGr.type != 12){
                                            if(!attribute.count_price) attribute.count_price = 0
                                            option_price += attribute.count_price;
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }

            if(dbFormat){
                product.option_price = Number(option_price).toFixed(0);
                if(prod_discounted_price){
                    product.price_without_option_price = Number(prod_discounted_price - option_price).toFixed(0);
                }else if(prod_price){
                    product.price_without_option_price = Number(prod_price - option_price).toFixed(0);
                }
                product.price = prod_price ? prod_price*100 : null;
                product.discounted_price = prod_discounted_price ? prod_discounted_price*100 : null;
                product.config_checkout = config_checkout;
            }
            if(responseFormat){
                product.price = product.price ? product.price/100 : null;
                product.discounted_price = product.discounted_price ? product.discounted_price/100 : null;
                product.option_price = Number(option_price).toFixed(0);
                if(product.discounted_price){
                    product.price_without_option_price = Number(product.discounted_price - option_price).toFixed(0);
                }else if(product.price){
                    product.price_without_option_price = Number(product.price - option_price).toFixed(0);
                }
                product.config_checkout = config_checkout;
            }
            if(!dbFormat && !responseFormat){
                product.price = prod_price ? prod_price : null;
                product.discounted_price = prod_discounted_price ? prod_discounted_price : null;
                product.option_price = Number(option_price).toFixed(0);
                if(product.discounted_price){
                    product.price_without_option_price = Number(product.discounted_price - option_price).toFixed(0);
                }else if(product.price){
                    product.price_without_option_price = Number(product.price - option_price).toFixed(0);
                }
                product.config_checkout = config_checkout;
            }
        }

        if (product.price) product.price =  Math.ceil(product.price)
        if (product.discounted_price) product.discounted_price = Math.ceil(product.discounted_price)

        log.info(`End countShowerPrice util`)
        return product;
    },




}