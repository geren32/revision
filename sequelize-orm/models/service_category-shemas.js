const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    sequelize.define(
        "service_category",
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
            position:{
                type:DataTypes.INTEGER
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                }
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue() {
                    return new Date().toISOString();
                }
            },
        },
        {
            tableName: "service_category",
            timestamps: false,
        }
    );
};
