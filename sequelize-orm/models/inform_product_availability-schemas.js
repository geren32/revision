const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('inform_product_availability', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING(255),
        },
        email: {
            type: DataTypes.STRING(255),
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue() {
                return new Date().toISOString();
            },
        
        },
    }, {

        tableName: 'inform_product_availability',
        timestamps: false,
    });
};