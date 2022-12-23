const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('attribute', {
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
        value: {
            type: DataTypes.TEXT
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.TINYINT,
        },
        type: {
            type: DataTypes.TEXT,
        },
        group_atr: {
            type: DataTypes.INTEGER,
        },
        unit_of_measurement: {
            type: DataTypes.STRING(45),
        },
        position: {
            type: DataTypes.INTEGER,
        },
        base: {
            type: DataTypes.INTEGER,
        },
        mat: {
            type: DataTypes.INTEGER,
        },
        price: {
            type: DataTypes.INTEGER,
        },
        price_type: {
            type: DataTypes.INTEGER,
        },
        mirror_thickness: {
            type: DataTypes.INTEGER,
        },
        no_option: {
            type: DataTypes.TINYINT,
        },
        image_id: {
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

        tableName: 'attribute',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }
    });
};