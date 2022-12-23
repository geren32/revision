const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    sequelize.define('courts', {
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
        city:{
          type:DataTypes.STRING(255)
        },
        status: {
            type: DataTypes.TINYINT,
        },
        price:{
            type:DataTypes.STRING(255),
        },
        regions:{
            type:DataTypes.TEXT,
        },
        email:{
          type:DataTypes.STRING(255)
        },
        address:{
          type:DataTypes.STRING(255)
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

        tableName: 'courts',
        timestamps: false,
    });
};
