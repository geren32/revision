const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('stores', {
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
        status: {
            type: DataTypes.TINYINT,
        },
        title: {
            type: DataTypes.STRING(255),
        },
        city_id: {
            type: DataTypes.INTEGER,
        },
        address: {
            type: DataTypes.STRING(255),
        },
        icon_id: {
            type: DataTypes.INTEGER,
        },
        icon_hover_id: {
            type: DataTypes.INTEGER,
        },
        map_lat: {
            type: DataTypes.STRING(255),
        },
        map_lng: {
            type: DataTypes.STRING(255),
        },
        link: {
            type: DataTypes.STRING(255),
        },
        images: {
            type: DataTypes.TEXT,
        },
        hours: {
            type: DataTypes.TEXT,
        },
        phone: {
            type: DataTypes.STRING(45),
        },
        email: {
            type: DataTypes.STRING(45),
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
        }
    }, {

        tableName: 'stores',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }

    });
};