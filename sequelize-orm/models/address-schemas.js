const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('address', {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            street: {
                type: DataTypes.STRING(100)
            },
            self_pickup_point:{
                type:DataTypes.TEXT
            },
            apartment: {
                type: DataTypes.STRING(5)
            },
            house: {
                type: DataTypes.STRING(5)
            },
            district: {
                type: DataTypes.STRING(50)
            },
            city: {
                type: DataTypes.STRING(50)
            },
            first_name: {
                type: DataTypes.STRING(255)
            },
            last_name: {
                type: DataTypes.STRING(255)
            },
            email: {
                type: DataTypes.STRING(255)
            },
            phone: {
                type: DataTypes.STRING(20)
            },
            department: {
                type: DataTypes.STRING(255)
            },
        },
        {
            tableName: 'address',
            timestamps: false,


        });
};

