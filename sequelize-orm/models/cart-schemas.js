const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('cart', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        total_price: {
            type: DataTypes.INTEGER
        },
        user_id: {
            type: DataTypes.STRING(255)
        },
        status: {
            type: DataTypes.TINYINT
        },
        product_id: {
            type: DataTypes.INTEGER
        },
        quantity: {
            type: DataTypes.INTEGER
        },
        product_s: {
            type: DataTypes.INTEGER
        },
        product_h: {
            type: DataTypes.INTEGER
        },
        product_l: {
            type: DataTypes.INTEGER
        },
        product_l1: {
            type: DataTypes.INTEGER
        },
        product_l2: {
            type: DataTypes.INTEGER
        },
        product_m: {
            type: DataTypes.INTEGER
        },
        product_d: {
            type: DataTypes.INTEGER
        },
        final_price: {
            type: DataTypes.INTEGER
        },
        product_collection: {
            type: DataTypes.TEXT
        },
        general_options: {
            type: DataTypes.TEXT
        },
        additional_options: {
            type: DataTypes.TEXT
        },
        variation_id: {
            type: DataTypes.INTEGER
        },
        product_collection_length: {
            type: DataTypes.INTEGER
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
    }, {
        tableName: 'cart',
        timestamps: false
    });
};