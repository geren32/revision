const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('uploaded_files', {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            origin_id: {
                type: DataTypes.INTEGER,
            },
            lang: {
                type: DataTypes.STRING,
            },
            type: {
                type: DataTypes.STRING(45)
            },
            filename: {
                type: DataTypes.TEXT
            },
            filenameWebp: {
                type: DataTypes.STRING(255),
                allowNull: true
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
            alt_text: {
                type: DataTypes.TEXT
            },
            description: {
                type: DataTypes.TEXT
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                },
            },

            file_type: {
                type: DataTypes.STRING
            }
        },
        {
            tableName: 'uploaded_files',
            timestamps: false
        });
};

