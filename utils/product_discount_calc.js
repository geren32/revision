const config = require('../configs/config');


module.exports = (user, product_price, discount) => {
    if (!user) return Math.ceil(product_price)
    let result
    discount = parseFloat(discount/100)


    if (user.role == config.DEALER_ROLE || user.role == config.DESIGNER_ROLE) {
        let coeficient 
        if (user.coeficient) {
            coeficient = parseFloat(user.coeficient/100)
        }
        let user_discount
        if (user.discount) {
            user_discount = parseFloat(user.discount/100)
        }

        if (user.retail_prices == 1) {
            result = product_price
        }
        if (user.retail_prices == 2 && !user.coeficient) {
            if (user.discount) {
                
                result  = product_price - product_price* user_discount
            } else if (discount) {
                result  = product_price - product_price* discount
            }
        }
        else if (user.retail_prices == 2 && user.coeficient) {
            let discount_price
            if (user.discount) {
                discount_price = product_price - product_price*user_discount
                result = discount_price + discount_price*coeficient
            } else if (discount) {
                discount_price = product_price - product_price*discount
                result = discount_price + discount_price*coeficient
            }

        } else result = product_price
    } else result = product_price
    return Math.ceil(result)
}