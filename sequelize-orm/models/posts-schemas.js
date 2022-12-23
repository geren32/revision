const { DataTypes } = require('sequelize');
const config = require('../../configs/config');

module.exports = (sequelize) => {

    sequelize.define('posts', {
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
            description:{
                type:DataTypes.TEXT
            },
            image_id: {
                type: DataTypes.INTEGER,
            },
            status: {
                type: DataTypes.TINYINT,
                defaultValue: config.GLOBAL_STATUSES.WAITING
            },
            position: {
                type: DataTypes.INTEGER,
            },
            created_user_id: {
                type: DataTypes.INTEGER,
            },
            updated_user_id: {
                type: DataTypes.INTEGER,
            },
            type: {
                type: DataTypes.INTEGER,
            },
            preview: {
                type: DataTypes.INTEGER
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                },
            },
            published_at: {
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
        },

        {
            tableName: 'posts',
            timestamps: false,
            hooks: {
                beforeBulkUpdate: (obj) => {
                    obj.fields.push('updated_at');
                    obj.attributes.updated_at = new Date().toISOString();
                },
            }
        });
};
