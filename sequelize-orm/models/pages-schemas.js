const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('pages', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        origin_id: {
            type: DataTypes.INTEGER
        },
        lang: {
            type: DataTypes.STRING(45)
        },
        title: {
            type: DataTypes.STRING(255)
        },
        description:{
          type:DataTypes.TEXT
        },
        type: {
            type: DataTypes.STRING(255)
        },
        status: {
            type: DataTypes.TINYINT
        },
        template: {
            type: DataTypes.STRING(255)
        },
        created_user_id: {
            type: DataTypes.INTEGER
        },
        updated_user_id: {
            type: DataTypes.INTEGER
        },
        preview: {
            type: DataTypes.INTEGER,
        },
        position: {
            type: DataTypes.INTEGER,
        },
        banner_image_id: {
            type: DataTypes.INTEGER
        },
        banner_image_mobile_id: {
            type: DataTypes.INTEGER
        },
        background_image_id: {
            type: DataTypes.INTEGER
        },
        background_image_mobile_id: {
            type: DataTypes.INTEGER
        },
        faq:{
            type:DataTypes.TEXT
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
    }, {
        tableName: 'pages',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};
