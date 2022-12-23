const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('attribute_values', {
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
        origin_attribute_id: {
            type: DataTypes.INTEGER
        },
        value: {
            type: DataTypes.STRING(255),
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

        tableName: 'attribute_values',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};