const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    sequelize.define(
        "service_form",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },

            origin_id: {
                type: DataTypes.INTEGER,
            },
            lang:{
                type:DataTypes.CHAR(2)
            },

            status:{
                type:DataTypes.TINYINT(1)
            },

            title:{
                type:DataTypes.STRING(255)
            },
            image_id:{
                type:DataTypes.INTEGER
            },

            type:{
                type:DataTypes.TINYINT(1)
            },
            required:{
                type:DataTypes.TINYINT(1)
            },
            step:{
                type:DataTypes.INTEGER
            },
            service_id:{
                type:DataTypes.INTEGER
            }
        },
        {
            tableName: "service_form",
            timestamps: false,
        }
    );
};
