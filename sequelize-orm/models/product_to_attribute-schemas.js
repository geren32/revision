const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_to_attribute', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        attribute_id: {
            type: DataTypes.INTEGER,
        },
        value: {
            type: DataTypes.TEXT,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_default: {
            type: DataTypes.TINYINT,
        },
        image_id: {
            type: DataTypes.INTEGER,
        },
        preview_image_id: {
            type: DataTypes.INTEGER,
        },
        no_option: {
            type: DataTypes.TINYINT,
        },
        h: {
            type: DataTypes.INTEGER,
        },
        s: {
            type: DataTypes.INTEGER,
        },
        base: {
            type: DataTypes.INTEGER,
        },
        mat: {
            type: DataTypes.INTEGER,
        },
        price: {
            type: DataTypes.INTEGER,
        },
        dependent_atr_id: {
            type: DataTypes.INTEGER,
        },
        discount: {
            type: DataTypes.INTEGER,
        },
        discount_type: {
            type: DataTypes.TINYINT,
        },
        addition: {
            type: DataTypes.TEXT,
        },
    }, {
        tableName: 'product_to_attribute',
        timestamps: false,

    });
};