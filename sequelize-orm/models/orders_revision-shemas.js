const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('orders_revision', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },

        orders_id: {
            type: DataTypes.INTEGER,
        },
        message: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },

    }, {

        tableName: 'orders_revision',
        timestamps: false,


    });
};
