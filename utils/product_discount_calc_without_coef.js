const config = require('../configs/config');


module.exports = (user, product_price, discount) => {
    if (!user) return Math.ceil(product_price)
    let result
    discount = parseFloat(discount/100)


    if (user.role == config.DEALER_ROLE || user.role == config.DESIGNER_ROLE) {
        let user_discount
        if (user.discount) {
            user_discount = parseFloat(user.discount/100)
        }

        if (user.retail_prices == 1) {
            result = product_price
        }
        if (user.retail_prices == 2) {
            if (user.discount) {
                result  = product_price - product_price* user_discount
            } else if (discount) {
                result  = product_price - product_price* discount
            }
        }
    } else result = product_price
    return Math.ceil(result)
}