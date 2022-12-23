const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('admin_changes_history', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        item_id: {
            type: DataTypes.INTEGER
        },
        user_id: {
            type: DataTypes.INTEGER
        },

        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        },
        type: {
            type: DataTypes.STRING(55)
        }
    }, {
        tableName: 'admin_changes_history',
        timestamps: false
    });
};