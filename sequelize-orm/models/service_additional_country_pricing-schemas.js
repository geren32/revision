const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    sequelize.define(
        "service_additional_country_pricing",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            ip:{
                type:DataTypes.TEXT
            },
            price:{
                type:DataTypes.INTEGER
            },
            service_id:{
                type:DataTypes.INTEGER
            }
        },
        {
            tableName: "service_additional_country_pricing",
            timestamps: false,
        }
    );
};
