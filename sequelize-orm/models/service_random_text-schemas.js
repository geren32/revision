const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('service_random_text', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        service_id: {
            type: DataTypes.INTEGER,
        },
        text:{
            type:DataTypes.TEXT
        }
    }, {

        tableName: 'service_random_text',
        timestamps: false,
    });
};
