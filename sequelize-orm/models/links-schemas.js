const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('links', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        slug: {
            type: DataTypes.STRING(255)
        },
        original_link: {
            type: DataTypes.STRING(255)
        },
        type: {
            type: DataTypes.STRING(255)
        },
        lang: {
            type: DataTypes.CHAR(2),
            allowNull: true
          }
    }, {
        tableName: 'links',
        timestamps: false
    });
};