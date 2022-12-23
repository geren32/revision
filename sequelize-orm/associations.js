
function associations(sequelize) {
    const {
        user,
        product,
        product_category,
        product_to_attribute,
        address,
        orders,
        orders_form_results,
        attribute,
        attribute_ranges,
        posts,
        pages,
        orders_revision,
        recommended_products,
        cart,
        uploaded_files,
        admin_changes_history,
        forms,
        form_comments,
        pages_content,
        configs,
        posts_content,
        together_cheaper_products,
        inform_product_availability,
        product_to_mark,
        mark,
        city,
        stores,
        promotions,
        promotions_content,
        promotion_to_mark,
        promocode,
        product_testimonials,
        product_category_to_attribute,
        product_to_uploaded_files,
        product_content,
        attribute_groups,
        user_address,
        steps,
        product_variations,
        product_favorites,
        admin_comments_in_orders,
        user_uploaded_files,
        order_statuses,
        notifications,
        user_to_notifications,
        faq,
        faqs_content,
        service,
        service_content,
        service_form,
        service_form_field,
        reviews,
        service_category,
        service_category_content,
        service_additional,
        order_images_to_user_uploaded_files,
        service_additional_files
    } = sequelize.models;



    // promocode.hasMany(orders, { foreignKey: 'promocode', sourceKey: 'id' });
    // orders.belongsTo(promocode, { foreignKey: 'promocode', sourceKey: 'id' });

    user.hasMany(orders, { foreignKey: 'user_id', sourceKey: 'id' });
    orders.belongsTo(user, { foreignKey: 'user_id', sourceKey: 'id' });

    service.hasMany(orders, { foreignKey: 'service_id', sourceKey: 'id' });
    orders.belongsTo(service, { foreignKey: 'service_id', sourceKey: 'id' });

    orders.hasMany(admin_comments_in_orders, { foreignKey: 'order_id', sourceKey: 'id' });
    admin_comments_in_orders.belongsTo(orders, { foreignKey: 'order_id', sourceKey: 'id' });

    admin_comments_in_orders.belongsTo(user, { foreignKey: 'user_id', sourceKey: 'id' });

    posts.hasMany(posts_content, { foreignKey: 'post_id', sourceKey: 'id' });
    posts_content.belongsTo(posts, { foreignKey: 'post_id', sourceKey: 'id' });
    posts_content.belongsTo(uploaded_files, { as: "block_image", foreignKey: 'block_image_id', sourceKey: 'id' });


    posts.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    posts.belongsTo(uploaded_files, { as: "banner_image", foreignKey: 'banner_id', sourceKey: 'id' });
    posts.belongsTo(uploaded_files, { as: "banner_image_mobile", foreignKey: 'image_mobile_id', sourceKey: 'id' });

    pages.hasMany(pages_content, { foreignKey: 'page_id', sourceKey: 'id' });
    pages.belongsTo(uploaded_files, { as: "banner_image", foreignKey: 'banner_image_id', sourceKey: 'id' });
    pages.belongsTo(uploaded_files, { as: "banner_image_mobile", foreignKey: 'banner_image_mobile_id', sourceKey: 'id' });
    pages.belongsTo(uploaded_files, { as: "background_image", foreignKey: 'background_image_id', sourceKey: 'id' });
    pages.belongsTo(uploaded_files, { as: "background_image_mobile", foreignKey: 'background_image_mobile_id', sourceKey: 'id' });
    pages_content.belongsTo(pages, { foreignKey: 'page_id', sourceKey: 'id' });

    pages_content.belongsTo(uploaded_files, { as: "section_icon", foreignKey: 'section_icon_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "image_mobile", foreignKey: 'image_mobile_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "block_image_mobile", foreignKey: 'image_mobile_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "block_image", foreignKey: 'block_image_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "block_image_hover", foreignKey: 'block_image_hover_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "block_map_background_image", foreignKey: 'block_map_background_image_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "block_map_image", foreignKey: 'block_map_image_id', sourceKey: 'id' });
    pages_content.belongsTo(uploaded_files, { as: "block_video", foreignKey: 'block_video_id', sourceKey: 'id' });

    user.hasMany(orders, { foreignKey: 'user_id', sourceKey: 'id' });
    orders.belongsTo(user, { foreignKey: 'user_id', sourceKey: 'id' });

    orders.hasMany(orders_revision, { foreignKey: 'orders_id', sourceKey: 'id' });
    orders_revision.belongsTo(orders, { foreignKey: 'orders_id', sourceKey: 'id' });

    product.hasMany(recommended_products, { foreignKey: 'product_id', sourceKey: 'id' });
    // recommended_products.belongsTo(product, { foreignKey: 'product_recommended', sourceKey: 'id' });
    recommended_products.hasOne(product, { foreignKey: 'id', sourceKey: 'product_recommended' });

    product.hasMany(product_to_attribute, { foreignKey: 'product_id', sourceKey: 'id' });

    product.hasMany(product_to_mark, { foreignKey: 'product_id', sourceKey: 'id' });

    product.hasMany(product_variations, { foreignKey: 'product_id', sourceKey: 'id' });




    product.belongsToMany(attribute, {
        through: "product_to_attribute",
        as: "product_attribute",
        foreignKey: "product_id",
    });
    attribute.belongsToMany(product, {
        through: "product_to_attribute",
        as: "product_attribute",
        foreignKey: "attribute_id"
    });

    product_category.belongsToMany(attribute, {
        through: "product_category_to_attribute",
        as: "attributes",
        foreignKey: "product_category_id",
    });
    attribute.belongsToMany(product_category, {
        through: "product_category_to_attribute",
        as: "attributes",
        foreignKey: "attribute_id"
    });


    product.hasMany(together_cheaper_products, { foreignKey: 'product_id', sourceKey: 'id' });
    together_cheaper_products.hasOne(product, { foreignKey: 'id', sourceKey: 'product_promotional_id' });
    // together_cheaper_products.belongsTo(product, { foreignKey: 'product_id', sourceKey: 'id'});
    // product.belongsToMany(product, {
    //     through: "together_cheaper_products",
    //     as: "together_cheaper",
    //     foreignKey: "product_id"
    // });




    product.belongsToMany(mark, {
        through: "product_to_mark",
        as: "product_marks",
        foreignKey: "product_id",
    });
    mark.belongsToMany(product, {
        through: "product_to_mark",
        as: "product_marks",
        foreignKey: "mark_id"
    });

    product.belongsToMany(uploaded_files, {
        through: "product_to_uploaded_files",
        as: "gallery",
        foreignKey: "product_id",
    });
    uploaded_files.belongsToMany(product, {
        through: "product_to_uploaded_files",
        as: "gallery",
        foreignKey: "uploaded_files_id"
    });


    product.belongsToMany(product_category, {
        through: "product_to_category",
        as: "category",
        foreignKey: "product_id"
    });

    product_category.belongsToMany(product, {
        through: "product_to_category",
        as: "product",
        foreignKey: "product_category_id"
    });




    user.hasMany(cart, { foreignKey: 'user_id', sourceKey: 'id' });
    cart.belongsTo(user, { foreignKey: 'user_id', sourceKey: 'id' });



    user.hasMany(admin_changes_history, { foreignKey: 'user_id', sourceKey: 'id' });
    admin_changes_history.belongsTo(user, { foreignKey: 'user_id', sourceKey: 'id' });

    forms.hasMany(form_comments, { foreignKey: 'form_id', sourceKey: 'id' });
    form_comments.belongsTo(forms, { foreignKey: 'form_id', sourceKey: 'id' });

    // configs.belongsTo(uploaded_files, { as: "header_logo", foreignKey: 'header_logo_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "header_logo2", foreignKey: 'header_logo2_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "header_logo3", foreignKey: 'header_logo3_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "header_logo4", foreignKey: 'header_logo4_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "header_logo5", foreignKey: 'header_logo5_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "header_logo6", foreignKey: 'header_logo6_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "footer_logo", foreignKey: 'footer_logo_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "schedule_icon", foreignKey: 'schedule_icon_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "phone_icon", foreignKey: 'phone_icon_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "email_icon", foreignKey: 'email_icon_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "address_icon", foreignKey: 'address_icon_id', sourceKey: 'id' });
    // configs.belongsTo(uploaded_files, { as: "header_image", foreignKey: 'header_image_id', sourceKey: 'id' });

    product_category.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    product_category.belongsTo(uploaded_files, { as: "characteristics_image", foreignKey: 'characteristics_image_id', sourceKey: 'id' });
    product_category.belongsTo(uploaded_files, { as: "reviews_image", foreignKey: 'reviews_image_id', sourceKey: 'id' });
    product_category.belongsTo(uploaded_files, { as: "configurator_image", foreignKey: 'configurator_image_id', sourceKey: 'id' });

    product.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    product.belongsTo(uploaded_files, { as: "hover_image", foreignKey: 'hover_image_id', sourceKey: 'id' });
    product.belongsTo(uploaded_files, { as: "characteristics_image", foreignKey: 'characteristics_image_id', sourceKey: 'id' });
    product.belongsTo(uploaded_files, { as: "reviews_image", foreignKey: 'reviews_image_id', sourceKey: 'id' });

    product.hasOne(inform_product_availability, { as: "inform_product", foreignKey: 'product_id', sourceKey: 'id' });



    mark.hasOne(uploaded_files, { as: "mark_image", foreignKey: 'id', sourceKey: 'image_id' });
    forms.hasOne(uploaded_files, { as: "popup_icon", foreignKey: 'id', sourceKey: 'popup_icon_id' });
    stores.hasOne(uploaded_files, { as: "icon", foreignKey: 'id', sourceKey: 'icon_id' });
    //stores.hasOne(uploaded_files, { as: "image", foreignKey: 'id', sourceKey: 'image_id' });
    stores.hasOne(uploaded_files, { as: "icon_hover", foreignKey: 'id', sourceKey: 'icon_hover_id' });
        ///////////////////////////////////
        ///////////////////////////////////
        ///////////////////////////////////
        //////////NEW CONTENT//////////////
        ///////////////////////////////////
        ///////////////////////////////////
        ///////////////////////////////////
    city.hasMany(stores, { foreignKey: 'city_id', sourceKey: 'id' });
    stores.belongsTo(city, { foreignKey: 'city_id', sourceKey: 'id' });

    user.hasMany(cart, { foreignKey: 'user_id', sourceKey: 'id' });
    cart.belongsTo(user, { foreignKey: 'user_id', sourceKey: 'id' });

    product.hasMany(cart, { foreignKey: 'product_id', sourceKey: 'id' });
    cart.belongsTo(product, { foreignKey: 'product_id', sourceKey: 'id' });


    promotions.hasMany(promotions_content, { foreignKey: 'promotion_id', sourceKey: 'id' });
    promotions_content.belongsTo(promotions, { foreignKey: 'promotion_id', sourceKey: 'id' });
    promotions_content.belongsTo(uploaded_files, { as: "block_image", foreignKey: 'block_image_id', sourceKey: 'id' });
    promotions.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    promotions.belongsTo(uploaded_files, { as: "banner_image", foreignKey: 'banner_id', sourceKey: 'id' });
    promotions.belongsTo(uploaded_files, { as: "banner_image_mobile", foreignKey: 'image_mobile_id', sourceKey: 'id' });
    promotions.hasMany(promotion_to_mark, { foreignKey: "promotion_id" });
    promotion_to_mark.belongsTo(promotions, { foreignKey: "promotion_id" });
    promotions.belongsToMany(mark, {
        through: "promotion_to_mark",
        foreignKey: "promotion_id",
        otherKey: 'mark_id',
        as: 'marks'
    });

    product.hasMany(product_testimonials, { foreignKey: 'origin_product_id', sourceKey: 'id' });
    product_testimonials.belongsTo(product, { foreignKey: 'origin_product_id', sourceKey: 'id' });


    product.hasMany(product_content, { foreignKey: 'product_id', sourceKey: 'id' });
    product_content.belongsTo(product, { foreignKey: 'product_id', sourceKey: 'id' });
    product_content.belongsTo(uploaded_files, { as: "block_image", foreignKey: 'block_image_id', sourceKey: 'id' });


    attribute.hasMany(attribute_ranges, { foreignKey: 'origin_attribute_id', sourceKey: 'id' });
    attribute_ranges.belongsTo(attribute, { foreignKey: 'origin_attribute_id', sourceKey: 'id' });

    //attribute_ranges.belongsTo(attribute, { as: "attribute_range", foreignKey: 'origin_attribute_id', sourceKey: 'id' });

    attribute.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    attribute.belongsTo(attribute_groups, { foreignKey: 'group_atr', sourceKey: 'id' });

    product_to_attribute.belongsTo(attribute, { foreignKey: 'attribute_id', sourceKey: 'id' });

    product_to_attribute.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    product_to_attribute.belongsTo(uploaded_files, { as: "preview_image", foreignKey: 'preview_image_id', sourceKey: 'id' });

    steps.hasMany(attribute_groups, { foreignKey: 'step_id', sourceKey: 'id' });
    attribute_groups.belongsTo(steps, { foreignKey: 'step_id', sourceKey: 'id' });

    product_favorites.belongsTo(product, {foreignKey:'product_id',sourceKey:'id'})


//NEW
    service.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });
    service.belongsTo(uploaded_files, { as: "image_prev", foreignKey: 'image_prev_id', sourceKey: 'id' });


    service_category.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });


    reviews.belongsTo(uploaded_files, { as: "icon", foreignKey: 'icon_id', sourceKey: 'id' });
    reviews.belongsTo(uploaded_files, { as: "user_image", foreignKey: 'user_image_id', sourceKey: 'id' });

    faq.hasOne(faqs_content,{ as: "first_comment", foreignKey: 'faq_id', sourceKey: 'id' })



    service.hasMany(service_form, {foreignKey: 'service_id', sourceKey: 'id' });

    service_form.hasMany(service_form_field, { foreignKey: 'service_form_id', sourceKey: 'id' });

    service_form.belongsTo(uploaded_files, { as: "image", foreignKey: 'image_id', sourceKey: 'id' });

    service.belongsToMany(service_category, {
        through: "service_to_category",
        as: "service_category",
        foreignKey: "service_id"
    });

    service_category.belongsToMany(service, {
        through: "service_to_category",
        as: "service_category",
        foreignKey: "service_category_id"
    });
    service.hasMany(service_content, { foreignKey: 'service_id', sourceKey: 'id' });
    service_content.belongsTo(service, { foreignKey: 'service_id', sourceKey: 'id' });

    service.hasMany(service_additional_files, { foreignKey: 'service_id', sourceKey: 'id' });
    service_additional_files.belongsTo(service, { foreignKey: 'service_id', sourceKey: 'id' });

    service_content.belongsTo(uploaded_files, { as: "block_image", foreignKey: 'block_image_id', sourceKey: 'id' });

    service_category.hasMany(service_category_content, { foreignKey: 'service_category_id', sourceKey: 'id' });
    service_category_content.belongsTo(service_category, { foreignKey: 'service_category_id', sourceKey: 'id' });

    service_category_content.belongsTo(uploaded_files, { as: "block_image", foreignKey: 'block_image_id', sourceKey: 'id' });

    orders.hasMany(orders_form_results, { foreignKey: 'orders_id', sourceKey: 'id' });

    order_statuses.hasMany(orders, { foreignKey: 'status', sourceKey: 'id' });
    orders.belongsTo(order_statuses, { foreignKey: 'status', sourceKey: 'id' });

    orders.belongsToMany(user_uploaded_files, {
        through: "orders_to_user_uploaded_files",
        as: "order_files",
        foreignKey: "order_id"
    });
    user_uploaded_files.belongsToMany(orders, {
        through: "orders_to_user_uploaded_files",
        as: "order_files",
        foreignKey: "user_uploaded_files_id"
    });
    orders.belongsToMany(user_uploaded_files, {
        through: "order_images_to_user_uploaded_files",
        as: "order_images",
        foreignKey: "order_id"
    });
    user_uploaded_files.belongsToMany(orders, {
        through: "order_images_to_user_uploaded_files",
        as: "order_images",
        foreignKey: "user_uploaded_files_id"
    });
    user.belongsToMany(notifications, {
        through: "user_to_notifications",
        as: "user_notifications",
        foreignKey: "user_id"
    });
    notifications.belongsToMany(user, {
        through: "user_to_notifications",
        as: "user_notifications",
        foreignKey: "notification_id"
    });

    user.hasOne(user_uploaded_files, { as: "user_contract", foreignKey: 'id', sourceKey: 'contract_id' });

}

module.exports = { associations };
