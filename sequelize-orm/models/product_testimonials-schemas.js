const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_testimonials', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
        },
        origin_product_id: {
            type: DataTypes.INTEGER,
        },
        rating: {
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING(255),
        },
        email: {
            type: DataTypes.STRING(255),
        },
        text: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.TINYINT,
        },
        rating: {
            type: DataTypes.INTEGER,
        },
        published_at: {
            type: DataTypes.DATE,
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
        }
    }, {

        tableName: 'product_testimonials',
        timestamps: false,
        hooks: {
            beforeBulkUpdate: (obj) => {
                obj.fields.push('updated_at');
                obj.attributes.updated_at = new Date().toISOString();
            },
        }

    });
};