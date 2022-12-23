const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('service_additional', {
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

        title:{
            type:DataTypes.STRING(255)
        },
        price:{
          type:DataTypes.INTEGER
        },
        template_doc:{
            type:DataTypes.TEXT
        }

    }, {

        tableName: 'service_additional',
        timestamps: false,
    });
};
