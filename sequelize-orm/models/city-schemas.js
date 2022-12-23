const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('city', {
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
            type: DataTypes.STRING(45),
        },
        status: {
            type: DataTypes.TINYINT,
        },
        region_id:{
          type:DataTypes.INTEGER,
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

        tableName: 'city',
        timestamps: false,
    });
};
