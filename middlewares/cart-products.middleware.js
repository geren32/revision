//Middlewares which get from cookies viewed prodycts and write to req.viewedProducts
const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const linksService = require('../services/links.service');
const cartService = require('../services/cart.service');
const config = require('../configs/config')
const productService = require('../services/product.service')
const userService = require('../services/user.service')
const product_discount_calc = require('../utils/product_discount_calc')
const productPriceUtil = require('../utils/product_price-util')

async function parseCart(cartProducts, lang, user, discount) {
    let collection = []
    const languages = config.LANGUAGES
    for (let cart of cartProducts) {
        if (!cart) continue;
        let additional_options = []
        let product;
        if (cart.additional_options && cart.additional_options.length) {
            product = await productService.getProductByslug({
                [Op.or]: [{ id: cart.product_id, lang: lang }, { origin_id: cart.product_id, lang: lang }]
            }, false, true, cart.additional_options);

            if(typeof cart.additional_options == 'string') cart.additional_options = JSON.parse(cart.additional_options)

            if(user){
                if(product.type == config.PRODUCT_TYPES.GLASS){
                    product = productPriceUtil.countPrice(product, false, false, cart.product_s, cart.product_h, user, discount);
                }else if(product.type == config.PRODUCT_TYPES.SHOWER){ 
                    product = productPriceUtil.countShowerPrice(product, false, false, cart.product_s, cart.product_h, cart.product_l, 
                        cart.product_l1, cart.product_l2, cart.product_m, cart.product_d, user, discount, product.changedMat, product.changedMatAtrId);
                }
            }else{
                if(product.type == config.PRODUCT_TYPES.GLASS){
                    product = productPriceUtil.countPrice(product, false, false, cart.product_s, cart.product_h);
                }else if(product.type == config.PRODUCT_TYPES.SHOWER){
                    product = productPriceUtil.countShowerPrice(product, false, false, cart.product_s, cart.product_h, cart.product_l, 
                        cart.product_l1, cart.product_l2, cart.product_m, cart.product_d, null, null, product.changedMat, product.changedMatAtrId);
                }
            }
            product.final_price = product.discounted_price ? product.discounted_price : product.price;


            for (let item of cart.additional_options) {
                if(item.originAtrGrId == config.MIRROR_COLOR_ATR_GR_ORIGIN_ID){
                    let originProdId = product.origin_id ? product.origin_id : product.id
                    let attr = await productService.getProdToAtrByFilter({attribute_id: item.originAtrId,product_id:originProdId })
                        if(attr.image){
                            product.image = attr.image
                            product.is_color = true
                        } 
                }


                let title = await productService.getGroupAtrByFilter({
                    [Op.or]: [{ id: item.originAtrGrId, lang: lang }, { origin_id: item.originAtrGrId, lang: lang }] })
                if (title && title.title) title = title.title;

                let value = await productService.getAtrByFilter({
                    [Op.or]: [{ id: item.originAtrId, lang: lang }, { origin_id: item.originAtrId, lang: lang }] })
                let no_option = value.no_option ? value.no_option : null
                if (value && value.title) value = value.title
                if (item.originAtrValueId) {
                    let atrValue = await productService.getAtrValueByFilter({
                        [Op.or]: [{ id: item.originAtrValueId, lang: lang }, { origin_id: item.originAtrValueId, lang: lang }] })
                    if (atrValue && atrValue.value) value += `, ${atrValue.value}`
                }
                if (title && value && !no_option) additional_options.push({ title, value })
            }
            product.additional_options = additional_options
        }else{
            product = await productService.getProduct({
                [Op.or]: [{ id: cart.product_id, lang: lang }, { origin_id: cart.product_id, lang: lang }]
            }, null,null)
            if(user){
                if(product.type == config.PRODUCT_TYPES.GLASS){
                    product = productPriceUtil.countPrice(product, false, false, cart.product_s, cart.product_h, user, discount);
                }else if(product.type == config.PRODUCT_TYPES.SHOWER){ 
                    product = productPriceUtil.countShowerPrice(product, false, false, cart.product_s, cart.product_h, cart.product_l, 
                        cart.product_l1, cart.product_l2, cart.product_m, cart.product_d, user, discount, product.changedMat, product.changedMatAtrId);
                }
            }else{
                if(product.type == config.PRODUCT_TYPES.GLASS){
                    product = productPriceUtil.countPrice(product, false, false, cart.product_s, cart.product_h);
                }else if(product.type == config.PRODUCT_TYPES.SHOWER){
                    product = productPriceUtil.countShowerPrice(product, false, false, cart.product_s, cart.product_h, cart.product_l, 
                        cart.product_l1, cart.product_l2, cart.product_m, cart.product_d, null, null, product.changedMat, product.changedMatAtrId);
                }
            }
            product.final_price = product.discounted_price ? product.discounted_price : product.price;
        }

        product.slug = await linksService.getLinkObjByFilter({ original_link: `/shop/getProduct/${product.id}`, lang });

        if (product.type && product.type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS) {
            let variationObj = {}
            if(cart.variation_id){
               let getVariation = await productService.getProductVariation({[Op.or]: [{ id: cart.variation_id, lang: lang }, { origin_id: cart.variation_id, lang: lang }]})
                if(getVariation){
                    variationObj.name = getVariation.name
                    variationObj.value = getVariation.value
                    product.variation_options = variationObj
                    product.price = getVariation.price / 100
                    product.price = product_discount_calc(user,product.price,discount);
                    if(getVariation.discounted_price){
                        product.discounted_price = getVariation.discounted_price / 100
                        product.discounted_price = product_discount_calc(user,product.discounted_price,discount);
                    }
                    product.variation_id = cart.variation_id
                }
                product.final_price = product.discounted_price ? product.discounted_price : product.price

            }
               
        }

        if (cart.product_collection && cart.product_collection.length) {
            let product_collection_original = JSON.stringify(cart.product_collection)
            product.together_cheaper = true;
            //product.characteristics = JSON.parse(product.characteristics)
            let general_options = []
            if(product.characteristics && product.characteristics.length){
                for (let item of product.characteristics) {
                    let isSelective = item.text.split(',')
                    if (isSelective.length > 1) {
                        item.text = item.text.split(',')[0]
                    }
                    general_options.push({ title: item.title, value: item.text })
                }
            }
            product.general_options = general_options

            if (typeof cart.product_collection == 'string') cart.product_collection = JSON.parse(cart.product_collection)

            

            for (let i = 0; i < cart.product_collection.length; i++) {
                product.promotion_product_price = cart.product_collection[0].promotional_product_price
            }
            
            if (product.together_cheaper_products && product.together_cheaper_products.length) {
                product.together_cheaper_products_price = product.discounted_price ? product.discounted_price : product.price;
                
                let together_cheaper = []
                let countTogetherCheaper = 0
                countTogetherCheaper +=product.final_price
                product.promotion_product_price = product.final_price
                for (let element of product.together_cheaper_products) {
                    if ((cart.product_collection[1].product_id == element.id) || (cart.product_collection[2] && cart.product_collection[2].product_id == element.id)) {
                        element.promotion_product_price = element.promotional_price
                        countTogetherCheaper += element.promotion_product_price
                        together_cheaper.push(element)

                        element.slug = await linksService.getLinkObjByFilter({ original_link: `/shop/getProduct/${element.id}`, lang });



                        if (element.characteristics && element.characteristics.length) {
                            element.characteristics = JSON.parse(element.characteristics)

                            let general_options = []
                            for (let item of element.characteristics) {
                                let isSelective = item.text.split(',')
                                if (isSelective.length > 1) {
                                    item.text = item.text.split(',')[0]
                                }
                                general_options.push({ title: item.title, value: item.text })
                            }

                            element.general_options = general_options
                        }
                    }
                }

               
                product.totalOne = product_discount_calc(user, countTogetherCheaper, discount);
                product.total = (product_discount_calc(user, countTogetherCheaper, discount) * cart.quantity);
                product.quantity = cart.quantity;
                
                product.together_cheaper_products = together_cheaper
                product.product_collection_original = product_collection_original
            }

        } else {
         


            product.product_price = product.discounted_price ? product.discounted_price : product.price;
            product.total = product.final_price * cart.quantity;
            product.quantity = cart.quantity;
            if(cart.product_s) product.product_s = cart.product_s
            if(cart.product_h) product.product_h = cart.product_h
            if(cart.product_l) product.product_l = cart.product_l
            if(cart.product_l1) product.product_l1 = cart.product_l1
            if(cart.product_l2) product.product_l2 = cart.product_l2
            if(cart.product_m) product.product_m = cart.product_m
            if(cart.product_d) product.product_d = cart.product_d
            product.final_price = product.final_price
            product.general_options = cart.general_options[lang]
            product.general_options_original = JSON.stringify(cart.general_options)
            product.add_options = JSON.stringify(cart.additional_options)
            
            
       
        }
        if (product.availability) collection.push(product);
    }
    return collection;
}

module.exports = async(req, res, next) => {

    if (req.url && req.url.indexOf("uploads") > -1) {
       return next()
    }

    let tempUser = req.tempUser;
    const userId = req.user ? req.user.userid : null;
    let user
    let discount
    if (userId) {
        user = await userService.getUser(userId, ['email', 'first_name', 'last_name', 'discount', 'role', "coeficient", "retail_prices"]);
        discount = null
        if (user && user.role == config.DEALER_ROLE) discount = await models.configs.findOne({ where: { type: 'dealer_discount' }, raw: true });
        if (user && user.role == config.DESIGNER_ROLE) discount = await models.configs.findOne({ where: { type: 'designer_discount' }, raw: true });
        if (discount && discount.value) discount = discount.value
    }
    const lang = req.lang;
    let total = 0;
    let quantity = 0;
    let collection = []

    try {
        // if(userId){
        //     cartProducts = await cartService.getUserCarts(userId);
        //     if(cartProducts && cartProducts.length){
        //         collection = await parseCart(cartProducts, lang);
        //     }
        // } else if(tempUser){
        //     cartProducts = await cartService.getUserCarts(tempUser);
        //     if(cartProducts && cartProducts.length){
        //         collection = await parseCart(cartProducts, lang);
        //     }
        // }

        if (userId && !tempUser) {
            cartProducts = await cartService.getUserCarts(userId);
            if (cartProducts && cartProducts.length) {
                collection = await parseCart(cartProducts, lang, user, discount);
            }
        } else if (tempUser && !userId) {
            cartProducts = await cartService.getUserCarts(tempUser);
            if (cartProducts && cartProducts.length) {
                collection = await parseCart(cartProducts, lang, user, discount);
            }
        } else {
            cartProducts = await cartService.getUserCarts(userId);
            if (cartProducts && cartProducts.length) {
                collection = await parseCart(cartProducts, lang, user, discount);
            }
        }

        // else{
        //     if(cartProducts && cartProducts.length){
        //         collection = await parseCart(cartProducts, lang);
        //     }
        // }
        if (collection && collection.length) {
            for (let el of collection) {
                total += Number(el.total);
                quantity += Number(el.quantity);
            }
        }
        req.cart = {
            collection,
            total,
            quantity
        };
        return next();

    } catch (error) {
        console.error(error)
        next(error)
    }
}
