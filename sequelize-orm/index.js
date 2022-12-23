const { Sequelize } = require('sequelize');
const { associations } = require('./associations');
const appUtils = require('../utils/app-util');
const log = require('../utils/logger');

const options = appUtils.getArgs();
const mysqlUrl = options['mysql-url'];
const mysqlUser = options['mysql-user'];
const mysqlPassword = options['mysql-password'];
const mysqlDb = options['mysql-db'];

log.info(`Creating connection to mysql: ${mysqlUrl}`);

const sequelize = new Sequelize(mysqlDb, mysqlUser, mysqlPassword, {
    host: mysqlUrl,
    dialect: 'mysql',
    logging: false
        //dialectOptions: { options: { encrypt: true } }
});

const modelDefiners = [
    require('./models/admin_comments_in_orders-schemas'),
    require('./models/session-schemas'),
    require('./models/user_address-schemas'),
    require('./models/city-schemas'),
    require('./models/promocode-schemas'),
    require('./models/user-schemas'),
    require('./models/pages-schemas'),
    require('./models/address-schemas'),
    require('./models/product_testimonials-schemas'),
    require('./models/stores-schemas'),
    require('./models/mark-schemas'),
    require('./models/promotion_to_mark-schemas'),
    require('./models/promotions_content-schemas'),
    require('./models/promotions-schemas'),
    require('./models/orders-schemas'),
    require('./models/orders_form_results'),
    require('./models/orders_revision-shemas'),
    require('./models/product-schemas'),
    require('./models/product_to_attribute-schemas'),
    require('./models/attribute-schemas'),
    require('./models/product_to_category-schemas'),
    require('./models/product_category-shemas'),
    require('./models/posts-schemas'),
    require('./models/product_to_mark-schemas'),
    require('./models/recommended_products-shemas'),
    require('./models/product_to_uploaded_files-shemas'),
    require('./models/cart-schemas'),
    require('./models/links-schemas'),
    require('./models/uploaded_files-schemas'),
    require('./models/admin_changes_history-schemas'),
    require('./models/meta-data-schemas'),
    require('./models/product_favorites-schemas'),
    require('./models/form-comments-schemas'),
    require('./models/forms-schemas'),
    require('./models/pages_content-schema'),
    require('./models/configs-schemas'),
    require('./models/posts_content-schemas'),
    require('./models/together_cheaper_products-shemas'),
    require('./models/inform_product_availability-schemas'),
    require('./models/product_category_to_attribute-schemas'),
    require('./models/product_content-schemas'),
    require('./models/attribute_ranges-schemas'),
    require('./models/attribute_groups-schemas'),
    require('./models/steps-schemas'),
    require('./models/attribute_values-schemas'),
    require('./models/product_variations-schemas'),


    require('./models/service-shemas'),
    require('./models/service_additional-schemas'),
    require('./models/service_additional_country_pricing-schemas'),
    require('./models/service_additional_files-schemas'),
    require('./models/service_content-shemas'),
    require('./models/service_form-shemas'),
    require('./models/service_from_feild-shemas'),
    require('./models/service_category-shemas'),
    require('./models/service_category_content-shemas'),
    require('./models/service_to_category-shemas'),
    require('./models/service_random_text-schemas'),
    require('./models/reviews-shemas'),
    require('./models/faq-shemas'),
    require('./models/faq_category-schemas'),
    require('./models/faq_content-shemas'),
    require('./models/user_uploaded_files-shemas'),
    require('./models/orders_to_user_uploaded_files-shemas'),
    require('./models/courts-schemas'),
    require('./models/order_statuses-schemas'),
    require('./models/notifications-schemas'),
    require('./models/user_to_notifications-schemas'),
    require('./models/service_country_pricing-schemas'),
    require('./models/order_images_to_user_uploaded_files-schemas'),
    require('./models/form_comments_to_uploaded_files-schemas')
];

// Define all models according to their files.
for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

// Execute extra setup after the models are defined, such as adding associations.
associations(sequelize);


// Export the sequelize connection instance to be used around our app.
module.exports = sequelize;
