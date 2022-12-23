const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('promotions', {
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
        },
        date_from: {
            type: DataTypes.DATE,
        },
        date_to: {
            type: DataTypes.DATE,
        },
        date_to_timer: {
            type: DataTypes.DATE,
        },
        show_date_label: {
            type: DataTypes.TINYINT,
        },
        show_promotion_from: {
            type: DataTypes.TINYINT,
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
        description: {
            type: DataTypes.TEXT,
        },
        text: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.TINYINT,
        },
        image_id: {
            type: DataTypes.INTEGER,
        },
        image_mobile_id: {
            type: DataTypes.INTEGER,
        },
        banner_id: {
            type: DataTypes.INTEGER,
        },
        preview: {
            type: DataTypes.INTEGER,
        },
    }, {

        tableName: 'promotions',
        timestamps: false,
    });
};