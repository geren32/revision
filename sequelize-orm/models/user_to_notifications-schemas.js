const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('user_to_notifications', {
            user_id: {
                type: DataTypes.INTEGER,
            },
            notification_id: {
                type: DataTypes.INTEGER,
            },
            is_read: {
                type: DataTypes.INTEGER,
            },
        },
        {
            tableName: 'user_to_notifications',
            timestamps: false
        });
};
