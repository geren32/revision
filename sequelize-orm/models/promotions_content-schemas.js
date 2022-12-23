const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('promotions_content', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        promotion_id: {
            type: DataTypes.INTEGER,
        },
        text: {
            type: DataTypes.TEXT,
        },
        video_link: {
            type: DataTypes.STRING(255)
        },
        images: {
            type: DataTypes.TEXT
        },
        image_left: {
            type: DataTypes.TINYINT
        },
        group_number: {
            type: DataTypes.INTEGER,
        },
        group_type: {
            type: DataTypes.STRING(45),
        },
        sequence_number: {
            type: DataTypes.INTEGER,
        },
        block_image_id: {
            type: DataTypes.INTEGER,
        },
        is_content: {
            type: DataTypes.TINYINT,
        },
        ids: {
            type: DataTypes.TEXT
        },
        title: {
            type: DataTypes.TEXT
        },
        block_button_text: {
            type: DataTypes.STRING(255)
        },
        block_button_link: {
            type: DataTypes.STRING(255)
        },
    }, {

        tableName: 'promotions_content',
        timestamps: false,
    });
};