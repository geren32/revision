const log = require('./logger');
const productCompositeImagesUtil = require('./composite-images')
const { imagePath } = require('./handebar-helpers');
const productService = require("../services/product.service");
module.exports = async(product) => {
    log.info(`Start get-compositeIMG-from-options-util data:${JSON.stringify(product)}`)
    let mainImg
    let compositeArr = []
    let result
    try {
        if (product && product.steps && product.steps.length) {
            for (let step of product.steps) {
                for (let atrGr of step.attribute_groups) {
                    for (let attr of atrGr.attributes) {
                        if (attr.is_default) {
                            let originAttrId = attr.origin_id ? attr.origin_id : attr.id
                            let originProdId = product.origin_id ? product.origin_id : product.id
                            let attribute = await productService.getProdToAtrByFilter({ attribute_id: originAttrId, product_id: originProdId })
                            if (attribute) attribute = attribute.toJSON()
                            if (attribute.image) {
                                attribute.image = imagePath(attribute.image, null, 1)
                                compositeArr.push('public' + attribute.image)
                            }
                        }
                    }
                }
            }
            if (product.image && compositeArr.length) {
                product.image = imagePath(product.image, '930X930', 1, product.is_color)
                mainImg = 'public' + product.image
            }

            if (mainImg && compositeArr && compositeArr.length) {

                let image = await productCompositeImagesUtil(mainImg, compositeArr);
                product.image = image
                product.composite_image = true
                product.image = "data:image/png;base64," + product.image.toString('base64');
            }
            result = product
        } else result = product

        log.info(`End get-compositeIMG-from-options-util`)
        return result

    } catch (err) {
        log.error(`${err}`);
        throw new Error(err)
    }


}