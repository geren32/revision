const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        origin_id: {
            type: DataTypes.INTEGER,
        },
        lang: {
            type: DataTypes.STRING(45),
        },
        quantity: {
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        short_description: {
            type: DataTypes.TEXT,
        },
        description: {
            type: DataTypes.TEXT,
        },
        name: {
            type: DataTypes.STRING(255),
        },
        price: {
            type: DataTypes.INTEGER,
        },
        discounted_price: {
            type: DataTypes.INTEGER,
        },
        base: {
            type: DataTypes.INTEGER,
        },
        mat: {
            type: DataTypes.INTEGER,
        },
        availability: {
            type: DataTypes.TINYINT,
        },

        sku: {
            type: DataTypes.STRING(45),
        },
        popular: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        informer:{
            type: DataTypes.TEXT,
        },
        image_id: {
            type: DataTypes.INTEGER,
        },
        hover_image_id: {
            type: DataTypes.INTEGER,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        position: {
            type: DataTypes.INTEGER,
        },
        min_s: {
            type: DataTypes.INTEGER,
        },
        max_s: {
            type: DataTypes.INTEGER,
        },
        min_h: {
            type: DataTypes.INTEGER,
        },
        max_h: {
            type: DataTypes.INTEGER,
        },
        characteristics: {
            type: DataTypes.TEXT,
        },
        characteristics_image_id: {
            type: DataTypes.INTEGER,
        },
        reviews_image_id: {
            type: DataTypes.INTEGER,
        },
        type: {
            type: DataTypes.TINYINT,
        },
        shower_type: {
            type: DataTypes.TINYINT,
        },
        show_price_from: {
            type: DataTypes.TINYINT,
        },
    }, {

        tableName: 'product',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }

    });
};