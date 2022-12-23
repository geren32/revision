const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('form_comments', {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            form_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING(50),
                // allowNull: false
            },
            message: {
                type: DataTypes.TEXT,
            },
            name: {
                type: DataTypes.STRING(50),
                allowNull: false
            }, 
            phone: {
                type: DataTypes.STRING(20)
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                },
               
            }
        },
        {
            tableName: 'form_comments',
            timestamps: false
        });
};
