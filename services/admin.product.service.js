const { models } = require('../sequelize-orm');
const sequelize = require('../sequelize-orm');
const Sequelize = require('sequelize');

const { Op } = Sequelize;
const config = require("../configs/config");


module.exports = {

    countProductsByParam: async (filter) => {
        const result = await models.product.count({
            where: filter
        });
        return result ? result : 0;
    },

    countKitByParam: async (filter) => {
        const result = await models.product_kit.count({
            where: filter
        });
        return result ? result : 0;
    },

    countCategoryByParam: async (filter) => {
        const result = await models.product_category.count({
            where: filter
        });
        return result ? result : 0;
    },

    countAttributesByParam: async (filter) => {
        const result = await models.attribute.count({
            where: filter
        });
        return result ? result : 0;
    },

    countAttributesKitByParam: async (filter) => {
        const result = await models.attribute_kit.count({
            where: filter
        });
        return result ? result : 0;
    },

    countCategoryKitByParam: async (filter) => {
        const result = await models.product_kit_category.count({
            where: filter
        });
        return result ? result : 0;
    },

    countMarksByParam: async (filter) => {
        const result = await models.product_mark.count({
            where: filter
        });
        return result ? result : 0;
    },
    countIconsByParam: async (filter) => {
        const result = await models.product_icon.count({
            where: filter
        });
        return result ? result : 0;
    },

    makeProductsFilter: async (body, whereObj) => {
        let arr = [];
        let joinWhere = [];
        let sort;

        if (body.search) {
            // let searchField = body.search.trim().split(" ");
            // if (searchField && searchField.length) {
            //     let like = [];
            //     searchField.forEach((item) => {
            //         like.push({ [Op.like]: `%${item}%` });
            //     });
                arr.push({
                    [Op.or]: [
                        // { sku: { [Op.or]: like } },
                        // { name: { [Op.or]: like } },
                        { sku: { [Op.like]: `%${body.search}%`}},
                        { name: { [Op.like]: `%${body.search}%` }},



                        // { short_description: { [Op.or]: like } },
                        // { description: { [Op.or]: like } }
                    ]
                });
           // }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.availability) {
            arr.push({ availability: body.availability });
        }
        if (body.type) {
            arr.push({ type: body.type });
        }
        if (body.category) {
            joinWhere.push({ id: body.category });
            joinWhere.push({ status: config.GLOBAL_STATUSES.ACTIVE });
        } else {
            joinWhere = null
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;
            // if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            // if (body.dateTo) {
            //     if (body.dateFrom == body.dateFrom) {
            //         date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
            //     } else {
            //         date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
            //     }
            // }

            arr.push({ created_at: date });
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] }, joinWhere };
        return filter;
    },

    makeCategoryFilter: async (body, whereObj) => {
        let arr = [];
        let sort;
        if (body.onlyParent) {
            arr.push({ parent_id: 0 })
        }
        let topLevel = false;
        if (body.topLevel) topLevel = true;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({ title: { [Op.or]: like } });
            }
            topLevel = true;
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
            topLevel = true;
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
            topLevel = true;
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] }, topLevel };
        return filter;
    },

    makeMarksFilter: async (body, whereObj) => {
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({
                    [Op.or]: [
                        { title: { [Op.or]: like } },
                        { color: { [Op.or]: like } }
                    ]
                });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            /*if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;*/
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        return filter;
    },

    makeIconsFilter: async (body, whereObj) => {
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({
                    [Op.or]: [
                        { title: { [Op.or]: like } },
                        { color: { [Op.or]: like } }
                    ]
                });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            /*if (body.dateFrom) date[Op.gte] = body.dateFrom;
            if (body.dateTo) date[Op.lte] = body.dateTo;*/
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        return filter;
    },

    makeAttributeFilter: async (body, whereObj) => {
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({ title: { [Op.or]: like } });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }

        if (body.group_id || body.group_id === null) {
            arr.push({ group_atr: body.group_id });
        }
        
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.position) {
                sort = [['position', body.sort.position]];
            }
        } else {
            sort = [['position', 'ASC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        return filter;
    },

    makeAttributeKitFilter: async (body, whereObj) => {
        let arr = [];
        let sort;

        if (body.search) {
            let searchField = body.search.trim().split(" ");
            if (searchField && searchField.length) {
                let like = [];
                searchField.forEach((item) => {
                    like.push({ [Op.like]: `%${item}%` });
                });
                arr.push({ title: { [Op.or]: like } });
            }
        }
        if (body.status && body.status != 'all') {
            arr.push({ status: body.status });
        }
        if (body.dateFrom || body.dateTo) {
            let date = {};
            if (body.dateFrom) date[Op.gte] = new Date(body.dateFrom).getTime() / 1000;
            if (body.dateTo) {
                if (body.dateFrom == body.dateFrom) {
                    date[Op.lte] = (new Date(body.dateTo).getTime() / 1000) + 86400;
                } else {
                    date[Op.lte] = new Date(body.dateTo).getTime() / 1000;
                }
            }

            arr.push({ created_at: date });
        }
        if (body.sort) {
            if (body.sort.created_at) {
                sort = [['created_at', body.sort.created_at]];
            }
        } else {
            sort = [['created_at', 'DESC']];
        }

        let filter = { sort, where: { [Op.and]: [whereObj, ...arr] } };
        return filter;
    },

    adminGetAllProducts: async (filter, page, perPage, attributes,sort) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;

            if(!sort){
                sort = [['position', 'ASC']]
            } else if(sort && sort.direction && sort.key =='category'){
                sort = [[{model: models.product_category, as: "category"},"title", sort.direction]]
            }else if(sort && sort.direction && sort.key !='category'){
                sort = [[sort.key, sort.direction]];
            } else  sort = [['position', 'ASC']]


            let result = await models.product.findAndCountAll({
                where: filter.where,
                offset: offset,
                order: sort,
                limit: limit,
                attributes: attributes,
                distinct: true,
                include: [
                    {
                        model: models.product_category,
                        as: "category",
                        where: filter.joinWhere
                    },
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.product_variations
                    },
                ]
            });


            if (result && result.rows && result.rows.length) {
                let all = []
                for (let element of result.rows) {
                    element = element.toJSON();
                    if(element.type == config.PRODUCT_TYPES.SIMPLE_VARIATIONS){
                        if(element.product_variations && element.product_variations.length){
                            let variationsName = element.product_variations.find(el => !el.value);
                            if(variationsName && variationsName.name){
                            element.product_variations
                                .filter(x => x.value)
                                .map((item, index) => {
                                    let k = item;
                                    if(k.price) k.price = Math.round(k.price/100);
                                    if(k.discounted_price) k.discounted_price = Math.round(k.discounted_price/100);
                                    if(k.name) delete k.name;
                                    if(index === 0){
                                        element.price = k.price
                                        if(k.discounted_price )element.discounted_price = k.discounted_price
                                    }
                                    return k
                                });
                            }
                        }
                    }   else {
                        element.price = element.price ? element.price/100 : null;
                        element.discounted_price = element.discounted_price ? element.discounted_price/100 : null;
                    }
                    
                    let lang_change = await models.product.findAll({
                        where: {
                            [Op.or]: [{ id: element.id }, { origin_id: element.id }]
                        },
                        attributes: ['id', 'origin_id', 'lang'],
                        raw: true
                    })
                    let change = {}
                    for (let id of lang_change) {
                        id.history = await models.admin_changes_history.findAll({
                            where: {
                                item_id: id.id,
                                type: "product"
                            },
                            raw: true
                        })
                        for (const lang of config.LANGUAGES) {
                            if (id.lang === lang) {
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    element.change = change
                    all.push(element)
                }
                result.rows = all
            }
            
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllProductsKit: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_kit.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include: [
                    {
                        model: models.product_kit_category,
                        as: "as_category_kit_product",
                        where: filter.joinWhere
                    },
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                ]
            });
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllCategory: async (filter, page, perPage, attributes,sort) => {
        try {

            if(!sort){
                sort = [['position', 'ASC']]

            }else if(sort && sort.direction && sort.key){
                sort = [[sort.key, sort.direction]];
            } else  sort = [['position', 'ASC']]


            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_category.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: sort,
                //attributes: attributes,
                distinct: true,
                include: [
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                ],
                attributes: {
                    include: [ [ sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM product_to_category
                    WHERE product_to_category.product_category_id = product_category.id )`),
                            'includeProductsCount'
                        ],
                    ],

                }
            });
            if (result && result.rows && result.rows.length) {
                if (!filter.topLevel) {
                    let allCategory = []
                    result.rows = result.rows.map(row => row.toJSON())
                        for (let i of result.rows) {
                            i.slug = await models.links.findOne({ where: { original_link: `${i.lang !== config.LANGUAGES[0] ? `/${i.lang}` : ''}/shop/getCategory/${i.id}` } })
                            i.slug = i.slug && i.slug.slug ? i.slug.slug : null;
                            let lang_change = await models.product_category.findAll({
                                where: {
                                    [Op.or]: [
                                        { id: i.id },
                                        { origin_id: i.id }
                                    ]
                                },
                                attributes: ['id', 'origin_id', 'lang']
                            })
                            lang_change = lang_change.map(i => i.toJSON())
                            let change = {}
                            for (let id of lang_change) {
                                id.history = await models.admin_changes_history.findAll({
                                    where: {
                                        item_id: id.id,
                                        type: 'catalog'
                                    }
                                })
                                for (const lang of config.LANGUAGES) {
                                    if(id.lang === lang){
                                        change[lang] = id.history.length > 1 ? true : false;
                                    }
                                }
                            }
                            i.change = change
                            allCategory.push(i)
                        }
                        result.rows = allCategory


                    const nest = (items, id = 0, link = 'parent_id') =>
                        items
                            .filter(item => item[link] === id)
                            .map(item => ({ ...item, children: nest(items, item.id) }));

                    let array = nest(result.rows);
                    let newArr = [];
                    const f1 = (items, level) => {
                        items.forEach(a => {
                            a.level = level;
                            newArr.push(a);
                            if (a.children) f1(a.children, level + 1);
                        })
                    }
                    f1(array, 0)
                    newArr = newArr.map(a1 => {
                        delete a1.children
                        return a1
                    });
                    result.rows = newArr;
                    let lonelyProducts = await models.product_to_category.count({ where: { product_category_id: null } });
                    result.rows.unshift({ id: 0, level: 0, parent_id: 0, includeProductsCount: lonelyProducts, title: 'Без категорії' });
                }
            }

            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllCategoryKit: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_kit_category.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                //attributes: attributes,
                distinct: true,
                include: [
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                ],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM product_kit_to_category_kit
                    WHERE
                        product_kit_to_category_kit.product_kit_category_id = product_kit_category.id
                )`),
                            'includeProductsCount'
                        ]
                    ]
                }
            });
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllIcons: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_icon.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true,
                include: [
                    {
                        as: 'image',
                        model: models.uploaded_files
                    }
                ]
            });
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    adminGetAllMarks: async (filter, page, perPage, attributes) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.product_mark.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                attributes: attributes,
                distinct: true
            });
            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllAttributes: async (filter, page, perPage) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.attribute.findAndCountAll({
                attributes:['id','origin_id','lang','title','status','unit_of_measurement','position','image_id','created_at','updated_at'],
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                distinct: true
            });

            if (result && result.rows && result.rows.length) {
                let all = []
                for (let item of result.rows) {
                    item = item.toJSON();
                    // if(item && item.group_atr){
                    //     let groupAtr = await models.attribute_groups.findOne({where: {id: item.group_atr}});
                    //     if(groupAtr && groupAtr.type && groupAtr.type == 6){
                    //         if(item.mirror_thickness) item.title = `${item.title} (${item.mirror_thickness}мм)`
                    //     }
                    // }
                    let lang_change = await models.attribute.findAll({
                        where: {
                            [Op.or]: [{ id: item.id }, { origin_id: item.id }]
                        },
                        attributes: ['id', 'origin_id', 'lang'],
                        raw: true
                    })
                    let change = {}
                    for (let id of lang_change) {
                        id.history = await models.admin_changes_history.findAll({
                            where: {
                                item_id: id.id,
                                type: "attribute"
                            },
                            raw: true
                        })
                        for (const lang of config.LANGUAGES) {
                            if (id.lang === lang) {
                                change[lang] = id.history.length > 1 ? true : false;
                            }
                        }
                    }
                    item.change = change
                    all.push(item)

                    let originId = item.origin_id ? item.origin_id : item.id ;
                    item.attribute_values = await models.attribute_values.findAll({
                        where: { 
                            origin_attribute_id: originId,
                            lang: item.lang
                        },
                        attributes:['id', 'value'],
                    })
                    
                }
                result.rows = all
            }

            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    adminGetAllAttributesKit: async (filter, page, perPage) => {
        try {
            const offset = perPage * (page - 1);
            const limit = perPage;
            let result = await models.attribute_kit.findAndCountAll({
                where: filter.where,
                offset: offset,
                limit: limit,
                order: filter.sort,
                distinct: true
            });

            return result.count > 0 && result.rows.length ? {
                data: result.rows,
                count: result.count
            } : { data: [], count: 0 };

        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getCategoryOne: async (filter, convertToFrontFormat) => {
        try {
            let result = await models.product_category.findOne({
                where: filter,
                include: [
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "characteristics_image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "reviews_image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "configurator_image"
                    },
                    {
                        model: models.attribute,
                        as: 'attributes',
                        attributes: ['id', 'title'],
                        through: { attributes: [] }
                    },
                ]
            });
            if (convertToFrontFormat && result) {
                result = result.toJSON();
                // if (result.image_id) {
                //     result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
                // }

                result.attributes = result.attributes && result.attributes.length ? result.attributes.map(el => el.id) : [];
                result.attribute_groups = result.attribute_groups ? JSON.parse(result.attribute_groups) : null;
                result.sections = [{
                    body: [{
                        type: "2",
                        content:
                        {
                            text_2: result.seo_hidden_text,
                            title: result.seo_title,
                            text: result.seo_text,
                        }

                    }]
                }];

                result.meta_data = await models.meta_data.findOne({ where: { url: `/shop/getCategory/${result.id}` } })
                result.link = await models.links.findOne({ where: { original_link: `/shop/getCategory/${result.id}` } })
                result.slug = result.link && result.link.slug ? result.link.slug : null;
                delete result.link
            }
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getCategoryKitOne: async (filter, convertToFrontFormat) => {
        try {
            let result = await models.product_kit_category.findOne({
                where: filter,
                include: [
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "seo_image"
                    }
                ]
            });
            if (convertToFrontFormat && result) {
                result = result.toJSON();
                if (result.image_id) {
                    result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
                }
                if (result.seo_image_id) {
                    result.seo_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.seo_image_id, lang: result.lang }, { origin_id: result.seo_image_id, lang: result.lang }] } });
                }
                result.sections = [{
                    title: null, body: [{
                        type: "16", content: {
                            title: result.seo_title,
                            text: result.seo_text,
                            hidden_text: result.seo_hidden_text,
                            image: result.seo_image,

                        }
                    }]
                }];
                result = {
                    id: result.id,
                    origin_id: result.origin_id,
                    lang: result.lang,
                    title: result.title,
                    slug: result.slug,
                    status: result.status,
                    created_at: result.created_at,
                    updated_at: result.updated_at,
                    image: result.image,
                    sections: result.sections,
                }
            }
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getCategories: async (filter, trans) => {
        let transaction = trans ? trans : null;
        try {
            let result = await models.product_category.findAll({
                where: filter,
                transaction
            });

            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },


    getMarkOne: async (filter) => {
        try {
            let result = await models.product_mark.findOne({
                where: filter
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getIconOne: async (filter) => {
        try {
            let result = await models.product_icon.findOne({
                where: filter,
                include: [
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                ],
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getAttributeOne: async (filter, lang) => {
        try {
            let result = await models.attribute.findOne({
                where: filter,
                attributes:['id','origin_id','lang','title','status','position','image_id','created_at','updated_at'],
                include:[
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                ]
            })
            if(result && lang){
                result = result.toJSON();
                let originId = result.origin_id ? result.origin_id : result.id ;
                result.attribute_values = await models.attribute_values.findAll({
                    where: { 
                        origin_attribute_id: originId,
                        lang: lang
                    },
                    attributes:['id','origin_id', 'value']
                })

            }

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },


    getAttributeAll: async (filter) => {
        try {
            let result = await models.attribute.findAll({
                where: filter
            })
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getMarksAll: async (filter) => {
        try {
            let result = await models.product_mark.findAll({
                where: filter
            });
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getIconAll: async (filter) => {
        try {
            let result = await models.product_icon.findAll({
                where: filter
            });
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    saveMark: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let ids = { [Op.or]: [{ id: id }, { origin_id: id }] }

            let result;
            if (id) {
                result = await models.product_mark.findOne({
                    where: { id: id },
                    transaction
                })
            }
            if (!result) {
                result = await models.product_mark.create(data, { transaction });
            } else {
               
                await models.product_mark.update(data, { where: { id: id }, transaction });
                result = await models.product_mark.findOne({
                    where: { id: id },
                    transaction
                })
                if (data.status && data.lang !== "uk") {
                    let res = await models.product_mark.findAll({
                        where: {
                            [Op.or]: [{ id: result.dataValues.origin_id }, { origin_id: result.dataValues.origin_id }]
                        }, transaction
                    })
                    res = res.map(i => i.id);
                   
                    ids = { id: { [Op.in]: res } }
                }
                await models.product_mark.update({ status: data.status }, { where: ids, transaction })

            }
            if (!trans) await transaction.commit();

            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    saveIcon: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let ids = { [Op.or]: [{ id: id }, { origin_id: id }] }
            let result;
            if (id) {
                result = await models.product_icon.findOne({
                    where: { id: id },
                    transaction
                })

            }

            if (!result) {
                result = await models.product_icon.create(data, { transaction });
            } else {
                await models.product_icon.update(data, { where: { id: id }, transaction });
                result = await models.product_icon.findOne({
                    where: { id: id },
                    transaction
                })

                if (data.status && data.lang !== "uk") {
                    let res = await models.product_icon.findAll({
                        where: {
                            [Op.or]: [{ id: result.dataValues.origin_id }, { origin_id: result.dataValues.origin_id }]
                        }, transaction
                    })
                    res = res.map(i => i.id);
                    
                    ids = { id: { [Op.in]: res } }
                }
                await models.product_icon.update({ status: data.status }, { where: ids, transaction })
            }
            if (!trans) await transaction.commit();

            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    saveAttribute: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;
            if (id) {
                result = await models.attribute.findOne({
                    where: { id: id },
                    transaction
                })
            }
            if (!result) {
                result = await models.attribute.create(data, { transaction });
            } else {
                await models.attribute.update(data, { where: { id: id }, transaction });
                result = await models.attribute.findOne({
                    attributes: ['id', 'origin_id', 'lang', 'title', 'status', 'created_at', 'updated_at'],
                    where: { id: id },
                    transaction
                })
            }
            if (!trans) await transaction.commit();

            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    saveAttributeKit: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;
            if (id) {
                result = await models.attribute_kit.findOne({
                    where: { id: id },
                    transaction
                })
            }
            if (!result) {
                result = await models.attribute_kit.create(data, { transaction });
            } else {
                await models.attribute_kit.update(data, { where: { id: id }, transaction });
                result = await models.attribute_kit.findOne({
                    attributes: ['id', 'origin_id', 'lang', 'title', 'status', 'created_at', 'updated_at'],
                    where: { id: id },
                    transaction
                })
            }
            if (!trans) await transaction.commit();

            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deleteMark: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();

            await models.product_mark.destroy({
                where: { id: id },
                transaction
            });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    deleteIcon: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();

            await models.product_icon.destroy({
                where: { id: id },
                transaction
            });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deleteCategory: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();
            await models.product_category.destroy({
                where: { id: id },
                transaction
            });
            await models.product_category_to_attribute.destroy({
                where: { product_category_id: id },
                transaction
            });
            await models.product_to_category.destroy({
                where: { product_category_id: id },
                transaction
            });
            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deleteProductAttribute: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();

            await models.attribute.destroy({
                where: { id: id },
                transaction
            });
            await models.attribute_ranges.destroy({
                where: { origin_attribute_id: id },
                transaction
            });
            await models.product_to_attribute.destroy({
                where: { attribute_id: id },
                transaction
            });

            let oldAtrVal = await models.attribute_values.findAll({
                where: { origin_attribute_id: id },
                attributes:['id', 'value'],
                transaction
            });
            let oldAtrIds = oldAtrVal.map(atr => atr.id);
            await models.attribute_values.destroy({ where: { origin_attribute_id: id }, transaction });
            await models.product_to_attribute.destroy({ where: { value: oldAtrIds }, transaction });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deleteProductAttributeKit: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();

            await models.attribute_kit.destroy({
                where: { id: id },
                transaction
            });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    

    deleteCategoryKit: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();
            await models.product_kit_category.destroy({
                where: { id: id },
                transaction
            });
            await models.product_kit_to_category_kit.destroy({
                where: { product_kit_category_id: id },
                transaction
            });
            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    saveCategoryKit: async (data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;
            if (data.id) {
                result = await models.product_kit_category.findOne({
                    where: { id: data.id },
                    transaction
                })
            }
            if (!result) {
                let position = await models.product_kit_category.findOne({ order: [['position', 'DESC']] })
                position = position.toJSON();
                data.position = position.id + 1
                result = await models.product_kit_category.create(data, { transaction });
            } else {
                await models.product_kit_category.update(data, { where: { id: data.id }, transaction });
                result = await models.product_kit_category.findOne({
                    where: { id: data.id },
                    /*include:[
                        {
                            model: models.uploaded_files,
                            as: "image"
                        },
                        {
                            model: models.uploaded_files,
                            as: "seo_image"
                        }
                    ],*/
                    transaction
                });

                if (result) {
                    result = result.toJSON();
                    if (result.image_id) {
                        result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
                    }
                    if (result.seo_image_id) {
                        result.seo_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.seo_image_id, lang: result.lang }, { origin_id: result.seo_image_id, lang: result.lang }] } });
                    }
                    result.sections = [{
                        title: null, body: [{
                            type: "16", content: [{
                                title: result.seo_title,
                                text: result.seo_text,
                                hidden_text: result.seo_hidden_text,
                                image: result.seo_image,

                            }]
                        }]
                    }];
                    result = {
                        id: result.id,
                        origin_id: result.origin_id,
                        lang: result.lang,
                        title: result.title,
                        slug: result.slug,
                        status: result.status,
                        created_at: result.created_at,
                        updated_at: result.updated_at,
                        image: result.image,
                        sections: result.sections,
                    }
                }
            }
            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updateCategoryKit: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let filter = id;
            if (typeof id !== 'object') {
                filter = { id: id }
            }
            await models.product_kit_category.update(data, { where: filter, transaction });
            if (!trans) await transaction.commit();

            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    saveProduct: async (product, categories, attributes, marks, otherLangIds, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;

            if (product.id) {
                result = await models.product.findOne({
                    where: { id: product.id },
                    transaction
                })
            }
            if (!result) {
                result = await models.product.create(product, { transaction });

                let variation = await models.product_variations.create({ ...product, product_id: result.id }, { transaction });

                for (let categ of categories) {
                    await models.product_to_category.create({
                        product_id: result.id,
                        product_category_id: categ.id
                    }, { transaction })
                }
                for (let atr of attributes) {
                    if (atr.id) {
                        await models.product_to_attribute.create(
                            {
                                attribute_id: atr.id,
                                value: atr.activeValue && atr.activeValue.value ? atr.activeValue.value : null,
                                product_variation_id: variation.id
                            }, { transaction })
                    }
                }
                for (let mark of marks) {
                    await models.product_to_mark.create({
                        product_id: result.id,
                        mark_id: mark.id
                    }, { transaction })
                }
            } else {
                const variations = await models.product_variations.findAll({ where: { product_id: { [Op.in]: otherLangIds } }, transaction });
                const variationIds = variations.map(i => i.id);
                await models.product.update(product, { where: { id: product.id }, transaction });
                await models.product_variations.update({
                    sku: product.sku,
                    price: product.price,
                    old_price: product.old_price,
                    product_id: product.id,
                    status: product.status,
                    gallery: product.gallery
                }, { where: { product_id: product.id }, transaction });
                await models.product_to_category.destroy({ where: { product_id: { [Op.in]: otherLangIds } }, transaction });
                await models.product_to_attribute.destroy({ where: { product_variation_id: { [Op.in]: variationIds } }, transaction });
                await models.product_to_mark.destroy({ where: { product_id: { [Op.in]: otherLangIds } }, transaction });

                for (let id of otherLangIds) {

                    for (let categ of categories) {
                        await models.product_to_category.create({
                            product_id: id,
                            product_category_id: categ.id
                        }, { transaction })
                    }
                    for (let atr of attributes) {
                        if (atr.id) {
                            const variation = variations.find(v => v.product_id === id);
                            await models.product_to_attribute.create({
                                attribute_id: atr.id,
                                value: atr.activeValue && atr.activeValue.value ? atr.activeValue.value : null,
                                product_variation_id: variation.id
                            }, { transaction })
                        }
                    }
                    for (let mark of marks) {
                        await models.product_to_mark.create({
                            product_id: id,
                            mark_id: mark.id
                        }, { transaction })
                    }
                }
            }

            result = await models.product.findOne({
                where: { id: result.id },
                include: [
                    {
                        model: models.product_category,
                        as: 'category',
                        attributes: ['id', 'title', 'slug'],
                        through: { attributes: [] }
                    },
                    /*{
                        model: models.attribute,
                        as: 'product_attribute',
                        attributes: ['id', 'title', 'value', 'status', 'type'],
                        through: {attributes: ['value'], as: 'activeValue'}
                    },*/
                    {
                        model: models.product_variations,
                        as: "product_variations",
                        //attributes: [],
                        include: [
                            {
                                model: models.attribute,
                                as: 'attribute',
                                attributes: ['id', 'title', 'value', 'status', 'type'],
                                through: { attributes: ['value'], as: 'activeValue' }
                            }
                        ]
                    },
                    {
                        model: models.product_mark,
                        through: { attributes: [] }
                    },
                    /*{
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "seo_image"
                    }*/
                ],
                transaction
            });

            if (result) {
                result = result.toJSON();
                if (result.image_id) {
                    result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
                }
                if (result.seo_image_id) {
                    result.seo_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.seo_image_id, lang: result.lang }, { origin_id: result.seo_image_id, lang: result.lang }] } });
                }
                if (result && result.gallery && result.gallery.length && Array.isArray(result.gallery)) {
                    result.gallery = await models.uploaded_files.findAll({ where: { file_type: 'image', [Op.or]: [{ id: { [Op.in]: result.gallery }, lang: result.lang }, { origin_id: { [Op.in]: result.gallery }, lang: result.lang }] } });
                    result.gallery = result.gallery.map(i => { return { image: i } });
                }
                if (result && result.recommended_products && result.recommended_products.length && Array.isArray(result.recommended_products)) {
                    result.recommended_products = await models.product.findAll({
                        where: { id: { [Op.in]: result.recommended_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                    result.similar_products = await models.product.findAll({
                        where: { id: { [Op.in]: result.similar_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.product_variations && result.product_variations.length) {
                    result.product_attribute = result.product_variations[0].attribute;
                    delete result.product_variations;
                }
                /*result.sections = [{title: null, body: [{type: "16", content: [{
                            title: result.seo_title,
                            text: result.seo_text,
                            hidden_text: result.seo_hidden_text,
                            image: result.seo_image,
                        }] }]}];*/
            }



            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    saveProductVar: async (product, categories, product_variations, marks, otherLangIds, trans) => {
        let transaction = null;

        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;

            if (product.id) {
                result = await models.product.findOne({
                    where: { id: product.id },
                    transaction
                })
            }
            if (!result) {
                let position = await models.product.findOne({ order: [['position', 'DESC']] })
                position = position.toJSON();
                product.position = position.id + 1

                result = await models.product.create(product, { transaction });
                // let variation = await models.product_variations.create({...product, product_id: result.id }, {transaction});

                for (let categ of categories) {
                    await models.product_to_category.create({
                        product_id: result.id,
                        product_category_id: categ.id
                    }, { transaction })
                }

                for (let mark of marks) {
                    await models.product_to_mark.create({
                        product_id: result.id,
                        mark_id: mark.id
                    }, { transaction })
                }

                if (product_variations && product_variations.length) {
                    for (let variation of product_variations) {
                        if (variation.gallery && variation.gallery.length) {
                            let galleryImgArr = [];
                            for (const img of variation.gallery) {
                                if (img && img.type && img.filename && img.access) {
                                    let imgPath = `${img.access}/${img.type}/${img.filename}`;
                                    galleryImgArr.push(imgPath);
                                }
                            }
                            variation.gallery = galleryImgArr.length ? galleryImgArr.toString() : null;
                        }


                        let prodVar = await models.product_variations.create({
                            product_id: result.id,
                            status: 1,
                            sku: variation.sku,
                            gallery: variation.gallery,
                            price: variation.price,
                            old_price: variation.old_price,
                            quantity: variation.quantity
                        }, { transaction })

                        if (variation.attributes && variation.attributes.length) {
                            for (const atr of variation.attributes) {
                                await models.product_to_attribute.create(
                                    {
                                        attribute_id: atr.id,
                                        value: atr.value,
                                        product_variation_id: prodVar.id
                                    }, { transaction }
                                )
                            }
                        }
                    }
                }

                // for (let atr of attributes) {
                //     if(atr.id){
                //         await models.product_to_attribute.create(
                //             {
                //                 attribute_id: atr.id,
                //                 value: atr.activeValue && atr.activeValue.value ? atr.activeValue.value : null,
                //                 product_variation_id: variation.id
                //             }, {transaction})
                //     }
                // }

            } else {

                // const variations = await models.product_variations.findAll({where: {product_id: { [Op.in]: otherLangIds }}, transaction });
                // const variationIds = variations.map(i => i.id);
                await models.product.update(product, { where: { id: product.id }, transaction });
                // await models.product_variations.update({
                //     sku: product.sku,
                //     price: product.price,
                //     old_price: product.old_price,
                //     product_id: product.id,
                //     status: product.status,
                //     gallery: product.gallery
                // }, {where: {product_id: product.id}, transaction});
                if (product_variations && product_variations.length) {
                    //DESTROY

                    await models.product_to_attribute.destroy({ where: { product_variation_id: product.id }, transaction });
                    await models.product_variations.destroy({ where: { product_id: product.id }, transaction });

                    //CREATE
                    for (const variation of product_variations) {
                        if (variation.gallery && variation.gallery.length) {
                            let galleryImgArr = [];
                            for (const img of variation.gallery) {
                                if (img && img.type && img.filename && img.access) {
                                    let imgPath = `${img.access}/${img.type}/${img.filename}`;
                                    galleryImgArr.push(imgPath);
                                }
                            }
                            variation.gallery = galleryImgArr.length ? galleryImgArr.toString() : null;
                        }
                        let prodVar = await models.product_variations.create(
                            {
                                product_id: product.id,
                                status: 1,
                                sku: variation.sku,
                                gallery: variation.gallery,
                                price: variation.price,
                                old_price: variation.old_price,
                                quantity: variation.quantity
                            }, { transaction }
                        );
                        if (variation.attributes && variation.attributes.length) {
                            for (const atr of variation.attributes) {
                                await models.product_to_attribute.create(
                                    {
                                        attribute_id: atr.id,
                                        value: atr.value,
                                        product_variation_id: prodVar.id
                                    }, { transaction }
                                )
                            }
                        }
                    }
                }
                await models.product_to_category.destroy({ where: { product_id: { [Op.in]: otherLangIds } }, transaction });
                await models.product_to_mark.destroy({ where: { product_id: { [Op.in]: otherLangIds } }, transaction });

                for (let id of otherLangIds) {

                    for (let categ of categories) {
                        await models.product_to_category.create({
                            product_id: id,
                            product_category_id: categ.id
                        }, { transaction })
                    }

                    for (let mark of marks) {
                        await models.product_to_mark.create({
                            product_id: id,
                            mark_id: mark.id
                        }, { transaction })
                    }
                }
            }

            result = await models.product.findOne({
                where: { id: result.id },
                include: [
                    {
                        model: models.product_category,
                        as: 'category',
                        attributes: ['id', 'title', 'slug'],
                        through: { attributes: [] }
                    },
                    /*{
                        model: models.attribute,
                        as: 'product_attribute',
                        attributes: ['id', 'title', 'value', 'status', 'type'],
                        through: {attributes: ['value'], as: 'activeValue'}
                    },*/
                    {
                        model: models.product_variations,
                        as: "product_variations",
                        //attributes: [],
                        include: [
                            {
                                model: models.attribute,
                                as: 'attribute',
                                attributes: ['id', 'title', 'value', 'status', 'type'],
                                through: { attributes: ['value'], as: 'activeValue' }
                            }
                        ]
                    },
                    {
                        model: models.product_mark,
                        through: { attributes: [] }
                    },
                    /*{
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "seo_image"
                    }*/
                ],
                transaction
            });

            if (result) {
                result = result.toJSON();
                if (result.image_id) {
                    result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
                }
                if (result.seo_image_id) {
                    result.seo_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.seo_image_id, lang: result.lang }, { origin_id: result.seo_image_id, lang: result.lang }] } });
                }
                if (result && result.gallery && result.gallery.length && Array.isArray(result.gallery)) {
                    result.gallery = await models.uploaded_files.findAll({ where: { file_type: 'image', [Op.or]: [{ id: { [Op.in]: result.gallery }, lang: result.lang }, { origin_id: { [Op.in]: result.gallery }, lang: result.lang }] } });
                    result.gallery = result.gallery.map(i => { return { image: i } });
                }
                if (result && result.recommended_products && result.recommended_products.length && Array.isArray(result.recommended_products)) {
                    result.recommended_products = await models.product.findAll({
                        where: { id: { [Op.in]: result.recommended_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                    result.similar_products = await models.product.findAll({
                        where: { id: { [Op.in]: result.similar_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.product_variations && result.product_variations.length) {
                    result.product_attribute = result.product_variations[0].attribute;
                    delete result.product_variations;
                }
                /*result.sections = [{title: null, body: [{type: "16", content: [{
                            title: result.seo_title,
                            text: result.seo_text,
                            hidden_text: result.seo_hidden_text,
                            image: result.seo_image,
                        }] }]}];*/
            }



            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },
    saveProductKit: async (product, categories, attributes, marks, productsInKit, otherLangIds, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;

            if (product.id) {
                result = await models.product_kit.findOne({
                    where: { id: product.id },
                    transaction
                })
            }
            if (!result) {
                let position = await models.product_kit.findOne({ order: [['position', 'DESC']] })
                position = position.toJSON();
                product.position = position.id + 1
                result = await models.product_kit.create(product, { transaction });

                for (let categ of categories) {
                    await models.product_kit_to_category_kit.create({
                        product_kit_id: result.id,
                        product_kit_category_id: categ.id
                    }, { transaction })
                }
                for (let atr of attributes) {
                    if (atr.id) {
                        await models.product_kit_to_attribute.create(
                            {
                                attribute_kit_id: atr.id,
                                value: atr.activeValue && atr.activeValue.value ? atr.activeValue.value : null,
                                product_kit_id: result.id
                            }, { transaction }
                        )
                    }
                }
                for (let mark of marks) {
                    await models.product_kit_to_mark.create({
                        product_kit_id: result.id,
                        mark_id: mark.id
                    }, { transaction })
                }

                let price = 0;
                for (let [index, product] of productsInKit.entries()) {
                    let findProduct = await models.product.findOne({ where: { id: product.id }, raw: true, transaction });
                    if (findProduct && findProduct.id) {

                        await models.product_to_kit.create({
                            product_kit_id: result.id,
                            product_id: product.id,
                            substitute: index,
                            quantity: product.product_to_kit.quantity
                        }, { transaction });

                        price = price + findProduct.price * (product.product_to_kit.quantity > 0 ? product.product_to_kit.quantity : 1);
                    }
                }
                await models.product_kit.update({ price: price }, { where: { id: result.id }, transaction });

            } else {
                await models.product_kit.update(product, { where: { id: product.id }, transaction });
                await models.product_kit_to_category_kit.destroy({ where: { product_kit_id: { [Op.in]: otherLangIds } }, transaction });
                await models.product_kit_to_attribute.destroy({ where: { product_kit_id: { [Op.in]: otherLangIds } }, transaction });
                await models.product_kit_to_mark.destroy({ where: { product_kit_id: { [Op.in]: otherLangIds } }, transaction });
                await models.product_to_kit.destroy({ where: { product_kit_id: { [Op.in]: otherLangIds } }, transaction });
                let finalProductKitPrice = 0;

                for (let id of otherLangIds) {
                    for (let categ of categories) {
                        await models.product_kit_to_category_kit.create({
                            product_kit_id: id,
                            product_kit_category_id: categ.id
                        }, { transaction })
                    }
                    for (let atr of attributes) {
                        if (atr.id) {
                            await models.product_kit_to_attribute.create({
                                attribute_kit_id: atr.id,
                                value: atr.activeValue && atr.activeValue.value ? atr.activeValue.value : null,
                                product_kit_id: id
                            }, { transaction }
                            )
                        }
                    }
                    for (let mark of marks) {
                        await models.product_kit_to_mark.create({
                            product_kit_id: id,
                            mark_id: mark.id
                        }, { transaction })
                    }

                    let price = 0;
                    for (let [index, product] of productsInKit.entries()) {
                        let findProduct = await models.product.findOne({ where: { id: product.id }, raw: true, transaction });
                        if (findProduct && findProduct.id) {
                            await models.product_to_kit.create({
                                product_kit_id: id,
                                product_id: product.id,
                                substitute: index,
                                quantity: product.product_to_kit.quantity
                            }, { transaction });

                            price = price + findProduct.price * (product.product_to_kit.quantity > 0 ? product.product_to_kit.quantity : 1);
                        }
                    }
                    if (finalProductKitPrice === 0) finalProductKitPrice = price;
                }
                await models.product_kit.update({ price: finalProductKitPrice }, { where: { id: { [Op.in]: otherLangIds } }, transaction });
            }

            result = await models.product_kit.findOne({
                where: { id: result.id },
                include: [
                    {
                        model: models.product_kit_category,
                        as: 'category_kit',
                        attributes: ['id', 'title', 'slug'],
                        through: { attributes: [] }
                    },
                    {
                        model: models.attribute_kit,
                        as: 'product_kit_attribute',
                        attributes: ['id', 'title', 'value', 'status', 'type'],
                        through: { attributes: ['value'], as: 'activeValue' }
                    },
                    {
                        model: models.product_mark,
                        through: { attributes: [] }
                    },
                    /*{
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "seo_image"
                    },*/
                    {
                        model: models.product,
                        as: 'as_product_kit',
                        attributes: ['id', 'sku', 'name', 'slug'],
                        through: { attributes: ['substitute', 'position', 'quantity'] },
                        include: [
                            { model: models.uploaded_files, as: 'image' },
                        ],

                    }
                ],
                transaction
            });

            if (result) {
                result = result.toJSON();
                if (result.image_id) {
                    result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
                }
                if (result.seo_image_id) {
                    result.seo_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.seo_image_id, lang: result.lang }, { origin_id: result.seo_image_id, lang: result.lang }] } });
                }
                if (result && result.gallery && result.gallery.length && Array.isArray(result.gallery)) {
                    result.gallery = await models.uploaded_files.findAll({ where: { file_type: 'image', [Op.or]: [{ id: { [Op.in]: result.gallery }, lang: result.lang }, { origin_id: { [Op.in]: result.gallery }, lang: result.lang }] } });
                    result.gallery = result.gallery.map(i => { return { image: i } });
                }
                if (result && result.recommended_products && result.recommended_products.length && Array.isArray(result.recommended_products)) {
                    result.recommended_products = await models.product_kit.findAll({
                        where: { id: { [Op.in]: result.recommended_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                    result.similar_products = await models.product_kit.findAll({
                        where: { id: { [Op.in]: result.similar_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                /*result.sections = [{title: null, body: [{type: "16", content: [{
                            title: result.seo_title,
                            text: result.seo_text,
                            hidden_text: result.seo_hidden_text,
                            image: result.seo_image,
                        }] }]}];*/
            }



            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    updateProduct: async (product, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;

            await models.product.update(product, { where: { id: product.id }, transaction });
            await models.product_variations.update({ status: product.status }, { where: { product_id: product.id }, transaction });

            result = await models.product.findOne({
                where: { id: product.id },
                include: [
                    {
                        model: models.product_category,
                        as: 'category',
                        attributes: ['id', 'title', 'slug'],
                        through: { attributes: [] }
                    },
                    {
                        model: models.product_variations,
                        as: "product_variations",
                        //attributes: [],
                        include: [
                            {
                                model: models.attribute,
                                as: 'attribute',
                                attributes: ['id', 'title', 'value', 'status', 'type'],
                                through: { attributes: ['value'], as: 'activeValue' }
                            }
                        ]
                    },
                    {
                        model: models.product_mark,
                        through: { attributes: [] }
                    },
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "seo_image"
                    }
                ],
                transaction
            });

            if (result) {
                result = result.toJSON();
                if (result && result.gallery && result.gallery.length && Array.isArray(result.gallery)) {
                    result.gallery = await models.uploaded_files.findAll({ where: { file_type: 'image', id: { [Op.in]: result.gallery } }, transaction });
                }
                if (result && result.recommended_products && result.recommended_products.length && Array.isArray(result.recommended_products)) {
                    result.recommended_products = await models.product.findAll({
                        where: { id: { [Op.in]: result.recommended_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                    result.similar_products = await models.product.findAll({
                        where: { id: { [Op.in]: result.similar_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.product_variations && result.product_variations.length) {
                    result.product_attribute = result.product_variations[0].attribute;
                    delete result.product_variations;
                }
                /*result.sections = [{title: null, body: [{type: "16", content: [{
                            title: result.seo_title,
                            text: result.seo_text,
                            hidden_text: result.seo_hidden_text,
                            image: result.seo_image,
                        }] }]}];*/
            }

            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    updateProductKit: async (product, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();
            let result;

            product.updated_at = Math.floor(new Date().getTime() / 1000);
            await models.product_kit.update(product, { where: { id: product.id }, transaction });

            result = await models.product_kit.findOne({
                where: { id: product.id },
                include: [
                    {
                        model: models.product_kit_category,
                        as: 'category_kit',
                        attributes: ['id', 'title', 'slug'],
                        through: { attributes: [] }
                    },
                    {
                        model: models.attribute_kit,
                        as: 'product_kit_attribute',
                        attributes: ['id', 'title', 'value', 'status', 'type'],
                        through: { attributes: ['value'], as: 'activeValue' }
                    },
                    {
                        model: models.product_mark,
                        through: { attributes: [] }
                    },
                    {
                        model: models.uploaded_files,
                        as: "image"
                    },
                    {
                        model: models.uploaded_files,
                        as: "seo_image"
                    },
                    {
                        model: models.product,
                        as: 'as_product_kit',
                        attributes: ['id', 'sku', 'name', 'slug'],
                        through: { attributes: ['substitute', 'position', 'quantity'] },
                        include: [
                            { model: models.uploaded_files, as: 'image' },
                        ],

                    }
                ],
                transaction
            });

            if (result) {
                result = result.toJSON();
                if (result && result.gallery && result.gallery.length && Array.isArray(result.gallery)) {
                    result.gallery = await models.uploaded_files.findAll({ where: { file_type: 'image', id: { [Op.in]: result.gallery } }, transaction });
                }
                if (result && result.recommended_products && result.recommended_products.length && Array.isArray(result.recommended_products)) {
                    result.recommended_products = await models.product_kit.findAll({
                        where: { id: { [Op.in]: result.recommended_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                    result.similar_products = await models.product_kit.findAll({
                        where: { id: { [Op.in]: result.similar_products } }, include: [{
                            model: models.uploaded_files,
                            as: "image"
                        }], transaction
                    });
                }
                /*result.sections = [{title: null, body: [{type: "16", content: [{
                            title: result.seo_title,
                            text: result.seo_text,
                            hidden_text: result.seo_hidden_text,
                            image: result.seo_image,
                        }] }]}];*/
            }

            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            err.code = 400;
            if (transaction) await transaction.rollback();
            throw err;
        }
    },

    updateProductStatus: async (id, ids, data, categories, product_marks, recommended_products, product_icon, product_attribute, gallery, collections, thisId, together_cheaper, trans) => {
        let transaction = null;
        try {

            // transaction = trans ? trans : await sequelize.transaction();
            let update = await models.product.update(data, { where: { id: id }, transaction });
            await models.product.update({ status: data.status }, { where: { id: ids } })

            // if (!trans) await transaction.commit();
            if (thisId && thisId.length) {
                for (let its of thisId) {

                    await models.product_to_category.destroy({ where: { product_id: its } })
                    if (categories && categories.length) {
                        for (let id of categories) {
                            let arr = [id.id];
                            let category = await models.product_category.findOne({
                                where: { id: id.id },
                                raw: true
                            })
                            if (category && category.parent_id !== 0) {
                                arr.push(category.parent_id)
                                let subCategory = await models.product_category.findOne({
                                    where: { id: category.parent_id },
                                    raw: true
                                })
                                if (subCategory) {
                                    arr.push(subCategory.parent_id)
                                }
                            }
                            for (let i = arr.length - 1; i >= 0; i--) {
                                await models.product_to_category.create({
                                    product_id: its,
                                    product_category_id: arr[i]
                                })
                            }
                        }
                    }

                    await models.product_to_mark.destroy({ where: { product_id: its } })
                    if (product_marks && product_marks.length) {
                        for (let id of product_marks) {
                            await models.product_to_mark.create({
                                product_id: its,
                                mark_id: id.id
                            })
                        }
                    }

                    if (product_icon && product_icon.length) {
                        for (let id of product_icon) {
                            await models.product_to_icon.destroy({ where: { product_id: its } })
                            await models.product_to_icon.create({
                                product_id: its,
                                icon_id: id.id
                            })
                        }
                    }
                    await models.recommended_products.destroy({ where: { product_id: its } })
                    if (recommended_products && recommended_products.length) {
                        for (let id of recommended_products) {
                            await models.recommended_products.create({
                                product_id: its,
                                product_recommended: id.id
                            })
                        }
                    }
                    await models.together_cheaper_products.destroy({ where: { product_id: its } })
                    if (together_cheaper && together_cheaper.length) {
                        for (let el of together_cheaper) {
                            await models.together_cheaper_products.create({
                                product_id: its,
                                product_promotional_id: el.id,
                                product_promotional_price: el.promotional_price
                            })
                        }
                    }
                    

                    await models.product_to_attribute.destroy({ where: { product_id: its } })
                    if (product_attribute && product_attribute.length) {
                        for (let id of product_attribute) {
                            await models.product_to_attribute.create({
                                product_id: its,
                                value: id.activeValue.value,
                                attribute_id: id.id
                            })
                        }
                    }

                    // await models.product_to_collections.destroy({where:{product_id:its}})
                    // if (collections && collections.length){
                    //     for (let id of collections) {
                    //         await models.product_to_collections.create({
                    //             product_id:its,
                    //             product_collections_id: id.id
                    //         }, )
                    //     }
                    // }

                    // await models.product_gallery_to_uploaded_files.destroy({where:{product_id:its}})
                    // if (gallery && gallery.length){
                    //     for (let id of gallery) {
            
                    //         await models.product_gallery_to_uploaded_files.create({
                    //             product_id: its,
                    //             uploaded_files_id: id.block_image.id
                    //         }, )
                    //     }
                    // }
                }
                let result = await models.product.findOne({
                    where: { id: id },
                    include: [
                        {model: models.brand, attributes: ['title']},
                        {
                            model: models.product_category,
                            as: 'category',
                            attributes: ['id', 'title'],
                            through: { attributes: [] },
                            include: [{
                                model: models.attribute,
                                as: 'attributes',
                                attributes: ['id', 'title'],
                                through: { attributes: [] }
                            }]
                        },
                        {
                            model: models.mark,
                            as: 'product_marks',
                            attributes: ['id', 'title'],
                            through: { attributes: [] }
                        },
                        {
                            model: models.attribute,
                            as: 'product_attribute',
                            attributes: ['id', 'title'],
                            through: { attributes: ['value'], as: 'activeValue' }
                        },
                        {
                            model: models.uploaded_files,
                            as: 'gallery',
                            through: { attributes: [] }
                        },

                        {
                            model: models.together_cheaper_products,
                            include: [
                                {
                                    model: models.product,
                                    include: [
                                        {
                                            model: models.uploaded_files,
                                            as: 'image'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            model: models.recommended_products,
                            include: [
                                { model: models.product,  
                                    include: [
                                        {
                                            model: models.uploaded_files,
                                            as: 'image'
                                        }
                                    ] 
                                }
                            ]
                        },


                    ],
                    
                })
                result = result ? result.toJSON() : result;
                if (result && result.recommended_products && result.recommended_products.length) {
                    result.recommended_products = result.recommended_products.map(el => el.product)
                }

                return result;
            }
            else {
                return true;
            }
        } catch (err) {
            // if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateProductOnlyStatus: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.product.update(data, { where: { id: id }, transaction });
            if (!trans) await transaction.commit();

            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    updateProductKitStatus: async (id, data, trans) => {
        let transaction = null;
        try {
            transaction = trans ? trans : await sequelize.transaction();

            await models.product_kit.update(data, { where: { id: id }, transaction });
            if (!trans) await transaction.commit();

            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateIconStatus: async (id, data) => {
        // let transaction = null;
        try {
            // transaction = trans ? trans : await sequelize.transaction();
           

            let res = await models.product_icon.update(data, { where: { id: id } });
            // if (!trans) await transaction.commit();

            return res;
        } catch (err) {
            // if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },
    updateMarkStatus: async (id, data) => {
        // let transaction = null;
        try {
            // transaction = trans ? trans : await sequelize.transaction();
        

            let res = await models.product_mark.update(data, { where: { id: id } });
            // if (!trans) await transaction.commit();

            return res;
        } catch (err) {
            // if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getProductOne: async (filter, trans) => {
        let transaction = trans ? trans : await sequelize.transaction();
        try {
            let result = await models.product.findOne({
                where: filter,
                transaction
                /*include: [
                    {
                        model: models.product_category,
                        as: 'category',
                        attributes: ['id', 'title','slug'],
                        through: {attributes: []}
                    }
                ],*/
            });
            if (result) result = result.toJSON();

            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    getProducts: async (filter) => {
        try {
            let result = await models.product.findAll({
                where: filter,
            });

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getProductKits: async (filter) => {
        try {
            let result = await models.product_kit.findAll({
                where: filter,
            });

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },

    getProductKitOne: async (filter, trans) => {
        let transaction = trans ? trans : await sequelize.transaction();
        try {
            let result = await models.product_kit.findOne({
                where: filter,
                transaction
                /*include: [
                    {
                        model: models.product_category,
                        as: 'category',
                        attributes: ['id', 'title','slug'],
                        through: {attributes: []}
                    }
                ],*/
            });
            if (result) result = result.toJSON();

            if (!trans) await transaction.commit();
            return result;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

   /*  getProduct: async (id) => {
        let filter = id;
        if (typeof id !== 'object') {
            filter = { id: id }
        }

        let result = await models.product.findOne({
            where: filter,
            include: [
                {
                    model: models.brand,
                    attributes: ['id']
                },
                {
                    model: models.product_category,
                    as: 'category',
                    attributes: ['id', 'title'],
                    through: { attributes: [] },
                    include: [{
                        model: models.attribute,
                        as: 'attributes',
                        attributes: ['id', 'title'],
                        through: { attributes: [] }
                    }]
                },
                {
                    model: models.mark,
                    as: 'product_marks',
                    through: { attributes: [] }
                },
                {
                    model: models.uploaded_files,
                    as: 'gallery',
                    through: { attributes: [] }
                },
                {
                    model: models.attribute,
                    as: 'product_attribute',
                    attributes: ['id', 'title'],
                    through: { attributes: ['value'], as: 'activeValue' }
                },
                {
                    model: models.recommended_products,
                    include: [
                        { model: models.product,  
                            include: [
                                {
                                    model: models.uploaded_files,
                                    as: 'image'
                                }
                            ] 
                        }
                    ]
                },
                {
                    model: models.uploaded_files,
                    as: "image"
                },
                {
                    model: models.together_cheaper_products,
                    include: [
                        {
                            model: models.product,
                            include: [
                                {
                                    model: models.uploaded_files,
                                    as: 'image'
                                }
                            ]
                        }
                    ]
                },
            ],

        })

        if (result) {
            result = result.toJSON()

            //check this brand_id
            if (result.brand_id) {
                result.brand_id = [{
                    id: result.brand_id
                }]
            }

            if (result.recommended_products && result.recommended_products.length) {
                result.recommended_products = result.recommended_products.map(el => el.product)
            }

        }
        let link = await models.links.findOne({ where: { original_link: `/shop/getProduct/${result.id}` } })
        result.slug = link && link.slug ? link.slug : null;
        
        return result
    }, */

    getProductKit: async (id) => {
        let filter = id;
        if (typeof id !== 'object') {
            filter = { id: id }
        }

        let result = await models.product_kit.findOne({
            where: filter,
            include: [
                {
                    model: models.product_kit_category,
                    as: 'category_kit',
                    attributes: ['id', 'title', 'slug'],
                    through: { attributes: [] }
                },
                {
                    model: models.attribute_kit,
                    as: 'product_kit_attribute',
                    attributes: ['id', 'title', 'value', 'status', 'type'],
                    through: { attributes: ['value'], as: 'activeValue' }
                },
                {
                    model: models.product_mark,
                    through: { attributes: [] }
                },
                /*{
                    model: models.uploaded_files,
                    as: "image"
                },
                {
                    model: models.uploaded_files,
                    as: "seo_image"
                },*/
                {
                    model: models.product,
                    as: 'as_product_kit',
                    attributes: ['id', 'sku', 'name', 'slug'],
                    through: { attributes: ['substitute', 'position', 'quantity'] },
                    include: [
                        { model: models.uploaded_files, as: 'image' },
                    ],

                }
            ]
        });

        if (result) {
            result = result.toJSON();
            if (result.image_id) {
                result.image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.image_id, lang: result.lang }, { origin_id: result.image_id, lang: result.lang }] } });
            }
            if (result.seo_image_id) {
                result.seo_image = await models.uploaded_files.findOne({ where: { file_type: 'image', [Op.or]: [{ id: result.seo_image_id, lang: result.lang }, { origin_id: result.seo_image_id, lang: result.lang }] } });
            }
            if (result && result.gallery && result.gallery.length && Array.isArray(result.gallery)) {
                result.gallery = await models.uploaded_files.findAll({ where: { file_type: 'image', [Op.or]: [{ id: { [Op.in]: result.gallery }, lang: result.lang }, { origin_id: { [Op.in]: result.gallery }, lang: result.lang }] } });
                result.gallery = result.gallery.map(i => { return { image: i } });
            }
            if (result && result.recommended_products && result.recommended_products.length && Array.isArray(result.recommended_products)) {
                result.recommended_products = await models.product_kit.findAll({
                    where: { id: { [Op.in]: result.recommended_products } }, include: [{
                        model: models.uploaded_files,
                        as: "image"
                    }]
                });
            }
            if (result && result.similar_products && result.similar_products.length && Array.isArray(result.similar_products)) {
                result.similar_products = await models.product_kit.findAll({
                    where: { id: { [Op.in]: result.similar_products } }, include: [{
                        model: models.uploaded_files,
                        as: "image"
                    }]
                });
            }
            /*result.sections = [{title: null, body: [{type: "16", content: [{
                        title: result.seo_title,
                        text: result.seo_text,
                        hidden_text: result.seo_hidden_text,
                        image: result.seo_image,
                    }] }]}];*/
        }

        return result
    },

    deleteProduct: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();

            await models.product_variations.destroy({ where: { product_id: id }, transaction });
            await models.product_to_category.destroy({ where: { product_id: id }, transaction });
            await models.product_to_attribute.destroy({ where: { product_id: id }, transaction });
            await models.product_to_mark.destroy({ where: { product_id: id }, transaction });
            await models.recommended_products.destroy({ where: { product_id: id }, transaction });
            await models.together_cheaper_products.destroy({ where: { product_id: id }, transaction });
            await models.together_cheaper_products.destroy({ where: { product_promotional_id: id }, transaction });
            await models.product_to_uploaded_files.destroy({ where: { product_id: id }, transaction });
            await models.product_testimonials.destroy({ where: { origin_product_id: id }, transaction });
            await models.product.destroy({ where: { id: id }, transaction });

            if (!trans) await transaction.commit();
            return true;

        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    deleteProductKit: async (id, trans) => {
        let transaction = null;
        try {
            const transaction = trans ? trans : await sequelize.transaction();

            await models.product_kit_to_category_kit.destroy({
                where: { product_kit_id: id },
                transaction
            });
            await models.product_kit_to_attribute.destroy({
                where: { product_kit_id: id },
                transaction
            });
            await models.product_kit_to_mark.destroy({
                where: { product_kit_id: id },
                transaction
            });
            await models.product_kit.destroy({
                where: { id: id },
                transaction
            });
            await models.product_to_kit.destroy({
                where: { product_kit_id: id },
                transaction
            });

            if (!trans) await transaction.commit();
            return true;
        } catch (err) {
            if (transaction) await transaction.rollback();
            err.code = 400;
            throw err;
        }
    },

    /******************** */

    createAttribute: async (attribute) => {
        try {
            let result = await models.attribute.create(attribute);

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    countsAttribute: async (whereObj) => {
        try {
            let result = await models.attribute.findAndCountAll({
                where: whereObj,
            });
            return result.count ? result.count : 0;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getAttributes: async (ids) => {
        let where = {}
        if (ids) {
            where.id = ids;
        }
        try {
            //log.info(`Start getAttributes.`)
            let result = await models.attribute.findAll({
                raw: true,
                where: where
            })
            // log.info(`Start getAttributes.`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    getAttributeById: async (id) => {
        try {
            // log.info(`Start getAttributeById. ${JSON.stringify(id)}`)
            let result = await models.attribute.findOne({
                where: { id: id }
            })
            // log.info(`End getAttributeById. ${JSON.stringify(id)}`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    deleteAttribute: async (id) => {
        try {
            // log.info(`Start deleteAttribute. ${JSON.stringify(id)}`)
            await models.product_to_attribute.destroy({
                where: { attribute_id: id }
            })
            let result = models.attribute.destroy({
                where: { id: id }
            })
            // log.info(`End deleteAttribute. ${JSON.stringify(id)}`)
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    editAttribute: async (id, attribute) => {
        try {
            // log.info(`Start editAttribute. id - ${JSON.stringify(id)}, attribute - ${JSON.stringify(attribute)}`)
            await models.attribute.update(attribute, { where: { id } })
            let result = models.attribute.findOne({
                where: { id: id }
            })
            return result;
            // log.info(`End editManufacturer. id - ${JSON.stringify(id)}, attribute - ${JSON.stringify(attribute)}`)
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    setPosition: async (trans) => {
        try {
            const transaction = trans ? trans : await sequelize.transaction();
            //Set position product_kit
            let product_kit = await models.product_kit.findAll();
            for (let item of product_kit) {
                await models.product_kit.update({ position: item.id }, { where: { id: item.id }, transaction })

            }
            //Set position product
            let product = await models.product.findAll();
            for (let item of product) {
                await models.product.update({ position: item.id }, { where: { id: item.id }, transaction })

            }
            //Set position product_category
            let product_category = await models.product_category.findAll();
            for (let item of product_category) {
                await models.product_category.update({ position: item.id }, { where: { id: item.id }, transaction })

            }
            //Set position product_kit_category
            let product_kit_category = await models.product_kit_category.findAll();
            for (let item of product_kit_category) {
                await models.product_kit_category.update({ position: item.id }, { where: { id: item.id }, transaction })

            }
            //Set position posts
            let posts = await models.posts.findAll();
            for (let item of posts) {
                await models.posts.update({ position: item.id }, { where: { id: item.id }, transaction })

            }
            if (!trans) await transaction.commit();
            return true

        }
        catch (err) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;

        }
    },
    getLastCategory: async () => {
        try {
            // log.info(`Start editAttribute. id - ${JSON.stringify(id)}, attribute - ${JSON.stringify(attribute)}`)

            let result = await models.product_category.findOne({ order: [['created_at', 'DESC']] })
            return result.toJSON();
            // log.info(`End editManufacturer. id - ${JSON.stringify(id)}, attribute - ${JSON.stringify(attribute)}`)
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    async getCategoriesTest(admin) {
        try {


            let include = {};
            if (!admin) {
                include = [
                    /* {
                         model: models.product, as: 'product', attributes: [],
                         where: {status: config.GLOBAL_STATUSES.ACTIVE},
                         through: {attributes: []}
                     },*/
                    {
                        model: models.uploaded_files,
                        as: "image"
                    }

                ]
            } else {
                include = [
                    {
                        model: models.product, as: 'product', attributes: [],
                        through: { attributes: [] }
                    },
                    {
                        model: models.uploaded_files,
                        as: "image"
                    }
                ]
            }
            // parrent: 0, 
            let result = await models.product_category.findAll({
                where: { status: config.GLOBAL_STATUSES.ACTIVE },
                include: include,
                raw: true,
                nest: true,
                order: [["position", "ASC"]]
            });

            for (let category of result) {
                category.sub_categories = await models.product_category.findAll({
                    where: { parent_id: category.id, status: config.GLOBAL_STATUSES.ACTIVE },
                    raw: true,
                    order: [["position", "ASC"]]
                });
            }

            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    changeCategoryPosition: async (category_id, category_id_2) => {

        try {
            let result = await models.product_category.findOne({ where: { id: category_id } })
            result = result.toJSON();

            let result2 = await models.product_category.findOne({ where: { id: category_id_2 } })
            result2 = result2.toJSON();

            await models.product_category.update({ position: result.position }, { where: { id: result2.id } });
            await models.product_category.update({ position: result2.position }, { where: { id: result.id } });
            return true;
        } catch (error) {
            error.code = 400;
            throw error;
        }
    },
    changePositionCategory: async (category, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of category) {

                await models.product_category.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }

            // for (let key of ids){

            result = await models.product_category.findAll({ where: { id: { [Op.in]: ids } }, order: [["position", "ASC"]], transaction })
            // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },
    updateCategoryPositions: async (category) => {
        let ids = [];
        let result;

        try {
            for (let item of category) {
                let res = await models.product_category.findOne({ where: { id: item.id } })
                if (res) {
                    res = res.toJSON()
                    if (res.origin_id === 0) {
                        

                        await models.product_category.update({ position: item.position }, { where: { [Op.or]: [{ id: res.id }, { origin_id: res.id }] } })
                    } else {
                        await models.product_category.update({ position: item.position }, { where: { [Op.or]: [{ id: res.origin_id }, { origin_id: res.origin_id }] } })
                    }
                }
                ids.push(item.id);
            }

            result = await models.product_category.findAll({ where: { id: { [Op.in]: ids } }, order: [["position", "DESC"]] })

            return result
        } catch (error) {
            error.code = 400;

            throw error;
        }

    },
    changePositionCategoryKit: async (category, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of category) {

                await models.product_kit_category.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }

            // for (let key of ids){

            result = await models.product_kit_category.findAll({ where: { id: { [Op.in]: ids } }, order: [["position", "ASC"]], transaction })
            // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },
    changePositionProduct: async (product, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of product) {

                await models.product.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }


            result = await models.product.findAll({ where: { id: { [Op.in]: ids } }, order: [["position", "ASC"]], transaction })
            // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },
    changePositionProductKit: async (product_kit, trans) => {
        let transaction = null;
        let ids = [];
        let result;

        try {
            const transaction = trans ? trans : await sequelize.transaction();
            for (let item of product_kit) {

                await models.product_kit.update({ position: item.position }, { where: { id: item.id }, transaction });
                ids.push(item.id);
            }


            result = await models.product_kit.findAll({ where: { id: { [Op.in]: ids } }, order: [["position", "ASC"]], transaction })
            // }
            if (!trans) await transaction.commit();

            return result
        } catch (error) {
            if (transaction) await transaction.rollback();
            error.code = 400;

            throw error;
        }

    },
}
