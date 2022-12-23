const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_to_icon', {
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
        icon_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'product_to_icon',
        timestamps: false,

    });
};