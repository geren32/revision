const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('promotion_to_mark', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        promotion_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        mark_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {

        tableName: 'promotion_to_mark',
        timestamps: false,
    });
};