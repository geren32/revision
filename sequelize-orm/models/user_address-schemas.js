const { DataTypes } = require('sequelize');
const config = require('../../configs/config')
module.exports = (sequelize) => {
    sequelize.define('user_address', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
        },
        house: {
            type: DataTypes.STRING(45),
        },
        city: {
            type: DataTypes.STRING(45),
        },
        street: {
            type: DataTypes.STRING(45),
        },
        apartment: {
            type: DataTypes.STRING(45),
        }
    }, {
        tableName: 'user_address',
        timestamps: false,
    });
};