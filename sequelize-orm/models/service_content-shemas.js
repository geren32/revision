const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('service_content', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        service_id: {
            type: DataTypes.INTEGER
        },
        title: {
            type: DataTypes.STRING(255)
        },
        text: {
            type: DataTypes.TEXT
        },
        text_2:{
          type:DataTypes.TEXT
        },
        group_number: {
            type: DataTypes.INTEGER
        },
        group_type: {
            type: DataTypes.STRING(45)
        },
        sequence_number: {
            type: DataTypes.INTEGER
        },
        block_image_id: {
            type: DataTypes.INTEGER
        },
        is_content: {
            type: DataTypes.TINYINT
        },
        image_left: {
            type: DataTypes.TINYINT
        },
        link: {
            type: DataTypes.TEXT
        },
        images: {
            type: DataTypes.TEXT
        },
        block_button_text:{
            type:DataTypes.STRING(255)
        },
        block_button_link:{
            type:DataTypes.STRING(255)
        },
        block_title:{
            type:DataTypes.STRING(255)
        },
        block_text:{
            type:DataTypes.TEXT
        },
        ids:{
            type:DataTypes.STRING(255)
        },
        section_number: {
            type: DataTypes.INTEGER
        },
        section_title: {
            type: DataTypes.TEXT
        },
        social_link_1:{
            type:DataTypes.STRING(255)
        },
        social_link_2:{
            type:DataTypes.STRING(255)
        },
        social_link_3:{
            type:DataTypes.STRING(255)
        },
        social_icon_1:{
            type:DataTypes.STRING(255)
        },
        social_icon_2:{
            type:DataTypes.STRING(255)
        },
        social_icon_3:{
            type:DataTypes.STRING(255)
        },
        image_id:{
          type:DataTypes.INTEGER
        }
    }, {
        tableName: 'service_content',
        timestamps: false,
    });
};
