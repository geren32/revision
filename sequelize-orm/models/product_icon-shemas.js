const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_icon', {
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        color: {
            type: DataTypes.STRING(255),
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
        uploaded_images_id: {
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.INTEGER,
        },
    }, {
        tableName: 'product_icon',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};