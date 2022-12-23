const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('orders_to_user_uploaded_files', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        order_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        user_uploaded_files_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        hash_file:{
            type:DataTypes.STRING(255)
        },
        type: {
            type:DataTypes.STRING(255)
        }
    }, {

        tableName: 'orders_to_user_uploaded_files',
        timestamps: false,
    });
};
