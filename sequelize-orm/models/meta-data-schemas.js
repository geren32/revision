const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('meta_data', {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            url: {
                type: DataTypes.STRING(255)
            },
            meta_title: {
                type: DataTypes.STRING(255)
            },
            meta_desc: {
                type: DataTypes.STRING(255)
            },
            meta_keys: {
                type: DataTypes.STRING(255)
            },
            meta_canonical: {
                type: DataTypes.STRING(255)
            }
        },
        {
            tableName: 'meta_data',
            timestamps: false
        });
};
