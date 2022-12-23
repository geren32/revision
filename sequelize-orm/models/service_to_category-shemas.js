const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('service_to_category', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        service_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {

        tableName: 'service_to_category',
        timestamps: false,
    });
};
