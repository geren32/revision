const config = require('../configs/config');


module.exports = async(user, product_price,discount) => {

    if(!user) return product_price*100
    let result

    discount = parseFloat(discount/100)


    if (user.role == config.DEALER_ROLE || user.role == config.DESIGNER_ROLE) {
        let coeficient
        if(user.coeficient){
            coeficient = parseFloat(user.coeficient/100)
        }
        let user_discount
        if (user.discount) {
            user_discount = parseFloat(user.discount/100)
        }
        
        if (user.retail_prices == 1 ) {
            result = product_price
        }
        if (user.retail_prices == 2 && !user.coeficient) {
            if (user.discount) {
                result = product_price/(1-user_discount)
            } else if(discount){
                result = product_price/(1-discount)
            }
        }
        else if (user.retail_prices == 2 && user.coeficient) {
            if (user.discount) {
               let coef_price = product_price/(1+coeficient)
                result = coef_price/(1-user_discount)
                
            } else if(discount){
                let coef_price = product_price/(1+coeficient)
                result = coef_price/(1-discount)
            }
            
        } else result = product_price
    } else result = product_price
    result = result*100
    return result
}