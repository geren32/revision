const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('service_additional_files', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        title:{
            type:DataTypes.STRING(255)
        },
        tag: {
            type:DataTypes.STRING(255)
        },
        service_id:{
            type:DataTypes.INTEGER
        }
    }, {

        tableName: 'service_additional_files',
        timestamps: false,
    });
};
