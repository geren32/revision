const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('attribute_groups', {
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
        video_links: {
            type: DataTypes.TEXT
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        text: {
            type: DataTypes.TEXT
        },
        hint_text: {
            type: DataTypes.TEXT
        },
        type: {
            type: DataTypes.TINYINT,
        },
        status: {
            type: DataTypes.TINYINT,
        },
        position: {
            type: DataTypes.INTEGER,
        },
        step_id: {
            type: DataTypes.INTEGER,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            }
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            }
        }
    }, {

        tableName: 'attribute_groups',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};