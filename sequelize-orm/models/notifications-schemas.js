const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('notifications', {
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
                type:DataTypes.CHAR(2),
            },
            link: {
                type: DataTypes.STRING(255),
            },
            text: {
                type: DataTypes.STRING(255),
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                },
            },
        },
        {
            tableName: 'notifications',
            timestamps: false
        });
};
