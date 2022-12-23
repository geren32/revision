const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('recommended_products', {
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
        product_recommended: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'recommended_products',
        timestamps: false,

    });
};