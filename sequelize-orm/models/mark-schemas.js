const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('mark', {
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
            type: DataTypes.STRING(45),
        },
        type: {
            type: DataTypes.STRING(45),
        },
        title: {
            type: DataTypes.STRING(255),
        },
        color: {
            type: DataTypes.STRING(255),
        },
        image_id: {
            type: DataTypes.INTEGER,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        status: {
            type: DataTypes.INTEGER,
        },
        position: {
            type: DataTypes.INTEGER,
        },
    }, {

        tableName: 'mark',
        timestamps: false,
    });
};