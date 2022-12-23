const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('pages_content', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        page_id: {
            type: DataTypes.INTEGER
        },
        title: {
            type: DataTypes.STRING(255)
        },
        text: {
            type: DataTypes.TEXT
        },
        text_2: {
            type: DataTypes.TEXT
        },
        image_id: {
            type: DataTypes.INTEGER
        },
        image_mobile_id: {
            type: DataTypes.INTEGER
        },
        link: {
            type: DataTypes.TEXT
        },
        link_title: {
            type: DataTypes.TEXT
        },
        section_number: {
            type: DataTypes.INTEGER
        },
        section_title: {
            type: DataTypes.TEXT
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
        email: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        lat: {
            type: DataTypes.STRING(255)
        },
        lng: {
            type: DataTypes.STRING(255)
        },
        zoom: {
            type: DataTypes.STRING(255)
        },
        array_ids: {
            type: DataTypes.STRING(255)
        },
        name: {
            type: DataTypes.STRING(255)
        },
        section_icon_id: {
            type: DataTypes.INTEGER
        },
        block_image_id: {
            type: DataTypes.INTEGER
        },
        block_image_hover_id: {
            type: DataTypes.INTEGER
        },
        block_title: {
            type: DataTypes.STRING(255)
        },
        block_text: {
            type: DataTypes.TEXT
        },
        block_link: {
            type: DataTypes.TEXT
        },
        block_lat: {
            type: DataTypes.STRING(255)
        },
        block_lng: {
            type: DataTypes.STRING(255)
        },
        block_map_background_image_id: {
            type: DataTypes.INTEGER
        },
        block_map_image_id: {
            type: DataTypes.INTEGER
        },
        block_email: {
            type: DataTypes.STRING(255)
        },
        block_phone: {
            type: DataTypes.STRING(255)
        },
        block_address: {
            type: DataTypes.STRING(255)
        },
        block_item_id: {
            type: DataTypes.INTEGER
        },
        block_array_ids: {
            type: DataTypes.STRING(255)
        },
        is_content: {
            type: DataTypes.TINYINT
        },
        image_left: {
            type: DataTypes.TINYINT
        },
        marker_lat: {
            type: DataTypes.STRING(255)
        },
        marker_lng: {
            type: DataTypes.STRING(255)
        },
        block_button_text: {
            type: DataTypes.STRING(255)
        },
        block_button_link: {
            type: DataTypes.STRING(255)
        },
        block_context: {
            type: DataTypes.STRING(255)
        },
        ids: {
            type: DataTypes.STRING(255)
        },
        images: {
            type: DataTypes.TEXT
        },
        video_link: {
            type: DataTypes.TEXT
        },
        date: {
            type: DataTypes.STRING(45)
        },
        form_id: {
            type: DataTypes.STRING(45)
        },
        block_video_id: {
            type: DataTypes.STRING(45)
        },
        block_video_link: {
            type: DataTypes.STRING(255)
        },
        block_images: {
            type: DataTypes.STRING(45)
        },
        block_image_left: {
            type: DataTypes.STRING(45)
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
        banner_image_id:{
            type:DataTypes.INTEGER
        }
    }, {
        tableName: 'pages_content',
        timestamps: false,
    });
};
