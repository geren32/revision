const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('order_images_to_user_uploaded_files', {
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
        additional_file_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
    }, {

        tableName: 'order_images_to_user_uploaded_files',
        timestamps: false,
    });
};
