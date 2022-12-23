const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_category', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true
        },
        origin_id: {
            type: DataTypes.INTEGER,
        },
        lang: {
            type: DataTypes.STRING(45),
        },
        title: {
            type: DataTypes.STRING(255),
        },
        attribute_groups: {
            type: DataTypes.TEXT
        },
        parent_id: {
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
        image_id: {
            type: DataTypes.INTEGER,
        },
        configurator_image_id: {
            type: DataTypes.INTEGER,
        },
        characteristics_image_id: {
            type: DataTypes.INTEGER,
        },
        reviews_image_id: {
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.TINYINT,
        },
        seo_title: {
            type: DataTypes.TEXT,
        },
        seo_text: {
            type: DataTypes.TEXT,
        },
        seo_hidden_text: {
            type: DataTypes.TEXT,
        },
        position: {
            type: DataTypes.INTEGER,
        },
    }, {
        tableName: 'product_category',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};