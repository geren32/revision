const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('product_to_uploaded_files', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        uploaded_files_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'product_to_uploaded_files',
        timestamps: false,

    });
};