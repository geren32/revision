const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('order_statuses', {
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
        title: {
            type: DataTypes.STRING(255),
        },
        color: {
            type: DataTypes.STRING(255),
        },
        status: {
            type:DataTypes.TINYINT(1),
        },
        is_default: {
            type:DataTypes.TINYINT(1),
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
    }, {

        tableName: 'order_statuses',
        timestamps: false,
    });
};
