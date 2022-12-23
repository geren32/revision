const { DataTypes } = require('sequelize');
module.exports = function(sequelize) {
    return sequelize.define('faqs_content', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        faq_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        group_number: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        group_type: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        block_title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        block_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sequence_number: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        block_image_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        is_content: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        image_left: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        video_link: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        images: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {

        tableName: 'faqs_content',
        timestamps: false
    });
};
