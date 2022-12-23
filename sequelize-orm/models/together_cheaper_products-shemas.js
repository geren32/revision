const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('together_cheaper_products', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_promotional_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_promotional_price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'together_cheaper_products',
        timestamps: false,

    });
};