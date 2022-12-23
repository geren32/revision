const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('attribute_ranges', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        origin_attribute_id: {
            type: DataTypes.INTEGER,
        },
        from: {
            type: DataTypes.INTEGER,
        },
        to: {
            type: DataTypes.INTEGER,
        },
       
    }, {

        tableName: 'attribute_ranges',
        timestamps: false,
    });
};