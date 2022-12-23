const productService = require('../services/product.service');
const brandService = require('../services/brand.service');
const informProductAvailabilityService = require('../services/inform.product.availability.service');
const errors = require('../configs/errors');
const config = require('../configs/config');
const log = require("../utils/logger");
const { Op } = require("sequelize");
const menuService = require("../services/menu.service");
module.exports = {

    getAllProducts: async(req, res) => {
        let { category, sort, filter, brand, attributes, productIds } = req.body;

        let allProducts = await productService.getAllProducts(category, sort, filter, brand, attributes, productIds);

        for (let i of allProducts.products) {
            if (i.promo_label) i.promo_label = JSON.parse(i.promo_label)
            if (i.gallery) i.gallery = i.gallery.split(",");
            if (i.recommended_products) i.recommended_products = i.recommended_products.split(",");
            if (i.similar_products) i.similar_products = i.similar_products.split(",");
        }
        let attrinuteIds = []
        let brandIds = []
        let categotyProducts = await productService.getAllProducts(category)

        for (let p of categotyProducts.products) {
            for (let v of p.product_variations) {
                for (let a of v.attribute) {
                    attrinuteIds.push({ id: a.id, value: a.activeValue.value, title: a.title, status: a.status, type: a.type })
                }
            }
            brandIds.push(p.brand_id);
        }
        attrinuteIds = _(attrinuteIds)
            .uniqBy(v => [v.id, v.value].join())
            .value();
        attrinuteIds = _.groupBy(attrinuteIds, 'id');
        let finalAttributes = []
        for (let property in attrinuteIds) {
            let attribute = {}
            let arrOfAttr = attrinuteIds[property];
            attribute.id = property
            attribute.value = _.sortBy(arrOfAttr, 'value').map(i => i.value);
            attribute.title = arrOfAttr[0].title
            attribute.status = arrOfAttr[0].status
            attribute.type = arrOfAttr[0].type
            finalAttributes.push(attribute);
        }
        brandIds = _.uniq(brandIds);

        let findedBrands = await brandService.getBrands(brandIds)
        let result = {
            products: allProducts.products,
            attributes: finalAttributes,
            brands: findedBrands,
            minPrice: allProducts.minPrice,
            maxPrice: allProducts.maxPrice
        }
        return res.status(200).json(result);

    },

    getCategories: async(req, res) => {
        let { sort } = req.body;
        let result = await productService.getProductsForMain(sort)
        for (let i of result) {
            if (i.promo_label) i.promo_label = JSON.parse(i.promo_label)
            if (i.gallery) i.gallery = i.gallery.split(",");
            if (i.recommended_products) i.recommended_products = i.recommended_products.split(",");
            if (i.similar_products) i.similar_products = i.similar_products.split(",");
        }
        return res.status(200).json(result);

    },


    informUser: async(req, res) => {
        try {
            let { name, email, product_id } = req.body;
            if (!name || !email || !product_id) {
                return res.status(errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code).json({
                    message: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.message,
                    errCode: errors.BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI.code,
                });
            }

            if (!config.REGEX_EMAIL.test(email)) {
                return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                });
            }
            let regexp = /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            if (!regexp.test(email)) {
                return res.status(errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code).json({
                    message: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.message,
                    errCode: errors.BAD_REQUEST_USER_EMAIL_NOT_VALID.code,
                });
            }
            await informProductAvailabilityService.createInformProductAvailability({
                name,
                email,
                product_id,
                status: config.GLOBAL_STATUSES.ACTIVE
            })

            return res.json({ message: "Запит успішно відправлено!" });

        } catch (err) {
            return res.status(400).json({
                message: err.message,
                errCode: 400
            });
        }

    },
    deleteFromInformProductAvailability: async(req, res) => {
        let email = req.params.email;
        let product_id = req.params.product_id;
        try {
            log.info(`Start get /product/deleteFromInformProductAvailability. Params: ${JSON.stringify(req.params)}`);

            let informproduct = await informProductAvailabilityService.getOneInformProductAvailabilitysByFilter({ email: email, product_id: product_id })

            if (informproduct) {
                if (informproduct.status === config.GLOBAL_STATUSES.DELETED) {
                    await informProductAvailabilityService.deleteInformProductAvailabilitysByFilter({ email: email, product_id: product_id });
                } else {
                    await informProductAvailabilityService.updateInformAvailabilityById({ email: email, product_id: product_id }, { status: config.GLOBAL_STATUSES.DELETED })
                }
            }

            log.info(`End get /product/deleteFromInformProductAvailability`);

            return res.redirect('/client/thanks')

        } catch (error) {
            log.error(`${error}`);
            return res.status(400).json({
                message: error.message,
                errCode: 400
            });
        }
    }

}