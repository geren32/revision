const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_to_mark', {
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
        mark_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'product_to_mark',
        timestamps: false,

    });
};