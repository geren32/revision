const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('user_uploaded_files', {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            filename:{
                type:DataTypes.STRING(255)
            },
            width: {
                type: DataTypes.INTEGER
            },
            height: {
                type: DataTypes.INTEGER
            },
            size: {
                type: DataTypes.INTEGER
            },
            type: {
                type: DataTypes.STRING(255)
            },

            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                },
            },
        user_id:{
          type:DataTypes.INTEGER
        },
        level:{
          type:DataTypes.STRING(255)
        },

            file_type: {
                type: DataTypes.STRING
            }
        },
        {
            tableName: 'user_uploaded_files',
            timestamps: false
        });
};

