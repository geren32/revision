const { DataTypes } = require('sequelize');
module.exports = function(sequelize) {
    return sequelize.define('faq_category', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        origin_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        lang: {
            type: DataTypes.CHAR(2),
            allowNull: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: true
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
        }
    }, {

        tableName: 'faq_category',
        timestamps: false
    });
};
