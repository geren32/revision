const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_variations', {
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
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING(255)
        },
        price: {
            type: DataTypes.INTEGER
        },
        discounted_price: {
            type: DataTypes.INTEGER,
        },
        sku: {
            type: DataTypes.STRING(45)
        },
        
    }, {

        tableName: 'product_variations',
        timestamps: false,

    });
};