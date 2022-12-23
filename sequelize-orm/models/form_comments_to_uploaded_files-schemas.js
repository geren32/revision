const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('form_comments_to_uploaded_files', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        form_comment_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        uploaded_files_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
    }, {

        tableName: 'form_comments_to_uploaded_files',
        timestamps: false,
    });
};
