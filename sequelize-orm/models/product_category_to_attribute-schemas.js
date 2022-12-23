const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_category_to_attribute', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        product_category_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        attribute_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        }
    }, {

        tableName: 'product_category_to_attribute',
        timestamps: false,
    });
};