const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('collections_to_mark', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        product_collections_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        mark_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'collections_to_mark',
        timestamps: false,

    });
};