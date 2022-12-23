const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('forms', {
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
            allowNull: false,
        },
        text: {
            type: DataTypes.STRING(255),
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        emails: {
            type: DataTypes.TEXT
        },
        type: {
            type: DataTypes.INTEGER
        },
        popup_title: {
            type: DataTypes.TEXT
        },
        popup_text: {
            type: DataTypes.TEXT
        },
        popup_icon_id: {
            type: DataTypes.INTEGER
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
        tableName: 'forms',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            }
        }
    });
};